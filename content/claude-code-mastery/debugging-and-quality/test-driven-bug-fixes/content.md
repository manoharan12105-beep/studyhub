# Test-Driven Bug Fixes and Regression Testing

**Module:** Debugging, Testing and Code Quality · **Interview priority:** Core

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 and the hooks reference (October 2026). Test output comes from real Maven runs of orderdesk. The Stop hook script was tested by piping Stop-event JSON into it in four situations (shown below); it was not exercised inside a live Claude session.

## Definition

A **test-driven bug fix** starts with a test that fails because of the bug, then changes production code until that test — and every other test — passes. The test stays as a **regression test**, so the bug can't silently return. With an AI agent, the failing test is also the agent's **stop condition**: done means the test passes for the right reason, not that the code looks right.

## Why It Matters

- An agent asked to "make the tests pass" has two ways to succeed: fix the code, or weaken the test. Only one is a fix.
- A regression test is executable documentation of the bug and its expected behaviour.
- Tests are cheap evidence: `Tests run: 13, Failures: 0, Errors: 0` is checkable; "I fixed it" is not.

## How It Works

```text
red:    write the test from the SPECIFICATION ──► run it ──► fails for the reported reason
green:  change production code (the cause)     ──► the test passes
check:  full build                             ──► nothing else broke
guard:  review the test diff                   ──► no assertion weakened, nothing @Disabled
```

## Failure, Error and What They Tell You

The starter project's `PriceCalculatorTest`, run on its own:

**Output:**

```text
[ERROR] Tests run: 4, Failures: 0, Errors: 1, Skipped: 0, Time elapsed: 0.073 s <<< FAILURE! -- in com.example.orderdesk.order.PriceCalculatorTest
[ERROR] com.example.orderdesk.order.PriceCalculatorTest.orderWithoutDiscountCodeCostsTheSubtotal -- Time elapsed: 0.009 s <<< ERROR!
java.lang.NullPointerException: Cannot invoke "String.trim()" because "discountCode" is null
	at com.example.orderdesk.order.PriceCalculator.totalCents(PriceCalculator.java:14)
	at com.example.orderdesk.order.PriceCalculatorTest.orderWithoutDiscountCodeCostsTheSubtotal(PriceCalculatorTest.java:28)
```

| JUnit result | Meaning | Example |
|--------------|---------|---------|
| **Failure** | An assertion didn't hold | `expected: <900> but was: <899>` |
| **Error** | An unexpected exception was thrown | The `NullPointerException` above |

Both are red. An error often means the code crashed before the assertion could check anything.

## Writing the Failing Test First

The test that reproduces BUG-101 asserts the **specified** behaviour from the issue ("`totalCents` equal to `subtotalCents`"):

```java
@Test
void orderWithoutDiscountCodeCostsTheSubtotal() {
    assertEquals(2_500, calculator.totalCents(2_500, null));
}
```

The fix changes production code only:

```java
if (discountCode == null || discountCode.isBlank()) {
    return subtotalCents;
}
```

Regression tests added with the fix cover the neighbours of the bug — blank codes and rounding:

```java
@Test
void blankDiscountCodeCostsTheSubtotal() {
    assertEquals(2_500, calculator.totalCents(2_500, "   "));
}

@Test
void discountIsRoundedDownToWholeCents() {
    // 10 % of 999 cents is 99.9 cents: the discount is 99, so the total is 900.
    assertEquals(900, calculator.totalCents(999, "SAVE10"));
}
```

With the fix and the regression tests, the reference solution's full build reported `Tests run: 13, Failures: 0, Errors: 0` and `BUILD SUCCESS`.

## Keeping Regression Tests Honest

Ways an agent (or a tired human) "fixes" a red test without fixing the bug:

| Weakening | Example | How to catch it |
|-----------|---------|-----------------|
| Change the expected value | `assertEquals(899, …)` | Expected values come from the spec; diff review |
| Loosen the assertion | `assertDoesNotThrow(...)` instead of `assertEquals` | Review every change under `src/test` |
| Disable or delete | `@Disabled`, removed method | `git diff --stat -- src/test`; test count drops |
| Catch in production | `catch (NullPointerException e) { return 0; }` | Code review; the result is wrong |
| Test the mock | Mock returns the expected value; nothing real runs | Check what the test actually executes |

Guard rails you can set up:

- An instruction in CLAUDE.md: "Never change a test's expected value to match buggy output."
- An `ask` rule so test edits always need your approval: `"ask": ["Edit(/src/test/**)"]`.
- Watching the test count: a fix that reduces `Tests run:` deserves a question.
- A hook that runs the tests before Claude finishes (below).

## A Stop Hook That Runs the Tests

`.claude/hooks/test-before-stop.sh`:

