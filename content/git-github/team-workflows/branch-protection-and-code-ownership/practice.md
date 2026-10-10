# Branch Protection and Code Ownership — Practice

### P1. Stop force pushes

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** protection

Which control reliably prevents anyone from force-pushing to `main`?

- A) Asking everyone to use `--force-with-lease`
- B) A local `pre-push` hook
- C) A branch protection rule or ruleset blocking force pushes
- D) A note in `CONTRIBUTING.md`

<details>
<summary>Answer</summary>

**Answer:** C) A branch protection rule or ruleset blocking force pushes

Only server-side rules apply to every push.

</details>

### P2. Write CODEOWNERS

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** CODEOWNERS

Write a `CODEOWNERS` file where `@your-org/gradebook-devs` owns everything, `@your-org/assessment` owns everything under `src/main/java/com/example/gradebook/grading/`, and `@priya-lead` owns `pom.xml`.

<details>
<summary>Answer</summary>

```text
*                                              @your-org/gradebook-devs
src/main/java/com/example/gradebook/grading/   @your-org/assessment
pom.xml                                        @priya-lead
```

The general rule comes first because the last matching line wins.

</details>

### P3. Blocked forever

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** required checks

After protecting `main`, every PR shows "Expected — Waiting for status to be reported" for a required check named `ci`, and nothing can merge. What's likely wrong?

<details>
<summary>Answer</summary>

The required check's name doesn't match any check that actually runs (the workflow job may be named `build`), or the workflow doesn't run on pull requests. Require the exact check name that appears on PRs, or fix the workflow triggers.

</details>

### P4. Stale approval

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** dismiss stale approvals

Arjun approved a PR; afterwards the author pushed a commit that disables a test. Which protection setting prevents merging on the old approval?

<details>
<summary>Answer</summary>

"Dismiss stale pull request approvals when new commits are pushed" — the approval is removed, and a fresh review of the final code is required.

</details>
