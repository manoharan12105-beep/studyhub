# Parallel Code Review and Coordinating Results — Practice

### P1. Why separate lenses?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** parallel review

What is the main benefit of three single-lens reviewers over one general reviewer?

- A) Fewer tokens
- B) Each concern gets focused attention, and the runs happen at the same time
- C) Findings no longer need checking
- D) Reviewers can fix each other's findings

<details>
<summary>Answer</summary>

**Answer:** B) Each concern gets focused attention, and the runs happen at the same time

They cost more tokens, and their findings still need validation.

</details>

### P2. The test reviewer's claim

**Difficulty:** Easy · **Type:** Code review · **Concepts:** evidence

`test-coverage-reviewer` (tools: Read, Grep, Glob) ends its report with "All tests pass." What do you do with that sentence?

<details>
<summary>Answer</summary>

Reject it: the reviewer can't run commands, so it can't know. Its own prompt forbids the claim. Run `./mvnw -B verify` yourself and use that result.

</details>

### P3. Deduplicate

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** consolidation

Correctness reports "OrderController.java:34 — create stores the order even when the response fails". Security reports "OrderController.java:34 — failed requests leave inconsistent data". How do you record this?

<details>
<summary>Answer</summary>

One finding at `OrderController.java:34`: the order is saved, then building the response throws, so the request returns 500 but the row stays. Note that both reviewers found it. Validate by reproducing (POST without a discount code on the starter returns 500 and the row is stored); the fix is to make the create operation transactional so a failure rolls it back — plus the NPE fix.

</details>

### P4. Resolve a conflict

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** conflicts

Security says "paying an already-PAID order should return 409 to stop replays". FEAT-7 says PAID → 200, unchanged. Correctness says the 200 is correct. What happens to the security finding?

<details>
<summary>Answer</summary>

It conflicts with the specification, so it isn't a code defect. Classify it as **Needs a human**: if the product owner agrees replays are a risk, the spec changes first; otherwise reject it with the reason "FEAT-7 requires idempotent 200".

</details>

### P5. Write the coordination prompt

**Difficulty:** Medium · **Type:** Prompt design · **Concepts:** coordination

Write the part of a prompt that tells Claude what to do **after** the three reviewers return.

<details>
<summary>Answer</summary>

```text
When all three reviewers return: merge their findings into one list keeping the reviewer name,
combine duplicates, open every cited file:line yourself and mark each finding Validated,
Rejected (with the reason) or Needs a human. Order the list: validated correctness and security
issues first, then missing tests. Don't edit any file and don't claim test results you haven't run.
```

</details>

### P6. Cost estimate

**Difficulty:** Hard · **Type:** Trade-off · **Concepts:** cost and latency

For a one-line typo fix in a log message, a colleague runs all three reviewers. Is that a good use? What would you do instead?

<details>
<summary>Answer</summary>

No. Three contexts and three reports cost far more than the risk justifies, and the likely findings are noise. Read the one-line diff yourself (or run one quick review), run the tests, and keep parallel review for changes with behavioural or security impact.

</details>

### P7. Rejecting a finding

**Difficulty:** Hard · **Type:** Failure diagnosis · **Concepts:** validation

A reviewer cites `PriceCalculator.java:42` for "missing overflow check". The file has 20 lines. What does this tell you, and what do you do with that reviewer's other findings?

<details>
<summary>Answer</summary>

The finding is invented or about different code — reject it. It also lowers confidence in the reviewer's other findings: validate each of them carefully rather than accepting any on trust, and check whether it received the right file list.

</details>
