# Context Budgeting, Large Repositories and Progressive Disclosure — Interview Questions

## Beginner

### Q1. What is progressive disclosure in Claude Code?

**Style:** What

<details>
<summary>Answer</summary>

Loading detail only when it's needed: skill names before bodies, MCP tool names before definitions, subdirectory instructions only when working there, subagent summaries instead of their full work. It keeps the always-loaded context small.

</details>

## Intermediate

### Q2. How do you set up Claude Code for a large monorepo?

**Style:** How

<details>
<summary>Answer</summary>

Short root CLAUDE.md, per-package CLAUDE.md or path-scoped rules, start sessions in the package being changed, `claudeMdExcludes` for irrelevant areas, Read deny rules for generated and vendored code, code intelligence where available, per-package skills, and subagents for broad searches.

</details>

### Q3. How do you find out what's using the context window?

**Style:** How

<details>
<summary>Answer</summary>

`/context` breaks it down (system prompt, memory files, skills, MCP tools, messages); `/usage` shows token use; `/skill-doctor` shows per-skill cost; `/mcp` lists servers to disable.

</details>

## Advanced

### Q4. Why can a longer CLAUDE.md make results worse?

**Style:** Trade-off

<details>
<summary>Answer</summary>

It costs context in every session, and important rules compete with irrelevant ones, so they're followed less reliably. Keeping it short and relevant — with detail in scoped files and skills, and must-hold rules in hooks or settings — improves both cost and adherence.

</details>

### Q5. Design context management for a 2-hour feature task.

**Style:** Design

<details>
<summary>Answer</summary>

Start in the right package; plan in plan mode and save the plan to a file; delegate exploration to subagents; implement in small verified steps; `/compact` with explicit focus (plan, failing tests, files) when needed; checkpoint with commits; and `/clear` before the next unrelated task. Keep evidence (test output, diffs) rather than conversation history as the record.

</details>
