# Code Review, Reviewing Diffs and Pull Request Preparation — Practice

### P1. Which command finds bugs?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** review commands

You want Claude to look for correctness bugs in your branch. Which command?

- A) `/simplify`
- B) `/code-review`
- C) `/diff`
- D) `/compact`

<details>
<summary>Answer</summary>

**Answer:** B) `/code-review`

`/simplify` is a cleanup review that doesn't hunt for bugs; `/diff` only shows changes.

</details>

### P2. Does AI review block merges?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** advisory review

The managed Code Review service finds an Important issue on a PR. What happens to the PR?

- A) It is blocked until fixed
- B) It is approved after the fix is pushed
- C) Nothing automatically — findings are comments; existing review rules decide
- D) The branch is reverted

<details>
<summary>Answer</summary>

**Answer:** C) Nothing automatically — findings are comments; existing review rules decide

Code Review doesn't approve or block pull requests.

</details>

### P3. Review this hunk

**Difficulty:** Medium · **Type:** Code review · **Concepts:** reading with intent

The task was BUG-101. What do you ask about this hunk?

```java
-        assertEquals(2_500, calculator.totalCents(2_500, null));
+        assertDoesNotThrow(() -> calculator.totalCents(2_500, null));
```

<details>
<summary>Answer</summary>

Why was a precise assertion replaced by a weaker one? The new test passes even if the total is wrong (for example 0). The bug report expects `totalCents` equal to the subtotal, so the original assertion is the specification. Reject the change; fix the code instead.

</details>

### P4. Fix outside checkpoints

**Difficulty:** Medium · **Type:** Failure diagnosis · **Concepts:** --fix

You ran `/code-review --fix` (in the background) and dislike one applied fix. `/rewind` doesn't remove it. Why, and how do you undo it?

<details>
<summary>Answer</summary>

A background review applies its `--fix` edits outside your session's checkpoints, so `/rewind` doesn't restore them. Use Git: `git diff` to see the edit, then `git restore -p <file>` (or `git checkout -- <file>` for the whole file, if nothing else changed there).

</details>

### P5. Security review needs a remote

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** /security-review

In a local-only practice repository, `/security-review` fails with an `ambiguous argument` error. Explain.

<details>
<summary>Answer</summary>

It reviews the diff between your branch and origin's default branch, so it needs an `origin` remote with a known default branch. In a repository without one, use `/code-review` with a range or a security-focused reviewer subagent instead.

</details>

### P6. Write the PR description

**Difficulty:** Medium · **Type:** Workflow design · **Concepts:** PR preparation

Write a PR description for the BUG-101 fix (null discount code) including the transaction fix.

<details>
<summary>Answer</summary>

```markdown
## BUG-101: Orders without a discount code fail

**What:** `PriceCalculator.totalCents` returns the subtotal for a null or blank code
(it called `trim()` on null). `OrderController.create` is now `@Transactional`, so a failed
create no longer leaves a stored order.

**Verified:** `./mvnw -B verify` — all tests pass, including the regression tests
`orderWithoutDiscountCodeCostsTheSubtotal`, `blankDiscountCodeCostsTheSubtotal` and
`readsAnOrderWithoutDiscountCode`.

**Not verified:** existing rows created by failed requests before this fix are not cleaned up.

**Review focus:** the transaction boundary on `create`.
```

</details>

### P7. Too many findings

**Difficulty:** Hard · **Type:** Trade-off · **Concepts:** validation

`/code-review max` returns 14 findings for a 30-line change. How do you decide what to act on?

<details>
<summary>Answer</summary>

Validate each against the code and the requirements: keep findings that are real and affect correctness, security or stated requirements; reject ones citing code that isn't there; treat style and "might be nice" items as optional. A gap-finding review usually reports something; acting on everything leads to over-engineering. Consider `/code-review low` for fewer, higher-confidence findings.

</details>

### P8. Mixed PR

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** PR scope

Your branch contains the FEAT-7 change, a rename of `OrderSearchDao` to `OrderSearchRepository`, and reformatting of five files. What do you do before opening the PR?

<details>
<summary>Answer</summary>

Split it: keep FEAT-7 on its branch, move the rename and the formatting to separate branches/PRs (for example by resetting those files and redoing them elsewhere, or with interactive staging into separate commits and branches). One purpose per PR keeps the review focused and makes reverting safe.

</details>
