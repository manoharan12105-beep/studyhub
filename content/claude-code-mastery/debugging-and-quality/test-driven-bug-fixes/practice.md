# Test-Driven Bug Fixes and Regression Testing — Practice

### P1. Failure or error?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** JUnit results

`PriceCalculatorTest` reports `Failures: 0, Errors: 1` with a `NullPointerException`. What does "Error" mean here?

- A) An assertion compared two different values
- B) The test threw an unexpected exception
- C) The test was skipped
- D) Maven failed to compile

<details>
<summary>Answer</summary>

**Answer:** B) The test threw an unexpected exception

A failure is an assertion that didn't hold; an error is an exception the test didn't expect.

</details>

### P2. Where do expected values come from?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** specification

When writing a regression test for BUG-101, the expected `totalCents` should come from:

- A) Running the current code
- B) The issue's expected behaviour (total equals subtotal)
- C) Whatever makes the build green
- D) The previous release's logs

<details>
<summary>Answer</summary>

**Answer:** B) The issue's expected behaviour (total equals subtotal)

</details>

### P3. Spot the weakening

**Difficulty:** Medium · **Type:** Code review · **Concepts:** honest tests

Which of these test diffs are acceptable in a bug-fix PR for BUG-101? (a) added `blankDiscountCodeCostsTheSubtotal`; (b) changed `assertEquals(900, …)` to `assertEquals(899, …)`; (c) added `@Disabled` to `discountIsRoundedDownToWholeCents`; (d) added a comment with the bug id above a new test.

<details>
<summary>Answer</summary>

(a) and (d). (b) changes the specified rounding rule to match output; (c) hides a failing test. Both need a specification change and a stated reason, which a bug fix doesn't have.

</details>

### P4. Ask before test edits

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** permission rules

Write a permissions fragment so any edit under `src/test` needs your approval.

<details>
<summary>Answer</summary>

```json
{
  "permissions": {
    "ask": ["Edit(/src/test/**)"]
  }
}
```

`/` anchors the path at the project root. You still approve legitimate new tests — the point is that no test change goes unseen.

</details>

### P5. Predict the hook

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** Stop hooks

`test-before-stop.sh` receives `{"hook_event_name":"Stop","stop_hook_active":false}`; `git status --porcelain -- src` shows a modified file; the tests fail. What does the hook do and what does Claude see?

<details>
<summary>Answer</summary>

It exits 2. Claude Code blocks the stop and gives Claude the stderr text — "Tests fail after your changes. Fix the cause (do not weaken tests)…" plus the failing test lines — as the reason to continue.

</details>

### P6. Why check stop_hook_active?

**Difficulty:** Hard · **Type:** Trade-off · **Concepts:** loop protection

What happens if the hook ignores `stop_hook_active` and the tests can't be fixed in this session? What does checking it cost?

<details>
<summary>Answer</summary>

Without the check, the hook blocks every stop attempt; Claude keeps trying until Claude Code's cap of 8 consecutive continuations ends the turn — wasted turns and tokens. With the check, the hook blocks once per stop attempt, so a still-failing build can end the turn after one retry; you see the failure and decide. The cost is a weaker guarantee, which your own build check covers.

</details>

### P7. Red for the wrong reason

**Difficulty:** Hard · **Type:** Failure diagnosis · **Concepts:** reproducing correctly

Your new regression test for BUG-101 fails — but with `NoSuchBeanDefinitionException`. Is it a valid reproduction?

<details>
<summary>Answer</summary>

No. It fails because of test setup (a missing bean or context problem), not because of the bug. Fix the setup until the test fails with the reported symptom (the NPE / 500), then fix the code. A test that's red for the wrong reason can turn green without the bug being fixed.

</details>
