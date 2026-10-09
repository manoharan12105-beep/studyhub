# Settings Files, Precedence and Project Trust — Practice

### P1. Highest precedence

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** precedence

`model` is set in `~/.claude/settings.json`, `.claude/settings.json` and `.claude/settings.local.json`. Which value applies (no managed settings, no flags)?

- A) User
- B) Shared project
- C) Project local
- D) The first file Claude Code finds

<details>
<summary>Answer</summary>

**Answer:** C) Project local

Order: managed > command line > project local > shared project > user.

</details>

### P2. Lists merge

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** list merging

User settings allow `Bash(npm run lint)`; project settings allow `Bash(./mvnw test *)`. Which commands run without a prompt?

<details>
<summary>Answer</summary>

Both. List keys such as `permissions.allow` merge across files instead of overriding each other.

</details>

### P3. Find the source

**Difficulty:** Easy · **Type:** Command · **Concepts:** /status

How do you see which settings files Claude Code loaded in the current session?

<details>
<summary>Answer</summary>

`/status` — its Status tab has a **Setting sources** line. `claude doctor` (in the terminal) lists entries Claude Code rejected.

</details>

### P4. Broken settings

**Difficulty:** Easy · **Type:** Debugging · **Concepts:** strict JSON

Your project settings stop working after you add `// allow the build` above a rule. Why?

<details>
<summary>Answer</summary>

Settings files are strict JSON: comments and trailing commas are syntax errors, and Claude Code reports the file as a Settings Error at the next start. Remove the comment; document the rule elsewhere (or in the commit message).

</details>

### P5. Trust and -p

**Difficulty:** Medium · **Type:** Security · **Concepts:** workspace trust

You run `claude -p "list the TODOs"` in a freshly cloned repository you have never opened. Its `.claude/settings.json` has a `SessionStart` hook. Does the hook run?

<details>
<summary>Answer</summary>

Yes. A `-p` session never shows the trust dialog and treats the folder as trusted for hooks, the `env` block and helper commands. Its `.mcp.json` servers connect without asking too. (Its project allow rules are not used.) Review the repository first or use `--bare`.

</details>

### P6. Safe scripted run

**Difficulty:** Medium · **Type:** Command · **Concepts:** --bare, --setting-sources

Write a command that summarizes an untrusted repository's architecture without loading its hooks, skills, plugins or MCP servers, allowing only reads.

<details>
<summary>Answer</summary>

```bash
claude --bare -p "summarize the architecture" --allowedTools "Read"
```

`--bare` skips discovery of hooks, skills, custom commands, subagents, plugins, MCP servers, auto memory and CLAUDE.md. It needs `ANTHROPIC_API_KEY` (or an `apiKeyHelper` via `--settings`). Running it in a disposable container adds isolation.

</details>

### P7. Override for yourself

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** project local

The team's `.claude/settings.json` sets `"defaultMode": "plan"`. You want Manual mode in this project without changing it for others. What do you do?

<details>
<summary>Answer</summary>

Put `{"permissions": {"defaultMode": "default"}}` in `.claude/settings.local.json` — project local outranks shared project and stays out of Git. Or pass `--permission-mode default` per session.

</details>

### P8. Review before trust

**Difficulty:** Hard · **Type:** Security · **Concepts:** untrusted repositories

List the files you review before trusting an open-source repository in Claude Code, and the risk each carries.

<details>
<summary>Answer</summary>

- `.claude/settings.json` (and a tracked `settings.local.json`): hooks (shell commands), `env`, helper commands, allow rules, additional directories.
- `.claude/hooks/`: the scripts those hooks run.
- `.mcp.json`: servers that start as local processes or connect to remote endpoints.
- `.claude/skills/`: skill bodies and `allowed-tools` (not gated by trust).
- `.claude/agents/`: subagent definitions, frontmatter hooks and MCP servers.
- `CLAUDE.md`, `.claude/rules/`: instructions that may try to steer Claude, and imports of outside files.

</details>