```bash
#!/usr/bin/env bash
# Stop hook: when production or test code changed, run the tests before Claude may finish.
# Exit 2 sends the failure back to Claude; it never edits anything itself.
command -v jq >/dev/null 2>&1 || { echo "test-before-stop.sh needs jq." >&2; exit 2; }
input="$(cat)"

# Already continuing because of this hook: don't block again (avoids loops).
if [ "$(jq -r '.stop_hook_active' <<< "$input")" = "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 0
if [ -z "$(git status --porcelain -- src)" ]; then
  exit 0   # nothing under src/ changed: nothing to verify
fi

if ! output="$(./mvnw -q -B test 2>&1)"; then
  echo "Tests fail after your changes. Fix the cause (do not weaken tests), then run ./mvnw -B verify:" >&2
  grep -E '<<< (FAILURE|ERROR)!|^\[ERROR\]   ' <<< "$output" | head -10 >&2
  exit 2
fi
exit 0
```

Registered in `.claude/settings.json` (merge the `Stop` entry into the existing `hooks` object):

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/test-before-stop.sh" }
        ]
      }
    ]
  }
}
```

Tested by piping Stop input into the script:

| Situation | Result |
|-----------|--------|
| `"stop_hook_active": true` | exit 0 — already continued once; let the turn end |
| No changes under `src/` | exit 0 — nothing to verify |
| A change under `src/` with the rounding regression present | exit 2, message below |
| A change under `src/` with all tests passing | exit 0 |

**Output** (the failing case; stderr, which Claude receives as the reason to continue):

```text
Tests fail after your changes. Fix the cause (do not weaken tests), then run ./mvnw -B verify:
[ERROR] Tests run: 6, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 0.083 s <<< FAILURE! -- in com.example.orderdesk.order.PriceCalculatorTest
[ERROR] com.example.orderdesk.order.PriceCalculatorTest.discountIsRoundedDownToWholeCents -- Time elapsed: 0.022 s <<< FAILURE!
[ERROR]   PriceCalculatorTest.discountIsRoundedDownToWholeCents:41 expected: <900> but was: <899>
```

Limits: checking `stop_hook_active` means the hook blocks **once** per stop attempt — if the tests still fail after Claude's next try, the turn ends and you see the failure. Claude Code also caps stop-hook continuations at 8 in a row. And the hook can't tell a real fix from a weakened test — that's still your diff review.

## Syntax and Configuration

```bash
./mvnw -q test -Dtest=PriceCalculatorTest           # red, then green
./mvnw -B verify                                     # everything
git diff --stat -- src/test                          # what changed in tests?
git diff -- src/test                                 # read it
```

## Real-World Example

For the rounding regression (`expected: <900> but was: <899>`), the tempting "fix" is changing the test to 899 — a one-line diff that turns CI green. The test's comment states the rule ("the discount is 99, so the total is 900"), and the history shows the behaviour changed in a commit labelled "Refactor". The honest fix restores integer division; the test doesn't change.

## Step-by-Step Walkthrough

1. Read the specification (issue, acceptance criteria) — that's where expected values come from.
2. Write the smallest test for it; run it; confirm it fails for the reported reason.
3. Ask Claude to fix the cause without touching the test.
4. Run the test, then the full build.
5. Review `git diff -- src/test`: only additions you expected.
6. Add neighbouring regression tests (null, blank, boundaries).

## Common Mistakes

- Writing the test after the fix (it may never have failed).
- Taking expected values from the current output.
- Accepting a fix whose diff touches tests you didn't ask to change.
- Only running the single test, not the full build.
- Stop hooks that loop forever (no `stop_hook_active` check) or that run a 20-minute build on every stop.

## Security Considerations

- Security regressions deserve regression tests too (orderdesk's `searchTreatsInputAsAValueNotAsSql`).
- Hooks run with your permissions; keep them read-only apart from their own checks.
- Don't let test fixtures contain real customer data or secrets.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Test passes before the fix | Not exercising the bug | Adjust input/path until it fails for the right reason |
| Test count dropped | Deleted or disabled tests | Review the test diff |
| Stop hook makes every turn slow | Full build on every stop | Run a focused test set, or only when `src/` changed |
| Stop hook seems ignored | Not executable, jq missing, wrong path | Run it by hand with sample JSON |

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| Test first | Proven reproduction | Slower start |
| Stop hook running tests | Claude can't finish on red silently | Time per turn |
| `ask` on test edits | Every test change is seen | More prompts |

## Interview Takeaways

- Red → green → full build → review the test diff.
- Expected values come from the specification, never from current output.
- Hooks and permissions can enforce "run tests" and "ask before test edits"; diff review catches weakening.

## Key Takeaways

- A failing test is the bug's proof and the agent's stop condition.
- Watch for weakened, disabled or deleted tests.
- Keep regression tests for the bug and its neighbours.
