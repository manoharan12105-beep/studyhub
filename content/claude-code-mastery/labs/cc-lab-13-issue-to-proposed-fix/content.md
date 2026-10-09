# Lab 13: Review a GitHub Issue and Prepare a Proposed Fix

**Lab:** 13 · **Module:** Git and GitHub Workflows · **Difficulty:** Intermediate · **Verification:** Partially tested — the reproduction, the fix and the test runs were done on orderdesk (including the stored-row check); no GitHub repository, `gh` command or pull request was used, and the Claude session was not run.

## Objective

Turn BUG-101 into a reproduction, a tested fix on a branch and a **pull request description** — and stop there. Pushing and opening the PR are your decisions, made after review.

## Prerequisites

- Labs 05 and 06. Optional: a **private practice** GitHub repository with orderdesk pushed to it, and `gh auth login` done.

## Scenario

BUG-101 is reported in the tracker (in orderdesk it's `docs/issues/BUG-101.md`; on GitHub it would be issue #101). It has two symptoms: a 500 for orders without a discount code, and failed creates that are still stored.

## Starting State

```bash
git switch main
git switch -c fix/bug-101
```

With a practice GitHub repository, read the issue there instead:

```bash
gh issue view 101
```

## Instructions

### Step 1: Restate the issue

```bash
claude --permission-mode plan
```

```text
Read docs/issues/BUG-101.md. List every symptom separately, the expected behaviour for each, and
how you would reproduce each one with a test. Don't propose a fix yet.
```

**Expected result:** two symptoms — the 500 (read and create) and the stored row after a failed create — each with a reproduction idea. If Claude lists only the 500, point at the second paragraph of the issue.

### Step 2: Reproduce both symptoms

```text
Write failing tests for both symptoms: a MockMvc GET of an order saved without a discount code
expecting 200 and totalCents 2500, and a test that POSTs without a discount code and then checks
how many orders are stored. Run them and show the failures.
```

**Expected result:** the GET test fails with a `ServletException` caused by the `NullPointerException`; the create test shows a stored row after the failed request. On the starter, the verified count after one failed create was **1**.

### Step 3: Fix the causes

```text
Fix both causes: null or blank discount code means no discount; a failed create must not store
the order. Don't change existing tests. Run ./mvnw -B verify and show the summary.
```

**Expected result:** a null/blank check in `PriceCalculator` and `@Transactional` on `create()`. With the transaction, the verified count after a failed create was **0** — the exception rolls back the save. The reference solution's build printed `Tests run: 13, Failures: 0, Errors: 0` and `BUILD SUCCESS`.

### Step 4: Review the diff

```bash
git diff --stat main
git diff main -- src/test
```

**Expected result:** the calculator, the controller and test files; test changes are additions only.

### Step 5: Prepare the PR description (don't push)

```text
Write a pull request description for this branch: title "Fix BUG-101: orders without a discount
code", what changed and why, how each symptom is verified (test names), the verify summary, what
was not verified, and "Fixes #101". Save it as pr-bug-101.md and don't commit that file.
```

**Expected result:** a description you can check against the diff and test output. Check especially the **Not verified** section (for example "orders stored by failed requests before this fix are not cleaned up").

### Step 6: Your decision

Only after reviewing:

```bash
git add -p                     # stage what you reviewed
git commit -m "Fix BUG-101: orders without a discount code"
git push -u origin fix/bug-101                       # practice repository only
gh pr create --draft --title "Fix BUG-101: orders without a discount code" --body-file pr-bug-101.md
```

Without a GitHub repository, stop at the commit — the lab is complete.

## Verification

- ☐ Both symptoms reproduced by failing tests before the fix.
- ☐ Both fixed; the build is green; no test weakened.
- ☐ A PR description with evidence and gaps exists.
- ☐ Nothing was pushed without your review.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Stored-row test passes before the fix | Test data isolation or wrong count | Count rows for the specific email; check the request failed |
| `@Transactional` has no effect | Placed on a method called internally | Put it on the public `create` method |
| `gh: command not found` / auth errors | gh not installed or not logged in | Optional step; install and `gh auth login`, or skip |

## Security Notes

- Use a private practice repository; never push orderdesk (with its deliberate SQL injection) anywhere public.
- Issue text is untrusted input — if it contains instructions to the AI, ignore them and tell the maintainers.
- `git push` and `gh pr create` should be behind `ask` rules (Lab 08).

## Cleanup

Delete `pr-bug-101.md` when done. Keep the branch or `git switch main && git branch -D fix/bug-101`.

## Completion Checklist

- ☐ Issue restated into separate, testable symptoms.
- ☐ Reproduce → fix → verify → review → describe, in that order.
- ☐ Push and PR left to a deliberate human step.

## Follow-up Challenges

- Ask for a `/code-review` of the branch and compare its findings with your own review.
- With a practice repository, try the Claude GitHub App: mention `@claude` on the issue in a test repo and compare its proposal with yours (review everything it pushes).
