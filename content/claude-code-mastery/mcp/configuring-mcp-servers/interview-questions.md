# Configuring MCP Servers — Interview Questions

## Beginner

### Q1. How do you add an MCP server to Claude Code?

**Style:** How

<details>
<summary>Answer</summary>

`claude mcp add --transport http <name> <url>` for remote servers, or `claude mcp add --transport stdio <name> -- <command> [args]` for local ones, with `--scope local|project|user`, `--env` and `--header` as needed. Then check `claude mcp list` or `/mcp` in a session.

</details>

### Q2. What are the MCP scopes?

**Style:** What

<details>
<summary>Answer</summary>

Local (default; this project, only you; stored in `~/.claude.json`), project (`.mcp.json` in the repository, shared via Git, needs approval) and user (all your projects; `~/.claude.json`). Same-name servers resolve local > project > user.

</details>

## Intermediate

### Q3. How do you handle credentials for MCP servers?

**Style:** Security

<details>
<summary>Answer</summary>

OAuth through `/mcp` or `claude mcp login` where supported; otherwise tokens from environment variables referenced as `${VAR}` in headers or env — never committed. Use least-privilege tokens (repository-scoped, read-only), read-only database users and development data. `claude mcp add` doesn't validate credentials, so verify the connection.

</details>

### Q4. Why does Claude Code ask before connecting `.mcp.json` servers?

**Style:** Why

<details>
<summary>Answer</summary>

`.mcp.json` comes from the repository, so it can start arbitrary local commands or send data to remote URLs. Interactive sessions require approval per server, and a repository's own committed approvals are ignored until the folder is trusted. Non-interactive runs skip the prompt, which is why scripted runs need explicit controls.

</details>

## Advanced

### Q5. Design the MCP setup for a team of eight on a Spring Boot service.

**Style:** Workflow design

<details>
<summary>Answer</summary>

Project scope (`.mcp.json`) for team tools with no secrets — e.g. an internal docs or runbook server and a read-only dev-database server with `${DEV_DB_DSN}`. User scope for personal tools like a GitHub server with each person's fine-grained token. Permission rules: allow read tools, keep writes prompting, deny destructive ones. Disable unused servers per project, prefer CLIs where they're cheaper, and document setup in the README.

</details>

### Q6. A server works when you run it manually but shows "Failed to connect" in Claude Code. Debug.

**Style:** Debugging

<details>
<summary>Answer</summary>

`claude mcp get <name>` for the exact command and error; compare environments (variables exported in your shell but not where `claude` started, PATH differences); check the `--` separator and arguments; make sure the server writes only protocol messages to stdout; for remote servers check the HTTP status (401 means credentials) and that `type` is set; reconnect from `/mcp`.

</details>
