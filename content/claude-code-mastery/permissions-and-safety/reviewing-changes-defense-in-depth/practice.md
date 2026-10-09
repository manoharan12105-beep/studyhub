# Reviewing Changes and Defense in Depth — Practice

### P1. The authoritative view

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** diff review

Which gives the most reliable picture of what Claude changed before you commit?

- A) Claude's final summary
- B) `git diff` (and `git diff --stat`)
- C) The permission prompts you remember
- D) The test output

<details>
<summary>Answer</summary>

**Answer:** B) `git diff` (and `git diff --stat`)

The summary can omit things, you may not have seen every prompt (Accept edits, allow rules), and test output says nothing about scope. `/diff` inside Claude Code shows the same working-tree changes.

</details>

### P2. Which layer caught it?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** layers

Match each failure to the layer best placed to catch it: (a) a test assertion changed to make a build pass; (b) `cat ~/.aws/credentials` via Bash; (c) `ddl-auto: update` slipped into `application.yml`; (d) a merge to main without approval.

<details>
<summary>Answer</summary>

(a) Code review of test changes (CI won't — the tests pass).
(b) A `Read(~/.aws/**)` deny rule for recognized file commands, and the sandbox `credentials` setting.
(c) Diff review (and a CLAUDE.md rule plus a hook or check if it keeps happening).
(d) Server-side branch protection requiring review.

</details>

### P3. "All tests pass"

**Difficulty:** Medium · **Type:** Failure diagnosis · **Concepts:** evidence

Claude says all tests pass, but CI fails on the same commit. Name three likely causes.

<details>
<summary>Answer</summary>

Tests ran before the final edit; Claude ran a subset (one class) rather than `./mvnw -B verify`; or the environment differs (profile, database, Java version, files only present locally). Fix by requiring the definition-of-done command after the last edit and reading its full result.

</details>

### P4. Review checklist

**Difficulty:** Medium · **Type:** Workflow design · **Concepts:** review checklist

Write a five-item checklist you apply to every AI-written diff in a Spring Boot service.

<details>
<summary>Answer</summary>

1. Every changed file belongs to the task (`git diff --stat`).
2. Behaviour matches the requirement, including edge cases.
3. New behaviour has tests; no existing assertion was weakened or removed.
4. Build and tests ran after the final edit (read the output).
5. No security regressions: SQL concatenation, personal data in logs, disabled checks, secrets, permissive configuration.

</details>

### P5. Forced review points

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** ask rules

Write ask rules so you always see changes to CI workflows and the Maven build file, even in Accept edits mode.

<details>
<summary>Answer</summary>

```json
{
  "permissions": {
    "ask": ["Edit(/.github/workflows/**)", "Edit(/pom.xml)"]
  }
}
```

Explicit ask rules prompt in every mode (they are denied in `dontAsk`).

</details>

### P6. Only one layer?

**Difficulty:** Hard · **Type:** Trade-off · **Concepts:** defense in depth

A manager suggests: "We enabled auto mode, so we can drop code review for AI changes." Argue against it using specific gaps.

<details>
<summary>Answer</summary>

Auto mode's classifier reviews *actions* for danger (exfiltration, force push, deploys), not whether code is *correct*, *in scope* or *secure in design*. It won't notice an SQL injection, a weakened test, an unnecessary dependency or a misread requirement — those pass tests too. Its own docs say it doesn't guarantee safety. Review and CI cover different failures; removing them lines up the holes.

</details>

### P7. Diff surprise

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** scope creep

`git diff --stat` after a one-line bug fix shows 14 files changed, mostly whitespace and import reordering. What happened and how do you prevent it?

<details>
<summary>Answer</summary>

Likely a formatter run over the whole project (a PostToolUse hook, a `mvn` plugin, or Claude "cleaning up"). Revert the unrelated files (`git restore` on them after stashing), keep the fix. Prevent it by scoping formatters to the edited file only, adding "`git diff` contains only changes the task needs" to the definition of done, and asking for a scoped plan before edits.

</details>
