# Settings Files, Precedence and Project Trust — Interview Questions

## Beginner

### Q1. Where can Claude Code settings live?

**Style:** What

<details>
<summary>Answer</summary>

User (`~/.claude/settings.json`), shared project (`.claude/settings.json`, committed), project local (`.claude/settings.local.json`, personal) and managed settings deployed by an organization; plus `--settings` for one session. `~/.claude.json` is a separate file Claude Code manages for sign-in, MCP servers and per-project state.

</details>

### Q2. What is the precedence order?

**Style:** How

<details>
<summary>Answer</summary>

Managed, command line (`--settings`), project local, shared project, user — highest first. List keys like `permissions.allow` merge; deny rules from any level always win.

</details>

## Intermediate

### Q3. What does the workspace trust dialog protect against?

**Style:** Why

<details>
<summary>Answer</summary>

Repository-supplied configuration that grants capability or runs code: hooks (shell commands), the `env` block and helper commands, allow rules and additional directories, and MCP servers from `.mcp.json`. The dialog lists them so you can review before accepting. Deny and ask rules apply immediately since they only restrict.

</details>

### Q4. How do you troubleshoot a setting that has no effect?

**Style:** Debugging

<details>
<summary>Answer</summary>

`/status` for loaded sources; check whether a higher level sets the same key (managed, `--settings`, local over project over user); check for an environment variable that pairs with the key; `claude doctor` for invalid JSON or rejected values; and whether the key is only read at startup.

</details>

## Advanced

### Q5. Why is running `claude -p` on an untrusted repository risky, and how do you mitigate it?

**Style:** Security

<details>
<summary>Answer</summary>

Non-interactive runs show no trust dialog: project hooks, the env block and helpers run, and `.mcp.json` servers connect without asking. Mitigate with `--bare` (no project discovery), `--setting-sources user`, `--settings '{"disableAllHooks": true}'`, `disabledMcpjsonServers`, and a disposable container, after reviewing the repository's `.claude/` folder.

</details>

### Q6. How would an organization enforce non-negotiable policy?

**Style:** Workflow design

<details>
<summary>Answer</summary>

Managed settings: deny rules for secrets and production commands, `disableBypassPermissionsMode`, optionally `disableAutoMode`, `allowManagedPermissionRulesOnly` or `allowManagedHooksOnly` where needed, sandbox requirements and a managed CLAUDE.md for behavioural guidance. Project settings remain for team conventions. Managed values can't be overridden by user or project files or `--settings`.

</details>
