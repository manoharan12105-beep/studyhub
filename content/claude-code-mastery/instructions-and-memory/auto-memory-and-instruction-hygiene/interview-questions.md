# Auto Memory and Instruction Hygiene — Interview Questions

## Beginner

### Q1. What is auto memory?

**Style:** What

<details>
<summary>Answer</summary>

Notes Claude writes for itself while working — user preferences, feedback and corrections, project context it can't derive from code, references to external resources — stored per repository under `~/.claude/projects/<project>/memory/`. A `MEMORY.md` index (first 200 lines or 25 KB) loads each session; topic files are read on demand.

</details>

### Q2. How is it different from CLAUDE.md?

**Style:** Comparison

<details>
<summary>Answer</summary>

You write CLAUDE.md; Claude writes auto memory. CLAUDE.md (project) is shared via Git; auto memory is machine-local. CLAUDE.md holds rules and instructions; memory holds learnings. "Remember X" goes to memory; "add X to CLAUDE.md" changes the shared file.

</details>

## Intermediate

### Q3. What can go wrong with auto memory?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Stale facts after upgrades, one-off instructions generalized into preferences, duplicates that drift from CLAUDE.md, team-relevant knowledge trapped on one machine, sensitive data saved by accident, and an index that grows past its load limit. Review with `/memory` and keep each fact in one home.

</details>

### Q4. How do you avoid conflicting instructions?

**Style:** How

<details>
<summary>Answer</summary>

Give each instruction exactly one home based on scope: project CLAUDE.md for everything in the repo, path-scoped rules for areas, skills for procedures, user files for personal style, local file for my environment, memory for learned preferences, settings or hooks for hard rules. Audit periodically — `/doctor prompt-audit` on recent versions — and review instruction changes in PRs.

</details>

## Advanced

### Q5. Behaviour differs between two developers on the same repository and version. Investigate.

**Style:** Debugging

<details>
<summary>Answer</summary>

Compare everything outside Git: user CLAUDE.md and rules, CLAUDE.local.md, auto memory, user settings, personal skills and subagents, MCP servers at user/local scope, and output styles. `/context` and `/status` in each session show what loaded. Usually one person's memory or user file contains a stale or conflicting rule; move team-relevant facts into the project files.

</details>

### Q6. Would you turn auto memory off in a regulated environment?

**Style:** Security

<details>
<summary>Answer</summary>

Possibly, or restrict it: memory files persist conversation-derived text in plain files that feed future contexts, which can conflict with data-retention or privacy rules. Options are `autoMemoryEnabled: false` (per project or via managed settings), `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`, or keeping it on with a policy of no personal data in prompts and periodic review. Decide with the security team; document it.

</details>
