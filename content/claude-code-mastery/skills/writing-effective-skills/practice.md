# Writing a Good Skill: Arguments and Context — Practice

### P1. Expand the arguments

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** $ARGUMENTS, $N

A skill body says `Migrate the $0 component from $1 to $2.` You run `/migrate-component SearchBar "Java 17" "Java 21"`. What does Claude receive?

<details>
<summary>Answer</summary>

`Migrate the SearchBar component from Java 17 to Java 21.` Indexed arguments use shell-style quoting, so the quoted values are single arguments.

</details>

### P2. Better description

**Difficulty:** Easy · **Type:** Workflow design · **Concepts:** descriptions

Improve: `description: Tests.`

<details>
<summary>Answer</summary>

For example: `description: Writes a regression test for a described orderdesk bug that fails on the current code and passes once the bug is fixed. Use when the user asks for a regression test or a test that reproduces a bug.` Key use case first, the words users say, and a clear trigger.

</details>

### P3. Grounded review

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** dynamic context

Write the injected-context section of a review skill so Claude sees the list of changed files and the full diff against `HEAD` before it reads the instructions.

<details>
<summary>Answer</summary>

```markdown
## Current changes

!`git status --short`

!`git diff HEAD`
```

The commands run first; their output replaces the lines. Add `allowed-tools: Bash(git status *) Bash(git diff *)` so the permission check allows them outside auto mode.

</details>

### P4. Aborted skill

**Difficulty:** Medium · **Type:** Failure diagnosis · **Concepts:** injected command failure

In a brand-new repository with no commits, `/pre-release-check` fails immediately with `Shell command failed for pattern …git log…`. Why, and how could the skill cope?

<details>
<summary>Answer</summary>

`git log` exits non-zero when there are no commits, and a failed injected command aborts the whole skill invocation. Either make the command tolerant (`git log --oneline -5 || true`) or accept the abort as a correct "nothing to release" signal and say so in the skill's documentation.

</details>

### P5. Choose invocation control

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** disable-model-invocation

Which of these skills should set `disable-model-invocation: true`? (a) `sql-review`; (b) `deploy-staging`; (c) `regression-test`; (d) `send-release-notes` (posts to the team chat).

<details>
<summary>Answer</summary>

(b) and (d) — they have side effects outside your working tree and their timing is a human decision. (a) and (c) are safe to auto-load: one reviews, the other writes a test you will review.

</details>

### P6. Narrow tools

**Difficulty:** Medium · **Type:** Security · **Concepts:** allowed-tools

A teammate's skill has `allowed-tools: Bash(*)` "so it doesn't prompt". The skill only runs `./mvnw -B verify` and `git status`. Rewrite it and explain the risk of the original.

<details>
<summary>Answer</summary>

`allowed-tools: Bash(./mvnw -B verify) Bash(git status *)`. The original pre-approves **every** Bash command for the turn the skill is invoked — if the skill (or content it reads) leads Claude astray, nothing prompts. Pre-approve only what the steps need.

</details>

### P7. Forked skill

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** context: fork

A skill with `context: fork` and `agent: Explore` says "Summarize the decisions we made today about the payment flow." It returns a generic answer. Why?

<details>
<summary>Answer</summary>

A forked skill runs in a fresh subagent that does not see your conversation, so "decisions we made today" refers to history it doesn't have; Explore also skips CLAUDE.md. Either run the skill inline (no `context: fork`), or make it self-contained by pointing it at a file that records the decisions.

</details>

### P8. Lean listing

**Difficulty:** Hard · **Type:** Trade-off · **Concepts:** context cost

Your team has 40 skills and `/context` shows the skill listing is large, with some descriptions cut. Give three changes that reduce the cost without deleting useful skills.

<details>
<summary>Answer</summary>

1. `disable-model-invocation: true` on manual workflows (their descriptions leave Claude's context).
2. `paths` on area-specific skills so they auto-load only for matching files, and `skillOverrides` `"name-only"` for rarely used ones.
3. Shorten descriptions (key use case first) and use `/skill-doctor` to find unused or expensive skills to turn off.

</details>
