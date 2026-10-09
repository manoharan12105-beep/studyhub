# Subagent Configuration, Tools and Permission Boundaries — Practice

### P1. Required fields

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** frontmatter

Which frontmatter fields are required in a subagent file?

- A) `name` only
- B) `name` and `description`
- C) `name`, `description` and `tools`
- D) None — the filename is enough

<details>
<summary>Answer</summary>

**Answer:** B) `name` and `description`

A file without `name` is treated as documentation; a file with `name` but no `description` is skipped (reason in the debug log).

</details>

### P2. Which definition wins?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** scopes

`security-reviewer` exists in `~/.claude/agents/` and in the project's `.claude/agents/`. Which one runs?

- A) The user one
- B) The project one
- C) Both, merged
- D) Whichever was edited last

<details>
<summary>Answer</summary>

**Answer:** B) The project one

Priority: managed > `--agents` > project > user > plugin.

</details>

### P3. Predict the mode

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** permission inheritance

A subagent sets `permissionMode: plan`. In which mode does it run when the main conversation is (a) `default`, (b) `acceptEdits`, (c) `auto`?

<details>
<summary>Answer</summary>

(a) `plan` — in `default`, `dontAsk` or `plan` the subagent's own setting applies. (b) `acceptEdits` and (c) `auto` — in `bypassPermissions`, `acceptEdits` and auto mode the parent's mode wins and `permissionMode` is ignored.

</details>

### P4. Make it read-only

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** tools

Write the frontmatter for a `migration-reviewer` that Claude should use when Flyway migrations change, and that can only read and search files.

<details>
<summary>Answer</summary>

```yaml
---
name: migration-reviewer
description: Read-only reviewer for new Flyway migrations in orderdesk. Use when a file under src/main/resources/db/migration is added or changed.
tools: Read, Grep, Glob
---
```

No Bash, Edit or Write, so it can't change anything regardless of permission mode.

</details>

### P5. The over-broad deny

**Difficulty:** Medium · **Type:** Failure diagnosis · **Concepts:** disallowedTools

A test-runner subagent has `disallowedTools: Bash(git push *)`. It now can't run `./mvnw test`. Why, and what is the right configuration?

<details>
<summary>Answer</summary>

A `disallowedTools` entry with a specifier removes the whole tool — Bash is gone. Keep Bash in the subagent and block pushes with a permission rule in settings: `"deny": ["Bash(git push *)"]`, which applies to the main conversation and every subagent.

</details>

### P6. Silent skip

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** validation

Your new agent file starts with a blank line, then `---`. Claude never delegates to it and no error appears. What happened, and how could you have caught it?

<details>
<summary>Answer</summary>

The opening `---` must be the file's first line; otherwise Claude Code reads it as a file with no frontmatter and treats it as documentation, without reporting anything in the session. `claude plugin validate .claude/agents` checks that frontmatter parses (it doesn't flag a missing `name`), and `claude --debug` shows why files were skipped.

</details>

### P7. Memory changes the tool set

**Difficulty:** Hard · **Type:** Security · **Concepts:** memory

You add `memory: project` to the read-only `security-reviewer`. What changes in what it can do, and is that acceptable?

<details>
<summary>Answer</summary>

Memory enables Read, Write and Edit so the agent can maintain `.claude/agent-memory/security-reviewer/`, and loads its `MEMORY.md` at startup. It is no longer tool-free for writing. Acceptable only if you are comfortable with it writing files; protect source with permission rules (for example `ask` on `Edit(/src/**)`) or drop memory for strictly read-only reviewers. Also review what it stores — memory files are committed with `project` scope.

</details>

### P8. Worktree base

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** isolation

On branch `feature/pay-endpoint` you delegate "add tests for the new pay endpoint" to a subagent with `isolation: worktree`. It reports that `pay` doesn't exist. Why?

<details>
<summary>Answer</summary>

`isolation: worktree` creates the worktree from the repository's default branch on the remote by default (`worktree.baseRef: "fresh"`), not from your current `HEAD`, so the feature branch's code isn't there. Commit your work and set `"worktree": { "baseRef": "head" }` in settings so worktrees branch from your local `HEAD` (uncommitted changes still aren't copied), or run the subagent without worktree isolation.

</details>
