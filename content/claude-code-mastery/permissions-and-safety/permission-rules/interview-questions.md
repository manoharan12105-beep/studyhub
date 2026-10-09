# Permission Fundamentals: Allow, Ask and Deny — Interview Questions

## Beginner

### Q1. What are allow, ask and deny rules?

**Style:** What

<details>
<summary>Answer</summary>

Permission rules in settings that Claude Code enforces before each tool call: allow runs a matching call without a prompt, ask always prompts, deny always blocks. They layer on top of the permission mode and use the syntax `Tool` or `Tool(specifier)`, for example `Bash(./mvnw test *)` or `Read(.env)`.

</details>

### Q2. In what order are they evaluated?

**Style:** How

<details>
<summary>Answer</summary>

Deny, then ask, then allow; the first match wins and specificity doesn't matter. A deny at any settings level can't be overridden by an allow at another level, including command-line flags; managed settings sit above everything.

</details>

## Intermediate

### Q3. Why isn't `Bash(curl *)` a security boundary?

**Style:** Why

<details>
<summary>Answer</summary>

Bash rules match the command text after splitting compound commands and stripping simple wrappers. `/usr/bin/curl`, `sh -c 'curl …'` or another program entirely won't match. Use it as a guardrail for the usual spelling; for an actual boundary use the sandbox's network and filesystem isolation, PreToolUse hooks that inspect commands, and least-privilege credentials.

</details>

### Q4. Explain the path anchors in Read and Edit rules.

**Style:** How

<details>
<summary>Answer</summary>

They are gitignore patterns: `//path` absolute, `~/path` from home, `/path` relative to the settings source (project root for project settings, `~/.claude` for user settings), and `path`/`./path` relative to the current directory. Bare filenames like `.env` match at any depth. The `/path` anchor is the classic trap in user settings.

</details>

### Q5. How do you reduce prompts safely?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Allow exact routine commands (tests, lint), keep consequential ones behind ask rules (push, dependency changes, migrations), deny secrets and forbidden operations, use Accept edits for edit-heavy work with diff review, and consider the sandbox's auto-allow mode or auto mode with ask rules for remaining risk. Never `allow: ["Bash"]`.

</details>

## Advanced

### Q6. Your team commits `.claude/settings.json` with allow rules. When do they take effect for a new developer?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Allow rules and additional directories from a project's settings apply only after the developer accepts the workspace trust dialog, which lists them for review. Deny and ask rules apply immediately because they only restrict. In `claude -p` runs no dialog appears; project allow rules aren't used and Claude Code prints a warning that the workspace hasn't been trusted — but hooks in project settings do run there, which is why scripted runs on untrusted repositories need care.

</details>

### Q7. Design permissions for an MCP server that can read and write GitHub issues.

**Style:** Security

<details>
<summary>Answer</summary>

Allow only the read tools you use without prompting (`mcp__github__get_issue`, `mcp__github__list_issues`), leave write tools (create/update/comment) to prompt or put them in ask, and deny tools you never need (or `mcp__github__delete_*`). Use a fine-grained token scoped to the needed repositories with read access unless writes are required. Remember MCP rules with parentheses are skipped in settings files; parameter-level MCP denies go through `--disallowedTools`.

</details>
