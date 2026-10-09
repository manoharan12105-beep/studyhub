# Verifying AI-Generated Changes

**Module:** Debugging, Testing and Code Quality · **Interview priority:** Core

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 and *Best practices* (October 2026). The compiler error below is from a real `javac` run on JDK 21. Other examples are code to read, marked as such.

## Definition

**Verifying** an AI-generated change means establishing, with evidence you can check, that it does what was asked, only that, without breaking anything — instead of accepting it because it **looks** right. Evidence is command output, test results, diffs and behaviour you observed; plausibility is a well-written summary.

## Why It Matters

- Models produce fluent, confident code and explanations. Fluency is not correctness.
- Typical AI failure modes — invented APIs, tests that assert nothing meaningful, silent scope creep, "it should work now" — all look fine at a glance.
- The documented best practice is to give Claude a check it can run, and to have it **show evidence rather than assert success**.

## How It Works

```text
change ──► compile ──► targeted tests ──► full build ──► diff review ──► behaviour check
             │              │                 │               │                │
          invented       new tests        regressions     scope, tests,     run the app /
          APIs fail      fail first?      anywhere?       secrets           the endpoint
```

Each arrow is a gate with **its own evidence**. Skipping one leaves that class of failure unchecked.

## Evidence Over Plausibility

| Claim | Evidence that settles it |
|-------|--------------------------|
| "It compiles" | Build output |
| "Tests pass" | The `Tests run: … Failures: 0, Errors: 0` line from `./mvnw -B verify` |
| "I fixed BUG-101" | The reproducing test was red before and is green now |
| "Only `PriceCalculator` changed" | `git status --short` and `git diff --stat` |
| "The endpoint returns 409" | A test or request showing status 409 |

Ask for evidence in the prompt: "Run `./mvnw -B verify` and show the final `Tests run:` line and `BUILD SUCCESS`/`FAILURE`."

## Common AI Failure Modes

**Invented APIs.** A method that sounds right but doesn't exist. The compiler catches it — if you compile:

```java
public class DiscountCodes {
    static boolean missing(String code) {
        return code.isNullOrBlank();
    }
}
```

**Output:**

```text
DiscountCodes.java:3: error: cannot find symbol
        return code.isNullOrBlank();
                   ^
  symbol:   method isNullOrBlank()
  location: variable code of type String
1 error
```

`String` has `isBlank()` and `isEmpty()`; the null check must be written explicitly (`code == null || code.isBlank()`). Invented configuration keys and CLI flags are worse: they often **don't** fail — unknown fields are silently ignored in Claude Code agent frontmatter, for example.

**Tests that test nothing.** Code to read — a test whose assertion only checks what the test itself set up:

```java
// Smell: the mock returns 2500 and the test asserts 2500. PriceCalculator never runs.
when(prices.totalCents(2_500, null)).thenReturn(2_500L);
assertEquals(2_500L, prices.totalCents(2_500, null));
```

**Silent scope creep.** The task was one null check; the diff also renames a method, reformats three files and bumps a dependency in `pom.xml`. Each extra hunk is unreviewed risk.

**Unverified "done".** "The fix should work now" with no command run. "Should" means nobody checked.

**Weakened tests.** Covered in *Test-Driven Bug Fixes*: changed expected values, `@Disabled`, deleted tests.

## Verification Loops

| Strength | Mechanism |
|----------|-----------|
| In one prompt | "Implement X, run the tests, fix failures, show the output" |
| Across a session | A `/goal` condition re-checked after every turn |
| Deterministic gate | A Stop hook that runs the check and blocks finishing on failure |
| Second opinion | A reviewer subagent or `/code-review` with a fresh context |
| Final gate | CI on the pull request, plus human review |

A reviewer told to find gaps will usually find some even in sound work; fix what affects correctness or requirements, and treat the rest as optional.

## A Checklist Before You Accept a Change

- ☐ The original failure is reproduced by a test that now passes.
- ☐ `./mvnw -B verify` output seen: all tests pass; the test count didn't drop.
- ☐ `git diff --stat` matches the plan; no unexpected files (`pom.xml`, migrations, configs).
- ☐ Test diffs only add or strengthen assertions.
- ☐ No invented APIs, settings or flags (compiled, and checked against documentation).
- ☐ No secrets, personal data or debug output added.
- ☐ Behaviour checked where tests don't reach (run the endpoint, read the log).
- ☐ The summary states what wasn't verified.

## Syntax and Configuration

```text
Fix BUG-101. Then show me, as evidence: the reproducing test failing before your change,
the same test passing after, the full ./mvnw -B verify summary, and git diff --stat.
List anything you did not verify.
```

## Real-World Example

On orderdesk, a plausible BUG-101 fix that only adds the null check passes every test and looks complete. The checklist's "behaviour checked where tests don't reach" step — reproducing the report's second symptom (failed creates are still stored) — shows it isn't: the row stays unless `create()` is transactional. Evidence found what plausibility missed.

## Step-by-Step Walkthrough

1. Before work: define the evidence that will prove success.
2. During work: require commands and their real output, not descriptions.
3. After work: run the build yourself (or read its unedited output), read the whole diff.
4. Check behaviour outside the tests where the change matters.
5. Record what wasn't verified in the PR description.

## Common Mistakes

- Accepting summaries instead of output.
- Running only the new test, not the full build.
- Reviewing the production diff but not the test diff.
- Trusting configuration that "loaded fine" when unknown keys are silently ignored.
- Treating a second AI's agreement as verification.

## Security Considerations

- Check new dependencies and versions in `pom.xml` — invented or typo-squatted package names are a supply-chain risk.
- Look for secrets, tokens and personal data added to code, tests or logs.
- Verify that validation and authorization weren't removed to make something "work".

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Tests pass" but CI fails | Different command, profile or JDK | Use the same command as CI |
| Settings/agent change has no effect | Invented or misspelled key ignored | Check against the documentation; validate |
| Test count dropped | Tests deleted or disabled | Review `src/test` diff |
| Diff larger than expected | Scope creep | Revert unrelated hunks |

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| Full checklist | Few surprises | Time on every change |
| Automated gates (hooks, CI) | Consistent | Setup; can be slow |
| Spot checks only | Fast | Classes of failure go unchecked |

## Interview Takeaways

- Evidence over plausibility: command output, tests, diffs, observed behaviour.
- Know the failure modes: invented APIs, empty tests, scope creep, unverified "done", weakened tests.
- Verification loops from prompts to hooks to CI; humans read the diff.

## Key Takeaways

- Compile, test, build, diff, observe — each catches different mistakes.
- Silent failures (ignored config keys) need documentation checks.
- Write down what wasn't verified.
