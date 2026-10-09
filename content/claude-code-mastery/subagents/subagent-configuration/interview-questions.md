# Subagent Configuration, Tools and Permission Boundaries — Interview Questions

## Beginner

### Q1. Where do custom subagents live?

**Style:** What

<details>
<summary>Answer</summary>

As Markdown files with YAML frontmatter in `.claude/agents/` (project, commit it) or `~/.claude/agents/` (personal), plus managed settings, plugins, and session-only definitions passed with `--agents`. Name clashes resolve managed > CLI > project > user > plugin.

</details>

## Intermediate

### Q2. How do you make a subagent read-only?

**Style:** How

<details>
<summary>Answer</summary>

Give it `tools: Read, Grep, Glob`. Leaving out Edit, Write and Bash enforces it; a system-prompt instruction or `permissionMode: plan` does not, because permissive parent modes override `permissionMode`. Back it with deny/ask rules that apply to all agents.

</details>

### Q3. How does a subagent's permission mode interact with the session's mode?

**Style:** Trade-off

<details>
<summary>Answer</summary>

If the main conversation is in `bypassPermissions`, `acceptEdits` or auto mode, the subagent runs in that mode and its `permissionMode` is ignored. In `default`, `dontAsk` or `plan`, the subagent's setting applies, except that `bypassPermissions` can't be escalated to and `auto` falls back when unavailable. Unset means inherit.

</details>

### Q4. How is a subagent's model chosen?

**Style:** What

<details>
<summary>Answer</summary>

Per-invocation `model` first, then the definition's `model` (`inherit` = main model), then `CLAUDE_CODE_SUBAGENT_MODEL`, then the main conversation's model. `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` makes one model apply to all. `/tasks` shows what each running subagent uses.

</details>

## Advanced

### Q5. Design a safe review subagent for a regulated codebase.

**Style:** Design

<details>
<summary>Answer</summary>

Project-scoped, version-controlled file; specific description; `tools: Read, Grep, Glob` with no Bash or MCP; a system prompt that defines inputs (changed files in the task), checks, an evidence requirement (`file:line`, confirmed vs suspected) and "never claim tests pass"; no `memory` so it can't write; validated with `claude plugin validate`; settings deny rules for secrets that apply to every agent; and its findings reviewed by a human before anything changes.

</details>

### Q6. A subagent file in the repository isn't loading for anyone. How do you debug it?

**Style:** Debugging

<details>
<summary>Answer</summary>

Run `claude plugin validate .claude/agents` for YAML errors; check that `---` is the first line, `name` and `description` exist, the name has no `:` and isn't duplicated in the tree; run `claude --debug` to see skip reasons; check whether the `agents` directory was created during the running session (restart); and look for a higher-priority definition with the same name or a deny rule like `Agent(name)`.

</details>
