# What Is Model Context Protocol?

**Module:** MCP and External Tools · **Interview priority:** Core

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 and *Connect Claude Code to tools via MCP* (October 2026). The protocol messages below were captured from the JDK-only teaching server in [Lab 10](../../labs/cc-lab-10-configure-mcp/content.md).

## Definition

The **Model Context Protocol (MCP)** is an open standard for connecting AI applications to external tools and data. An **MCP server** is a program that exposes capabilities — **tools** Claude can call, **resources** it can read and **prompts** you can run as commands. Claude Code is an **MCP client**: it connects to servers you configure and makes their capabilities available to Claude.

## Why It Matters

- Without MCP, Claude only knows what is in your repository and what you paste. With it, Claude can read an issue tracker, query a development database or drive a browser — directly.
- MCP is a standard: a server written once works with many clients (Claude Code, Claude Desktop, other agents).
- Every server is code or a remote service you are trusting with data and actions. Understanding the protocol is the first step to using it safely.

## How It Works

```text
          ┌──────────────── Claude Code (host + MCP client) ───────────────┐
 you ───► │ model decides "call get_runbook(topic=rollback)"                │
          │        │                                                         │
          │        ▼ permission check (rules, mode)                          │
          │   MCP client ──── JSON-RPC 2.0 over stdio or HTTP ─────────────► │ ──► MCP server ──► runbooks,
          │        ◄──────────── result: content[] / isError ◄──────────────│     (process or     issue tracker,
          │   result enters the context; Claude continues                    │      remote URL)    database …
          └─────────────────────────────────────────────────────────────────┘
```

Messages are **JSON-RPC 2.0**: requests have an `id` and a `method`, responses repeat the `id` with a `result` or an `error`, and **notifications** have no `id` and get no reply.

## MCP Client, Server and Tools

| Term | Meaning in Claude Code |
|------|------------------------|
| **Host** | The application the user works in — Claude Code |
| **Client** | Claude Code's connection to one server (one per configured server) |
| **Server** | A local process (stdio) or a remote endpoint (HTTP) offering capabilities |
| **Tool** | An action with a name, a description and a JSON Schema for its input; Claude decides when to call it |

In Claude Code, an MCP tool is named **`mcp__<server>__<tool>`** — for example `mcp__runbook__get_runbook`. That name is what permission rules and hook matchers use.

## The Conversation Between Client and Server

The teaching server in Lab 10 (`RunbookServer.java`, JDK only) was driven by piping these requests into it over stdio:

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"manual-test","version":"0.0.1"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/list"}
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_runbook","arguments":{"topic":"rollback"}}}
```

**Output** (one JSON response per line; the notification gets none):

```text
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18","capabilities":{"tools":{}},"serverInfo":{"name":"runbook","version":"1.0.0"}}}
{"jsonrpc":"2.0","id":2,"result":{"tools":[{"name":"get_runbook","description":"Returns the team's runbook for deploy, rollback or db-migration.","inputSchema":{"type":"object","properties":{"topic":{"type":"string","enum":["deploy","rollback","db-migration"]}},"required":["topic"]}}]}}
{"jsonrpc":"2.0","id":3,"result":{"content":[{"type":"text","text":"1. Redeploy the previous image tag. 2. Do not roll back database migrations; ship a new forward migration instead. 3. Post in #incidents."}],"isError":false}}
```

1. **initialize** — client and server agree on a protocol version and declare capabilities (this server offers `tools`).
2. **notifications/initialized** — the client confirms; no reply.
3. **tools/list** — the server describes its tools. The `description` and `inputSchema` are what Claude uses to decide when and how to call a tool.
4. **tools/call** — Claude's call with arguments; the result is `content` (text, images …) plus `isError`.

A failing call returns `"isError": true` with an explanation in the content (the server returned *"Unknown topic. Use deploy, rollback or db-migration."* for `payroll`); an unsupported method returns a JSON-RPC `error` (`-32601`, *Method not found*).

## MCP Resources and Prompts

| Primitive | Who triggers it | How you use it in Claude Code |
|-----------|-----------------|-------------------------------|
| **Tools** | The model | Claude calls them when relevant; you control them with permissions |
| **Resources** | You (or Claude via resource tools) | Type `@` to see them; reference as `@server:protocol://path`, e.g. `@github:issue://123`; the content is attached to your message |
| **Prompts** | You | Appear as commands: `/mcp__github__pr_review 456`, listed in the `/` menu as `/servername:promptname (MCP)` |

Claude Code also gives Claude tools to list and read resources when a server supports them.

## Transports

| Transport | Config `type` | Use |
|-----------|---------------|-----|
| **stdio** | `stdio` | A local process Claude Code starts; messages on stdin/stdout |
| **Streamable HTTP** | `http` (alias `streamable-http`) | Remote servers; recommended for cloud services; supports OAuth |
| **SSE** | `sse` | **Deprecated** — use HTTP where available |
| **WebSocket** | `ws` | Persistent connection for servers that push events; configured via JSON |

For stdio servers, **stdout carries only protocol messages** — a server that prints logs to stdout corrupts the stream. Log to stderr (the teaching server writes `runbook server started` to stderr).

## Real-World Example

A team connects three servers to Claude Code: the GitHub server (read issues and pull requests), a read-only PostgreSQL server for a development database, and the internal runbook server. A prompt like *"Investigate issue 412 and check whether the orders table has the paid_at column in dev"* now uses `mcp__github__…` and `mcp__db__…` tools instead of copy-pasting from three browser tabs — with each call subject to permission rules.

## Common Mistakes

- Thinking MCP servers are part of Claude Code — they are separate programs or services you choose to trust.
- Writing logs to stdout in a stdio server.
- Vague tool descriptions: Claude decides from the description whether to call the tool.
- Using MCP where a CLI already works well (`gh`, `aws`) — CLIs are often more context-efficient.

## Security Considerations

- Tool **results** enter Claude's context: a server that returns content from the internet or user input can carry prompt injection.
- A local stdio server runs with your permissions (outside the Bash sandbox); a remote server sees whatever you send it.
- Anthropic reviews connectors listed in its directory but **does not security-audit or manage any MCP server**. Trust is your decision (Module 6, last lesson).

## Trade-offs

| MCP server | CLI tool via Bash | Skill |
|------------|-------------------|-------|
| Structured tools with schemas, auth handled by the server | Often fewer tokens, no extra process | Knowledge and procedures, no new access |
| Tool names/instructions use some context | Needs the CLI installed and authenticated | Doesn't connect to anything by itself |

## Interview Takeaways

- MCP = open standard; Claude Code is the client; servers expose tools, resources and prompts.
- JSON-RPC 2.0 over stdio or HTTP; initialize → initialized → tools/list → tools/call.
- Tool names `mcp__server__tool` drive permissions and hooks; trust every server deliberately.

## Key Takeaways

- MCP connects Claude to external systems through servers you configure.
- Tools are model-called, resources are @-referenced, prompts become commands.
- stdio for local processes, HTTP for remote services; SSE is deprecated.
- Tool descriptions guide Claude; tool results become context — treat them as untrusted.
