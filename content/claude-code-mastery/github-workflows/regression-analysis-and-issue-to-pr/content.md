# Regression Analysis and the Issue-to-PR Workflow

**Module:** Git and GitHub Workflows · **Interview priority:** Frequently asked

> [!NOTE]
> **Checked against:** Claude Code v2.1.289, *Best practices*, *MCP* and *GitHub Actions* documentation (October 2026). The `git bisect` run below is real, on a local orderdesk repository with five commits (commit hashes will differ on your machine). No GitHub repository, `gh` command, MCP server or `@claude` mention was used.

## Definition

**Regression analysis** finds *when* and *why* something that used to work stopped working, using evidence: the failing test, the history (`git log`, `git bisect`), and the change that introduced it. The **issue-to-PR workflow** takes a reported problem from the tracker to a reviewed pull request: read the issue, reproduce, find the cause, fix with a regression test, verify, and prepare the PR — with a human deciding when to push and merge.

## Why It Matters

- "It broke after the refactor" is a hypothesis. Bisect turns it into a commit hash in a handful of builds.
- Fixing a regression without knowing the introducing change risks reverting something deliberate or fixing the wrong layer.
- Claude can read issues and history quickly, but its explanation of a failure is still a claim until a test reproduces it.

## How It Works

```text
issue / failing CI ──► reproduce locally (one failing test)
                          │
                          ▼
             last known good ──── git bisect run <test> ──── first bad commit
                          │
                          ▼
             read that commit's diff ──► root cause ──► fix + regression test
                          │
                          ▼
                verify ──► PR description (links issue, cites evidence) ──► human review
```

## Analyzing Test Failures

Start from the exact failure, not a summary of it. On orderdesk, a refactor made `PriceCalculatorTest` fail:

**Output:**

```text
[ERROR] Tests run: 6, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 0.134 s <<< FAILURE! -- in com.example.orderdesk.order.PriceCalculatorTest
[ERROR] com.example.orderdesk.order.PriceCalculatorTest.discountIsRoundedDownToWholeCents -- Time elapsed: 0.068 s <<< FAILURE!
org.opentest4j.AssertionFailedError: expected: <900> but was: <899>
```

Reading it: 10 % of 999 cents is 99.9 cents. The specification (and the test comment) says discounts round **down** to 99, giving 900. The code now produces 899, so the discount became 100: something started rounding to nearest.

A prompt that keeps Claude evidence-driven:

```text
PriceCalculatorTest.discountIsRoundedDownToWholeCents fails on main (expected 900, was 899).
Don't change the test. Find which commit introduced the failure using git history,
explain the cause from that commit's diff, then propose a fix. Show every command you run.
```

## Using git bisect

`git bisect` binary-searches history between a known-good and a known-bad commit. `git bisect run` automates it with any command that exits 0 for good and non-zero for bad — here, the one failing test class.

The history:

**Output:**

```text
08cec43 Docs: clarify totalCents comment
2e0a316 Refactor: compute discount with Math.round
d6598cf Docs: point to docs/issues
d948c4a Fix BUG-101: order without discount code
cdb089c Initial orderdesk
```

