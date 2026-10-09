# Working with Issues and the Feature Implementation Workflow — Practice

### P1. Order the steps

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** workflow

Which order matches the workflow?

- A) Implement → Plan → Test → Summarize
- B) Inspect → Plan → Implement → Test → Review the diff → Fix → Summarize
- C) Plan → Implement → Commit → Test
- D) Inspect → Implement → Review → Plan

<details>
<summary>Answer</summary>

**Answer:** B) Inspect → Plan → Implement → Test → Review the diff → Fix → Summarize

</details>

### P2. Skip the plan?

**Difficulty:** Easy · **Type:** Scenario · **Concepts:** plan mode cost

For which task is plan mode most worth its overhead: (a) fix a typo in an error message; (b) FEAT-7 across entity, controller and tests; (c) rename a local variable?

<details>
<summary>Answer</summary>

(b). It touches several files and has rules to get right. For (a) and (c) you could describe the diff in one sentence — just ask for the change and review it.

</details>

### P3. Map criteria to tests

**Difficulty:** Medium · **Type:** Workflow design · **Concepts:** acceptance criteria

Map each FEAT-7 criterion to a test name.

<details>
<summary>Answer</summary>

- NEW → PAID, 200: `paysANewOrderAndPayingAgainChangesNothing` (first request).
- PAID again → 200, unchanged: same test (second request and the GET).
- CANCELLED/SHIPPED → 409: `payingACancelledOrderIs409` (and optionally a SHIPPED variant).
- Unknown → 404: `payingAnUnknownOrderIs404`.
- No schema change: no new file under `db/migration` in the diff (a review check, not a test).

</details>

### P4. Tests that passed too early

**Difficulty:** Medium · **Type:** Failure diagnosis · **Concepts:** tests first

Claude writes the FEAT-7 tests "first", and they all pass before `pay()` exists. What does that tell you?

<details>
<summary>Answer</summary>

The tests don't exercise the new behaviour — for example they call a different URL, assert nothing about status, or accept 404 for everything. A test for a missing endpoint must fail. Fix the tests until they fail for the expected reason, then implement.

</details>

### P5. Prove the test can fail

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** mutation check

You temporarily change `markPaid()` so it sets `PAID` for any status. What does `payingACancelledOrderIs409` report?

<details>
<summary>Answer</summary>

It fails: the request returns 200 instead of 409. The verified run printed `java.lang.AssertionError: Status expected:<409> but was:<200>`. Restore the guard afterwards.

</details>

### P6. Scope push-back

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** planning

The plan for FEAT-7 adds a `paid_at` column and a `V2__add_paid_at.sql` migration "for auditing". What do you reply?

<details>
<summary>Answer</summary>

The issue says no schema change is needed, so remove it from this change. If auditing matters, raise it as a separate issue. Unplanned schema changes are expensive to review and to deploy (Lab 15 shows a release failing on a missing column).

</details>

### P7. Honest summary

**Difficulty:** Hard · **Type:** Code review · **Concepts:** summaries

Critique this summary: "Implemented FEAT-7. All tests pass. Ready to merge."

<details>
<summary>Answer</summary>

No file list, no mapping from criteria to tests, no verify output, no gaps. Better: "Changed Order.java (markPaid), OrderController.java (POST /{id}/pay, 409 on refused transition), OrderControllerTest.java (3 tests). ./mvnw -B verify: Tests run: 14, Failures: 0, Errors: 0 — BUILD SUCCESS. Not verified: concurrent pay requests; 409 test sets CANCELLED via SQL because no cancel API exists." "Ready to merge" is the reviewer's call.

</details>

### P8. Where does the rule go?

**Difficulty:** Hard · **Type:** Trade-off · **Concepts:** design

Why put the NEW/PAID rule in `Order.markPaid()` rather than in the controller?

<details>
<summary>Answer</summary>

The rule is about the order's state, so every caller — a future batch job, another endpoint — gets it for free, and it is unit-testable without HTTP. The controller only translates outcomes to HTTP (409, 404). The cost is an exception-to-status mapping in the controller.

</details>
