# Writing a Good Skill: Arguments and Context — Interview Questions

## Beginner

### Q1. What makes a skill's description good?

**Style:** What

<details>
<summary>Answer</summary>

It states what the skill does and when to use it, key use case first, using the words people actually type, specific enough not to match unrelated requests. Claude matches requests against it, and it may be truncated in the listing.

</details>

## Intermediate

### Q2. How do you pass input to a skill?

**Style:** How

<details>
<summary>Answer</summary>

Arguments after the name: `$ARGUMENTS` for everything, `$0`/`$ARGUMENTS[0]` for positions, named arguments declared in `arguments`. Live repository context with injected commands (`` !`git diff HEAD` ``) that run before Claude sees the content. Path variables like `${CLAUDE_SKILL_DIR}` reference bundled scripts.

</details>

### Q3. When do you set disable-model-invocation?

**Style:** Why

<details>
<summary>Answer</summary>

For workflows with side effects or deliberate timing — releases, deploys, notifications. Claude can't invoke them on its own (Claude Code blocks attempts) and their descriptions stay out of context, which also saves tokens.

</details>

### Q4. What does allowed-tools do exactly?

**Style:** What

<details>
<summary>Answer</summary>

It pre-approves the listed tools during the turn that invokes the skill; the grant clears with the next user message. It doesn't restrict other tools (use `disallowed-tools`), deny and ask rules still win, and it isn't gated by workspace trust — so review it in shared skills and keep it narrow.

</details>

## Advanced

### Q5. When would you use context: fork?

**Style:** Trade-off

<details>
<summary>Answer</summary>

For self-contained tasks that read a lot but need only a summary — research, audits — so the main context stays clean. Trade-offs: the subagent can't see your conversation, edits happen outside checkpoints when backgrounded, and Explore/Plan agents skip CLAUDE.md. Don't fork guidelines without a task.

</details>

### Q6. A skill works in your session but fails for a teammate. What do you check?

**Style:** Debugging

<details>
<summary>Answer</summary>

Whether it's in their path (project vs personal skill, nested directory), whether their personal skill with the same name overrides it (user > project), frontmatter validity (`claude plugin validate`), `skillOverrides` in their settings, permission rules that block injected commands or the Skill tool, and environment differences that make an injected command fail (no commits, missing tool).

</details>