The commands (`d948c4a` is the last commit known to pass; the test class doesn't exist before it):

```bash
git bisect start HEAD d948c4a
git bisect run ./mvnw -o -B -q test -Dtest=PriceCalculatorTest
git bisect reset
```

**Output** (Maven's own test output removed):

```text
Bisecting: 0 revisions left to test after this (roughly 1 step)
[2e0a31678c80b411740337a47a184f218f932c20] Refactor: compute discount with Math.round
running './mvnw' '-o' '-B' '-q' 'test' '-Dtest=PriceCalculatorTest'
Bisecting: 0 revisions left to test after this (roughly 0 steps)
running './mvnw' '-o' '-B' '-q' 'test' '-Dtest=PriceCalculatorTest'
2e0a31678c80b411740337a47a184f218f932c20 is the first bad commit
```

The introducing change (`git show 2e0a316`):

```text
-        long discount = subtotalCents * percent / 100;
+        long discount = Math.round(subtotalCents * percent / 100.0);
```

`Math.round(99.9)` is 100. The "refactor" changed behaviour; the fix is to restore integer division (rounding down), keeping the test unchanged.

> [!TIP]
> `git bisect run` treats exit code 125 as "skip this commit" (for example, it doesn't compile). Keep the test command fast and specific — `-o` (offline) and one test class here.

## GitHub Integrations

| Integration | What it gives Claude | Notes |
|-------------|---------------------|-------|
| `gh` CLI | Read issues (`gh issue view 101`), PRs, comments; create PRs (`gh pr create`) | Most context-efficient; uses your `gh` login; Claude Code links sessions to PRs it creates |
| GitHub MCP server | Issues, PRs and repository data as MCP tools; `@github:issue://123` resources | Needs a token; scope it narrowly (fine-grained, specific repositories) |
| Claude Code GitHub Action | Claude runs in GitHub Actions on `@claude` mentions or a workflow prompt | Runs on GitHub's runners with repository secrets — covered in the Automation module |
| Code Review (managed) | Automated PR review comments | Research preview; Team/Enterprise |

Issue text, PR descriptions and comments are **untrusted input**: anyone who can open an issue can write instructions in it. Read-only access for reading issues, and a human decision before anything is pushed, limit what such text can cause.

## The Issue-to-PR Path

```text
1. gh issue view 101                       → read the report (or open docs/issues/BUG-101.md)
2. reproduce: one failing test             → evidence the bug exists
3. find the cause (trace, history, bisect) → cite file:line and/or the introducing commit
4. fix the cause; keep the test            → minimal diff
5. ./mvnw -B verify                        → real output
6. review the diff                         → you, /code-review, reviewers
7. PR description: "Fixes #101", evidence, gaps
8. push + open PR                          → you decide (ask rule)
```

## Syntax and Configuration

```bash
gh issue view 101                    # read an issue (requires gh auth login)
git log --oneline -- src/main/java/com/example/orderdesk/order/PriceCalculator.java
git log -S "Math.round" --oneline    # commits that added or removed this text
git blame -L 15,20 src/main/java/com/example/orderdesk/order/PriceCalculator.java
gh pr create --draft --title "Fix discount rounding regression" --body-file pr.md
```

Opening a **draft** PR keeps it out of reviewers' queues until you mark it ready.

## Real-World Example

The bisect above is the whole real-world pattern in miniature: a commit labelled "Refactor" changed a business rule, the test that encoded the rule caught it, and bisect named the commit in two builds instead of reading five diffs. In larger histories the saving grows: bisect needs about log₂(n) builds, so roughly 10 for 1,000 commits.

## Step-by-Step Walkthrough

1. Copy the exact failure (test name, assertion, stack trace) into the prompt.
2. Find a known-good commit (last release tag, last green CI run).
3. Make the check a single command that exits non-zero on failure.
4. `git bisect start <bad> <good>`; `git bisect run <command>`; `git bisect reset`.
5. Read the first bad commit's diff; state the cause.
6. Fix forward on a branch; keep or add the regression test; verify.
7. Write the PR description linking the issue and the introducing commit.

## Common Mistakes

- Changing the test's expected value to match the new output.
- Bisecting with a flaky or slow check — wrong commit or wasted hours.
- Forgetting `git bisect reset` — you stay on a detached HEAD.
- Trusting an explanation without the introducing diff.
- Letting an agent push a fix straight to the main branch.

## Security Considerations

- Treat issue and PR text as untrusted; don't give the session reading them write access to remote systems.
- Scope tokens for `gh` or the GitHub MCP server to the repositories and permissions needed.
- Never paste tokens into prompts, issues or PR descriptions.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Bisect points at a docs-only commit | Flaky test or wrong good/bad bounds | Re-run the check on both bounds; stabilize the test |
| `git bisect run` stops early | Command exit code ≥ 128 or setup failure | Make the command exit 0/1 (125 to skip) |
| `gh` commands fail | Not authenticated | `gh auth status`; `gh auth login` |
| Fix passes locally, fails in CI | Different JDK, profile or data | Reproduce with CI's command and versions |

## Trade-offs

| Approach | Benefit | Cost |
|----------|---------|------|
| `git bisect run` | Objective, fast on long histories | Needs a reliable, scriptable check |
| Reading history manually | No setup | Slow; anchors on the first suspicious commit |
| `gh` vs MCP | `gh`: simple, context-efficient; MCP: structured tools/resources | MCP adds tool definitions and a token to manage |

## Interview Takeaways

- Reproduce first, then find the introducing change (bisect), then fix the cause.
- Never weaken the test that caught the regression.
- Issue-to-PR is evidence at each step and a human push/merge.
- Issue and PR text are untrusted input.

## Key Takeaways

- A precise failure message plus `git bisect run` finds regressions objectively.
- "Refactors" can change behaviour; tests that encode rules catch them.
- Use `gh` or a narrowly scoped MCP server for GitHub data.
- Open PRs deliberately, ideally as drafts first.
