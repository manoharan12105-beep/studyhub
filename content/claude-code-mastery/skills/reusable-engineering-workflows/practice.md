# Reusable Workflows: Review, Testing, Documentation and Release — Practice

### P1. Spot the missing guard rail

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** regression tests

A `regression-test` skill says: "Write a test for the bug and make sure the test suite passes." What is the main problem?

- A) It doesn't name the test class
- B) A test that must pass immediately may simply record the current, buggy behaviour
- C) It doesn't use `$ARGUMENTS`
- D) Skills can't run tests

<details>
<summary>Answer</summary>

**Answer:** B) A test that must pass immediately may simply record the current, buggy behaviour

A regression test must fail on the buggy code for the expected reason, then pass after the fix. "Make the suite pass" invites asserting today's output.

</details>

### P2. Which workflow is manual-only?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** disable-model-invocation

Which orderdesk skill most needs `disable-model-invocation: true`?

- A) `java-review`
- B) `sql-review`
- C) `pre-release-check`
- D) `regression-test`

<details>
<summary>Answer</summary>

**Answer:** C) `pre-release-check`

Its timing is a human decision and it runs the full build. The review skills are read-only and safe to load automatically.

</details>

### P3. Evidence or impression?

**Difficulty:** Medium · **Type:** Code review · **Concepts:** evidence

A pre-release report says: "1. Build: PASS. 2. Working tree: PASS. 3. Migrations: PASS. GO." The repository has no tags. What is wrong with this report, judged by the orderdesk skill?

<details>
<summary>Answer</summary>

Check 1 must quote the `Tests run:` line — no evidence is given. Check 3 needs a last tag; with none, the skill says to report **NOT CHECKED**, so "PASS" is false, and GO requires every check to PASS, so the result must be **NO-GO** (or at least not GO). The report also skips checks 4 and 5.

</details>

### P4. Write the report format

**Difficulty:** Medium · **Type:** Workflow design · **Concepts:** report shape

Write the final paragraph of a `dependency-review` skill that reviews `pom.xml` changes. It must produce a scannable report, require evidence and forbid side effects.

<details>
<summary>Answer</summary>

One good version:

```text
For each changed dependency report: groupId:artifactId, old → new version, why it changed
(cite pom.xml:line), and any known breaking change you found in the project's own code.
Group findings as **Must fix**, **Should fix** and **Question**; write "none" for an empty group.
Mark anything you could not check as NOT CHECKED. Do not edit pom.xml, run the build with
new versions, or contact any repository: this skill only reviews.
```

</details>

### P5. Auto-load scope

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** paths

Write the `paths` line so a `controller-review` skill auto-loads only when Claude works with controller classes under `src/main/java`.

<details>
<summary>Answer</summary>

```yaml
paths: "src/main/java/**/*Controller.java"
```

Claude loads the skill automatically only when working with matching files; `/controller-review` still works anywhere.

</details>

### P6. Review that reviews the wrong thing

**Difficulty:** Medium · **Type:** Failure diagnosis · **Concepts:** injected context

A review skill without injected commands says "Review the changes you made." After a long session with two `/compact` runs, its review misses a file Claude edited early on. Why, and what is the fix?

<details>
<summary>Answer</summary>

The skill relies on Claude's memory of the session, which compaction summarized; the early edit is no longer in detail in context. Inject `git status --short` and `git diff HEAD` so the review always reads the real working tree, independent of conversation history.

</details>

### P7. Documentation skill drift

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** scope control

After `/update-docs`, the README's endpoint list is right, but the introduction was rewritten and a "rate limiting" section appeared — orderdesk has no rate limiting. Which two instructions in the orderdesk skill were violated, and what do you do with the change?

<details>
<summary>Answer</summary>

Step 2 ("Update only the "Run" section's endpoint list … Keep the existing style and wording elsewhere") and step 3 ("Do not document behaviour you cannot see in the code"). Don't accept the change as is: keep the endpoint hunk, revert the other hunks (`git restore -p README.md` or `/rewind`), and note the failure — if it repeats, tighten the skill, for example by listing the exact heading to edit.

</details>

### P8. Design a chain

**Difficulty:** Hard · **Type:** Workflow design · **Concepts:** composition

FEAT-7 asks for `POST /api/orders/{id}/pay`. List which orderdesk skills you would use, in which order, and what evidence each must produce before you open a pull request.

<details>
<summary>Answer</summary>

1. Plan the change (plan mode; no skill needed) and agree the behaviour list from FEAT-7.
2. `/regression-test` (or test-first by hand) for each rule: NEW→PAID 200, PAID idempotent 200, CANCELLED/SHIPPED 409, unknown 404 — evidence: each fails before the implementation.
3. Implement; `java-review` on the diff — evidence: Must/Should/Question with `file:line`, no test assertions weakened.
4. `/update-docs` — evidence: README lists the new endpoint and its status codes.
5. `/pre-release-check` if this goes into a release — evidence: `Tests run:` line, clean tree, GO/NO-GO.

`sql-review` is not needed because FEAT-7 requires no schema change; if a migration appears, that is itself a review finding.

</details>
