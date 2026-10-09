# What Is Model Context Protocol? — Interview Questions

## Beginner

### Q1. What is MCP?

**Style:** What

<details>
<summary>Answer</summary>

The Model Context Protocol is an open standard for connecting AI applications to tools and data. Servers expose tools (actions the model can call), resources (data you can reference) and prompts (templates run as commands). Claude Code is a client that connects to servers you configure.

</details>

### Q2. What are the main transports?

**Style:** What

<details>
<summary>Answer</summary>

stdio for local processes Claude Code starts, streamable HTTP for remote servers (recommended, supports OAuth), SSE (deprecated) and WebSocket for push-style servers. Messages are JSON-RPC 2.0.

</details>

## Intermediate

### Q3. Walk through what happens when Claude calls an MCP tool.

**Style:** What happens internally

<details>
<summary>Answer</summary>

At connection time the client sends `initialize`, the server answers with its version and capabilities, the client sends `notifications/initialized`, then `tools/list` returns names, descriptions and input schemas. When Claude decides to call a tool, Claude Code checks permissions for `mcp__server__tool`, sends `tools/call` with arguments, and puts the returned `content` (or the error) into the context.

</details>

### Q4. When would you use MCP instead of a CLI?

**Style:** Trade-off

<details>
<summary>Answer</summary>

MCP when there's no good CLI, when you want structured tools with schemas and server-managed authentication (OAuth), or for resources and prompts. A CLI such as `gh` is often more context-efficient and already authenticated, so the docs recommend preferring CLIs where they exist.

</details>

## Advanced

### Q5. What would you check before writing your own MCP server in Java?

**Style:** Workflow design

<details>
<summary>Answer</summary>

Use an MCP SDK rather than hand-written JSON-RPC; keep stdout for protocol only; write precise tool descriptions and strict input schemas; return `isError` results with actionable messages; limit output size (Claude Code warns above 10,000 tokens per result); give tools least privilege (read-only where possible); and never embed credentials — read them from the environment.

</details>

### Q6. Why is every MCP server a trust decision?

**Style:** Security

<details>
<summary>Answer</summary>

A stdio server is a program running with your permissions; a remote server receives your data; any server's results enter Claude's context and can carry prompt injection. Anthropic reviews directory listings but doesn't audit or manage servers. You decide which servers to run, with which credentials, and which tools are allowed or must prompt.

</details>
