# MCP with Spring AI: Servers and Clients — Interview Questions

## Beginner

### Q1. What is MCP?

**Style:** Direct

<details>
<summary>Answer</summary>

The Model Context Protocol: an open protocol through which AI applications (clients) discover and use tools, resources and prompts offered by servers, over stdio or HTTP. It standardises how capabilities are published so many AI applications can reuse them.

</details>

### Q2. How do you expose a Spring method as an MCP tool?

**Style:** How

<details>
<summary>Answer</summary>

Add `spring-ai-starter-mcp-server-webmvc`, annotate a bean method with `@McpTool(name, description)` and its parameters with `@McpToolParam(description)`, and configure the server (`spring.ai.mcp.server.protocol=STREAMABLE`, name, version). The tool is served at `/mcp`.

</details>

## Intermediate

### Q3. How do MCP tools reach a `ChatClient`?

**Style:** How

<details>
<summary>Answer</summary>

The MCP client starter connects to the configured servers at start-up (`spring.ai.mcp.client.streamable-http.connections.<name>.url`), lists their tools and wraps them as `ToolCallback`s in a `ToolCallbackProvider` bean. Pass it with `.tools(provider)` or `defaultTools(provider)`; the tool loop then calls the server via `tools/call`.

</details>

### Q4. When would you use MCP instead of a local `@Tool`?

**Style:** Compare

<details>
<summary>Answer</summary>

When the capability should be shared by several AI applications or teams, owned and deployed independently, used by external clients (IDEs, desktop assistants), or isolated behind a network/security boundary. For a tool used only inside one service, a local `@Tool` is simpler, faster and has fewer failure modes.

</details>

## Advanced

### Q5. What are the security risks of connecting your assistant to MCP servers, and how do you mitigate them?

**Style:** Design

<details>
<summary>Answer</summary>

Risks: untrusted servers supplying malicious tool descriptions or results (prompt injection), excessive capabilities (destructive tools), credential leakage, supply-chain compromise of server packages, and missing per-user authorisation. Mitigations: only connect to reviewed, pinned servers; authenticate client↔server (OAuth2 tokens); propagate end-user identity so the server authorises per user; filter and prefix tools, attach per feature; require approval for write tools; timeouts and observability; run stdio servers with least privilege; treat all tool output as untrusted.

</details>
