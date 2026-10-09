# MCP Tool Output, Context and Troubleshooting — Interview Questions

## Beginner

### Q1. How does MCP affect the context window?

**Style:** How

<details>
<summary>Answer</summary>

Tool names and server instructions load at session start (definitions are deferred by tool search and loaded on demand), and every tool result enters the context. Large results trigger a warning above 10,000 tokens and are saved to a file beyond the default limit.

</details>

## Intermediate

### Q2. How do you keep MCP from flooding the context?

**Style:** How

<details>
<summary>Answer</summary>

Ask for filtered, aggregated results; prefer tools with pagination; use CLIs where they exist; disable unused servers per project; delegate large investigations to subagents; check `/context`; avoid `alwaysLoad` except for a few essential tools; raise limits only when a large result is genuinely needed.

</details>

### Q3. What's your process when an MCP server fails to connect?

**Style:** Debugging

<details>
<summary>Answer</summary>

Read the status (`claude mcp list`), inspect the config (`claude mcp get`: scope, type, command/URL, `--`), run the server command or curl the URL myself, compare environment variables and PATH, look for a 401 in the failure detail, make sure stdout carries only protocol messages, reconnect via `/mcp`, and read `--debug-file` output if still unclear.

</details>

## Advanced

### Q4. Why might raising MAX_MCP_OUTPUT_TOKENS make results worse?

**Style:** Trade-off

<details>
<summary>Answer</summary>

More raw data dilutes the context, crowds out code and instructions, triggers compaction sooner and increases cost — and the model may focus on irrelevant rows. It also lets more third-party content (and potential injection) in. Narrow queries and server-side filtering usually beat bigger limits.

</details>

### Q5. How do reconnection rules differ for stdio and remote servers?

**Style:** Comparison

<details>
<summary>Answer</summary>

Remote HTTP/SSE servers that drop mid-session are retried with exponential backoff (up to five attempts) and first connections are retried for transient errors; authentication errors are not retried (except with a headersHelper). Stdio servers are local processes and are not reconnected automatically — reconnect them from `/mcp` after fixing the cause.

</details>
