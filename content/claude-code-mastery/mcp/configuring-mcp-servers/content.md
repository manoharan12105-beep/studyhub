# Configuring MCP Servers

**Module:** MCP and External Tools · **Interview priority:** Frequently asked

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 (`claude mcp --help` and *Connect Claude Code to tools via MCP*, October 2026). The command outputs below were captured with the Lab 10 server in a throwaway configuration directory.

## Definition

**Configuring an MCP server** means telling Claude Code how to reach it — a command to start (stdio) or a URL (HTTP) — at a chosen **scope** (local, project or user), with any **authentication** it needs, and then checking its **status** and the tools it exposes.

## Why It Matters

- Scope decides who gets the server and where its configuration (and possibly credentials) is stored.
- Most MCP problems are configuration problems: a missing `--`, a URL without `"type"`, an unset environment variable, an unapproved project server.
- Committed configuration (`.mcp.json`) is shared with every teammate — it must never contain secrets.

## How It Works

```text
claude mcp add …  ─►  writes configuration  ─►  next session starts/connects the server
                       local   → ~/.claude.json (this project, only you)        [default]
                       project → .mcp.json in the repository (team, via Git)
                       user    → ~/.claude.json (all your projects)
claude mcp list / get, /mcp  ─►  status: ✔ Connected · ! Needs authentication · ✘ Failed · ⏸ Pending approval
```

## Configuring MCP Servers

**Remote HTTP server:**

```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
claude mcp add --transport http secure-api https://api.example.com/mcp --header "Authorization: Bearer ${API_TOKEN}"
```

**Local stdio server** — everything after `--` is the command that starts the server:

```bash
claude mcp add --transport stdio runbook -- java /path/to/RunbookServer.java
claude mcp add --env AIRTABLE_API_KEY=YOUR_KEY --transport stdio airtable -- npx -y airtable-mcp-server
```

Without `--`, Claude Code would try to parse the server's own flags as its options.

**From JSON:**

```bash
claude mcp add-json events-server '{"type":"ws","url":"wss://mcp.example.com/socket"}'
```

**Managing servers:**

| Command | Purpose |
|---------|---------|
| `claude mcp list` | All servers with a health status |
| `claude mcp get <name>` | One server's scope, status, type and command |
| `claude mcp remove <name>` | Remove (also deletes stored OAuth tokens for remote servers) |
| `/mcp` | In a session: status, authentication, enable/disable, reconnect, tools |
| `claude mcp reset-project-choices` | Reset your approvals for `.mcp.json` servers |

Captured run (Claude Code v2.1.289, user scope, the Lab 10 server; the absolute path is shortened to `…`):

```bash
claude mcp add --scope user runbook -- java …/mcp-runbook/RunbookServer.java
claude mcp list
```

**Output (varies):**

```text
Added stdio MCP server runbook with command: java …/mcp-runbook/RunbookServer.java to user config
File modified: …\.claude.json
Checking MCP server health…

runbook: java …/mcp-runbook/RunbookServer.java - ✔ Connected
```

`✔ Connected` means Claude Code started the process and completed the MCP handshake — no model request was involved.

## Project-Level vs User-Level Configuration

| Scope | Flag | Stored in | Loads in | Shared |
|-------|------|-----------|----------|--------|
| **Local** (default) | `--scope local` | `~/.claude.json` under this project's path | This project | No |
| **Project** | `--scope project` | `.mcp.json` at the repository root | This project | Yes, via Git |
| **User** | `--scope user` | `~/.claude.json` | All your projects | No |

When the same server name is defined at several scopes, Claude Code uses the whole entry from the highest one: **local > project > user**, then plugin-provided servers and claude.ai connectors. Note that MCP "local scope" lives in `~/.claude.json`, not in `.claude/settings.local.json`.

**Project servers need approval.** In interactive sessions Claude Code asks before using servers from `.mcp.json`; until then `claude mcp list` shows them as pending. Captured with a project-scoped copy of the same server:

**Output (varies):**

```text
runbook: java …/mcp-runbook/RunbookServer.java - ⏸ Pending approval (run `claude` to approve)
```

A repository's own committed approvals (`enableAllProjectMcpServers`, `enabledMcpjsonServers` in `.claude/settings.json`) are ignored until you trust the folder. In `claude -p`, SDK and cloud sessions, project servers load **without** the prompt — keep them out with `disabledMcpjsonServers`, `--setting-sources` or `--strict-mcp-config`.

## The .mcp.json File

```json
{
  "mcpServers": {
    "runbook": {
      "type": "stdio",
      "command": "java",
      "args": ["${CLAUDE_PROJECT_DIR:-.}/tools/mcp/RunbookServer.java"],
      "env": {}
    },
    "issues": {
      "type": "http",
      "url": "${ISSUES_MCP_URL:-https://mcp.example.com/mcp}",
      "headers": { "Authorization": "Bearer ${ISSUES_TOKEN}" }
    }
  }
}
```

