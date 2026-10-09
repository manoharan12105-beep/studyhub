# What Are Skills? Discovery, Loading and Structure — Interview Questions

## Beginner

### Q1. What is a skill in Claude Code?

**Style:** What

<details>
<summary>Answer</summary>

A folder with a `SKILL.md`: YAML frontmatter (name, description, invocation and tool options) plus Markdown instructions. You run it with `/name` or Claude loads it when your request matches its description. It packages reusable procedures and reference knowledge.

</details>

### Q2. Where can skills live?

**Style:** What

<details>
<summary>Answer</summary>

Personal (`~/.claude/skills/`), project (`.claude/skills/`, committed), nested project directories, plugins (namespaced as `plugin:skill`), enterprise-managed locations, and skills synced from a claude.ai account.

</details>

## Intermediate

### Q3. How do skills differ from CLAUDE.md?

**Style:** Comparison

<details>
<summary>Answer</summary>

CLAUDE.md loads fully every session — for facts and rules that always apply. A skill's description is listed every session, but its body loads only when invoked — for procedures and reference material needed sometimes. Skills can also be invoked as commands, take arguments, run injected shell commands and pre-approve tools.

</details>

### Q4. Are slash commands and skills the same thing?

**Style:** Misconception

<details>
<summary>Answer</summary>

Not quite. Custom commands (`.claude/commands/*.md`) were merged into skills and both create `/name`. But built-in commands like `/compact` or `/permissions` are Claude Code features, not skills, and bundled skills like `/code-review` are prompt-based skills shipped with Claude Code. MCP prompts also appear as commands.

</details>

## Advanced

### Q5. What happens to skill content during long sessions?

**Style:** What happens internally

<details>
<summary>Answer</summary>

On invocation the rendered content enters the conversation as one message and stays; Claude Code doesn't re-read the file. After compaction, the latest invocation of each skill is re-attached within a budget (first 5,000 tokens per skill, 25,000 total, newest first), so older skills may be dropped and long ones truncated — critical instructions belong at the top, and must-hold rules in hooks.

</details>

### Q6. What security review do you do on a repository's skills?

**Style:** Security

<details>
<summary>Answer</summary>

Check `allowed-tools` (not gated by workspace trust, so it pre-approves tools even in untrusted folders), every `!` injected command, `hooks` in frontmatter, `context: fork` agents, and instructions that steer toward risky actions. Restrict with `Skill(...)` deny rules, `skillOverrides`, or `disableSkillShellExecution` in managed settings.

</details>
