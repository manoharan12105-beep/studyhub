# MCP Tool Output, Context and Troubleshooting

**Module:** MCP and External Tools · **Interview priority:** Frequently asked

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 and *Connect Claude Code to tools via MCP* (October 2026). Limits and defaults below are version-dependent.

## Definition

Every MCP server costs **context**: its tool names and instructions at session start, each full tool definition Claude loads, and every **tool result** it returns. **Managing MCP output** means keeping those costs proportional to their value. **Troubleshooting** means systematically finding why a server is not connected, not authenticated, or not behaving.

## Why It Matters

- A chatty tool that returns 40,000 tokens of JSON can push useful conversation out of the window and trigger compaction.
- Ten connected servers you rarely use still load names and instructions into every session.
- MCP failures look like "Claude ignores my tool" when the server simply never connected.

## How It Works

```text
session start ── tool NAMES + server instructions load (definitions deferred: tool search)
Claude needs a tool ── ToolSearch loads that tool's full definition
tool call ── result returns:
     • > 10,000 tokens  → warning
     • > MAX_MCP_OUTPUT_TOKENS (default 25,000) or > 50,000 characters of text
                          → saved to a file in the session's tool-results directory;
                            Claude gets the file path and reads it when needed
     • error results (isError: true) longer than ~11,000 characters
                          → first and last 5,000 characters kept
```

**Tool search** is on by default: only tool names and server instructions load at start, so adding servers has little up-front cost. It can be tuned with `ENABLE_TOOL_SEARCH` (`auto`, `auto:N`, `true`, `false`) and turned off for one server with `"alwaysLoad": true` (use sparingly — every always-loaded tool costs context in every session).

## Managing Tool Output and Context Consumption

| Practice | Why |
|----------|-----|
| Ask narrow questions ("columns of `orders`") instead of broad ones ("dump the schema") | Smaller results |
| Prefer servers whose tools support filters and pagination | The server, not the context, does the filtering |
| Prefer a CLI when it exists (`gh`, `aws`) | The docs note CLIs add no per-tool listing |
| Disable servers you don't use in this project (`/mcp`, `disabledMcpServers`) | Fewer names and instructions loaded |
| Delegate large MCP investigations to a subagent | The big results stay in its context; you get a summary |
| Check `/context` | See what MCP actually costs in your session |

Server authors can raise a specific tool's file-persistence threshold with `_meta["anthropic/maxResultSizeChars"]` (up to 500,000 characters), and users can raise `MAX_MCP_OUTPUT_TOKENS` — but bigger results are rarely better results.

Long calls: a main-conversation MCP call still running after two minutes moves to a **background task** (`/tasks`) and its result arrives later as a notification.

## Inspecting What a Server Provides

- `/mcp` — servers, status, authentication, tools; enable, disable or reconnect.
- `claude mcp get <name>` — scope, status, type, command or URL.
- `@` in the prompt — resources from connected servers.
- `/` menu — MCP prompts, shown as `/servername:promptname (MCP)`.

## Troubleshooting MCP Connections

Statuses you will see:

| Status | Meaning | Next step |
|--------|---------|-----------|
| `✔ Connected` | Handshake done | Check tools in `/mcp` |
| `! Needs authentication` | OAuth not completed or expired | `/mcp` → authenticate, or `claude mcp login <name>` |
| `✘ Failed to connect` | Process didn't start, URL unreachable, auth rejected | `claude mcp get <name>`; run the command yourself |
| `⏸ Pending approval` | Project `.mcp.json` server not approved | Review `.mcp.json`; approve in an interactive session |
| `⊘ Disabled for this project` | Listed in the project's disabled servers | Re-enable in `/mcp` |
| `✘ Rejected` | A `disabledMcpjsonServers` entry blocks it | Intended by settings |

A method that works:

1. **Configuration:** `claude mcp get <name>` — correct scope, type, command or URL? `"type"` present for URLs? `--` used for stdio?
2. **Run it yourself:** start the stdio command in a terminal (it should wait silently for input); `curl` a remote URL to check reachability.
3. **Environment:** variables exported where `claude` starts? PATH contains the runtime (`java`, `npx`)?
4. **Credentials:** a `401` in the failure detail means the token is wrong or missing; `claude mcp add` never validated it.
5. **Protocol hygiene:** stdio servers must write only JSON-RPC to stdout; logs to stderr.
6. **Reconnect:** `/mcp reconnect <server>` or `/mcp reconnect all` (v2.1.284+ in the terminal).
7. **Debug log:** `claude --debug-file /tmp/claude.log` and search for the server name.

Reconnection behaviour: a dropped **remote** server is retried with exponential backoff (up to five attempts); a failed first HTTP connection is retried up to three times for transient errors; **stdio** servers are not reconnected automatically. With tool search on, Claude is told which server failed, so it can say so instead of silently not using the tool.

## Syntax and Configuration

```bash
# Raise the per-result token limit for this session only (prefer narrowing the query)
MAX_MCP_OUTPUT_TOKENS=50000 claude

# Load MCP tools up front instead of deferring them
ENABLE_TOOL_SEARCH=false claude
```

```json
{
  "mcpServers": {
    "core-tools": { "type": "http", "url": "https://mcp.example.com/mcp", "alwaysLoad": true }
  }
}
```

## Real-World Example

A developer's sessions compact every 20 minutes. `/context` shows MCP results dominate: a database server's `query` tool returned whole tables. Changing the habit to "show the columns and 5 sample rows of orders where status = 'PAID'" and delegating a schema audit to a subagent cut the context per session dramatically — and the answers got more focused because Claude was not wading through irrelevant rows.

## Step-by-Step Walkthrough

1. Run `/context` after a typical session; note MCP's share.
2. `/mcp`: disable servers this project doesn't use.
3. Rewrite your habitual prompts to request filtered results.
4. For a failing server, follow the seven-step method above.
5. Document the working setup (scope, variables, versions) in the README.

## Common Mistakes

- Raising output limits instead of narrowing queries.
- Keeping every server connected everywhere "just in case".
- Assuming `claude mcp add` succeeding means the server works.
- Expecting a crashed stdio server to come back by itself.
- Debugging inside a long session instead of reproducing the failing call in a fresh one.

## Security Considerations

- Large results saved to files live under `~/.claude/projects/` — they may contain data from production-like systems. Use development data and read-only credentials.
- Raising limits increases how much third-party content (and potential prompt injection) enters context.

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| Tool search (default) | Many servers, little start-up context | One extra lookup step per tool |
| `alwaysLoad` | Tool always visible | Context cost every session |
| Higher output limits | Fewer truncated results | Fills context; more noise |
| CLI instead of MCP | Cheaper, familiar | Less structure; needs CLI auth |

## Interview Takeaways

- Explain tool search deferral and the output limits (10k-token warning, 25k default cap, file persistence).
- Give a troubleshooting method from configuration to protocol to debug logs.
- Prefer narrow queries, CLIs and subagents to raising limits.

## Key Takeaways

- MCP costs context at start (names) and per call (results).
- Narrow the query before raising a limit.
- Statuses tell you which layer failed; `claude mcp get` and running the server yourself find the rest.
- stdio servers don't auto-reconnect; remote servers retry with backoff.