- `${VAR}` and `${VAR:-default}` expand in `command`, `args`, `env`, `url` and `headers`. An unset variable without a default produces a warning and the literal text.
- An entry with a `url` but no `type` is a configuration error (Claude Code would read it as stdio).
- `CLAUDE_PROJECT_DIR` is set in the **server's** environment; in `command`/`args` of `.mcp.json` reference it with a default, as above.

## Authentication and Secrets

| Method | When | How |
|--------|------|-----|
| OAuth | Remote servers that support it | `/mcp` → authenticate, or `claude mcp login <name>` (`--no-browser` over SSH) |
| Static header | Token-based servers | `--header "Authorization: Bearer …"` or `headers` with `${VAR}` |
| Dynamic header | Short-lived tokens | `headersHelper`: a command that prints headers at connect time (needs workspace trust when in `.mcp.json`) |
| Environment variable | stdio servers | `--env KEY=value`, or `env` in the JSON with `${VAR}` |

Rules for secrets:

- **Never commit a token in `.mcp.json`** — reference `${VAR}` and let each developer set it.
- Claude Code deliberately reads its own and your cloud credentials (such as `ANTHROPIC_API_KEY`) as **empty** in a remote server's `url` and `headers`, so a project file cannot send them to a server it names.
- Prefer **fine-grained, read-only** tokens (for example a GitHub token limited to the repositories needed).
- `claude mcp add` saves configuration **without validating credentials** — check `/mcp` for `connected`.

## Inspecting Available Tools

- `/mcp` lists servers, their status and their tools; you can enable, disable or reconnect a server there (`/mcp disable <server>`).
- `/context` shows how much context MCP uses. By default tool definitions are **deferred** through **tool search**: only tool names and server instructions load at start; a full definition loads when Claude needs it.
- Disable servers you aren't using in a project rather than deleting them: `/mcp`, or the project's `disabledMcpServers` list.

## Real-World Example

The orderdesk team wants the runbook server for everyone. A developer adds it with `--scope project`, commits `.mcp.json`, and teammates get a one-time approval prompt the next time they start Claude Code. A personal GitHub server stays at **user** scope with a fine-grained token in an environment variable — it never touches the repository.

## Step-by-Step Walkthrough

1. Decide the scope: team-wide → project; personal everywhere → user; personal, this project → local.
2. `claude mcp add` with the right transport; for stdio put `--` before the command.
3. Reference secrets as `${VAR}`; export them in your shell.
4. `claude mcp list` → `✔ Connected`? Otherwise `claude mcp get <name>` for detail.
5. In a session, `/mcp` to authenticate and view tools.
6. Add permission rules (`mcp__<server>__*` allow for read tools; leave writes prompting).

## Common Mistakes

- Forgetting `--` before a stdio command with flags.
- Tokens hard-coded in `.mcp.json`.
- `url` without `"type": "http"`.
- Expecting `.mcp.json` servers to connect silently in an interactive session.
- Adding a server at project scope that only you need.

## Security Considerations

- A project `.mcp.json` from a repository you don't trust can start arbitrary local commands once approved — read it first.
- Remote servers receive tool arguments and may see code or data you pass; check their data handling.
- Scope credentials: read-only database users, repository-limited tokens, no production access from development tools.

## Troubleshooting

| Status or symptom | Meaning | Fix |
|-------------------|---------|-----|
| `⏸ Pending approval` | Project server not approved yet | Run `claude` interactively and approve, after reading `.mcp.json` |
| `! Needs authentication` | OAuth not completed | `/mcp` or `claude mcp login <name>` |
| `✘ Failed to connect` | Process didn't start, wrong URL, bad credentials (401) | `claude mcp get <name>`; run the command yourself; check the variable values |
| `has a "url" but no "type"` | JSON missing `type` | Add `"type": "http"` |
| Server works alone, not in Claude Code | Missing environment variable in Claude Code's environment | Export it before starting `claude`, or use `env` |

## Trade-offs

| Scope | Benefit | Cost |
|-------|---------|------|
| Project | Everyone gets the same tools | Must be reviewed and approved; no secrets in file |
| User | Available everywhere for you | Not reproducible for teammates |
| Local | Experiments, personal credentials | Easy to forget it exists |

## Interview Takeaways

- Commands: `claude mcp add` (HTTP vs stdio with `--`), `list`, `get`, `remove`, `/mcp`.
- Scopes and precedence (local > project > user); `.mcp.json` for teams; project approval and trust.
- Secrets via environment variables and OAuth; never in committed config.

## Key Takeaways

- Choose the scope first; local is the default.
- `.mcp.json` is shared and approved per developer; keep it secret-free with `${VAR}`.
- Verify with `claude mcp list` / `/mcp`; adding doesn't validate credentials.
- Pair every server with permission rules and least-privilege credentials.
