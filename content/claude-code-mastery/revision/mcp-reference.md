# MCP Reference

## Concepts

| Term | Meaning |
|------|---------|
| MCP | Model Context Protocol — open protocol between AI apps (clients) and tool/data providers (servers) |
| Server | Program exposing **tools** (actions), **resources** (readable data, `@server:uri`) and **prompts** (listed as `/server:prompt (MCP)` commands) |
| Transport | `stdio` (local process; stdout = protocol only) or `http` (remote); `sse` is deprecated |
| Tool name in Claude Code | `mcp__<server>__<tool>` — used in permission rules and hook matchers |

Handshake: `initialize` → `notifications/initialized` → `tools/list` → `tools/call`. Tool errors return `isError: true`; unknown methods return JSON-RPC error `-32601`.

## Commands

```bash
claude mcp add --transport stdio runbook -- java /abs/path/RunbookServer.java
claude mcp add --transport http notion https://mcp.notion.com/mcp
claude mcp add --scope project …        # writes .mcp.json
claude mcp add-json name '{"type":"http","url":"https://…"}'
claude mcp list                          # health: ✔ Connected / ✘ Failed / ⏸ Pending approval
claude mcp get runbook                   # scope, status, type, command
claude mcp remove runbook
claude mcp reset-project-choices
```

In a session: `/mcp` (status, auth, enable/disable, tools).

## Scopes

| Scope | Stored in | Shared | Notes |
|-------|-----------|--------|-------|
| local (default) | `~/.claude.json` (per project) | No | Not `settings.local.json` |
| project | `.mcp.json` | Yes | Each user approves; ignored until folder trusted |
| user | `~/.claude.json` | No | All your projects |

Same name in several scopes: local > project > user.

## .mcp.json

```json
{
  "mcpServers": {
    "runbook": { "type": "stdio", "command": "java", "args": ["${CLAUDE_PROJECT_DIR:-.}/tools/mcp/RunbookServer.java"] },
    "issues": { "type": "http", "url": "https://mcp.example.com/mcp", "headers": { "Authorization": "Bearer ${ISSUES_TOKEN}" } }
  }
}
```

`${VAR}` / `${VAR:-default}` expand in command, args, env, url, headers. Never commit token values.

## Context and Limits

- Tool search defers tool definitions: names load, full schemas load when needed.
- Output warning above 10,000 tokens; default max 25,000 (`MAX_MCP_OUTPUT_TOKENS`); large results may be persisted to a file.
- Prefer CLI tools (`gh`) when they exist — no per-tool listing cost.
- Disable unused servers.

## Security

- Servers run as you; install only trusted ones; read the code or source.
- Tool results are untrusted input (prompt injection) — especially from tickets, web pages, email.
- Least-privilege tokens; write tools behind `ask` or `requiresUserInteraction`; `deny` rules for dangerous tools.
- `-p`/SDK runs load project servers without approval — use `--strict-mcp-config` or `--bare` in automation.
- Organizations: managed MCP config, `allowedMcpServers` / `deniedMcpServers`.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| `✘ Failed to connect` | Run the command by hand; stderr; paths; runtime on PATH |
| Garbled / disconnects | Server printing non-protocol text to stdout |
| `⏸ Pending approval` | Start `claude` and approve, or trust the folder |
| Tool never used | Tool description; ask explicitly |
| 401 / auth failure | Token value and header; `/mcp` re-authenticate |
