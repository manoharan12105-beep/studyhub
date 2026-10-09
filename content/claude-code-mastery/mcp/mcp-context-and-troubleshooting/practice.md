# MCP Tool Output, Context and Troubleshooting — Practice

### P1. Deferred tools

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** tool search

With default settings, what does an MCP server add to the context at session start?

- A) Every tool's full definition
- B) Tool names and server instructions; full definitions load when Claude needs them
- C) Nothing until you run /mcp
- D) The results of every tool

<details>
<summary>Answer</summary>

**Answer:** B) Tool names and server instructions; full definitions load when Claude needs them

That is tool search, on by default.

</details>

### P2. Large result

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** output limits

A tool returns 80,000 characters of plain text with no image. With default limits, what does Claude receive?

<details>
<summary>Answer</summary>

The result is saved to a file in the session's `tool-results` directory and replaced in the conversation by a message naming the file path; Claude reads the file when it needs the content. (Text results over 50,000 characters are persisted for tools that don't declare their own limit; a warning also appears above 10,000 tokens.)

</details>

### P3. Better query

**Difficulty:** Easy · **Type:** Workflow design · **Concepts:** narrow queries

Rewrite "use the db tool to show me the orders table" to use less context.

<details>
<summary>Answer</summary>

"Use the db tool to list the columns of `orders` and count rows per status; show at most 5 example rows of status PAID." Ask for structure and aggregates, not whole tables.

</details>

### P4. Needs authentication

**Difficulty:** Easy · **Type:** Failure diagnosis · **Concepts:** status

`claude mcp list` shows `! Needs authentication` for `issues`. What do you run?

<details>
<summary>Answer</summary>

In a session, `/mcp` and authenticate the server; from the shell, `claude mcp login issues` (add `--no-browser` over SSH to get a URL to open elsewhere).

</details>

### P5. Silent stdio server

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** troubleshooting

Your stdio server shows `✘ Failed to connect`. Running its command in a terminal prints `Error: JAVA_HOME not set` and exits. What's going on and how do you fix it?

<details>
<summary>Answer</summary>

The server process dies at start because its environment lacks `JAVA_HOME`. Export it in the environment where you start `claude`, or pass it with `--env JAVA_HOME=…` (or the `env` field). Then `/mcp reconnect <server>` — stdio servers are not reconnected automatically.

</details>

### P6. CLI or MCP?

**Difficulty:** Medium · **Type:** Trade-off · **Concepts:** context cost

You can let Claude list pull requests through the GitHub MCP server or through the `gh` CLI that is already installed and logged in. Which does the documentation suggest, and why?

<details>
<summary>Answer</summary>

Prefer `gh` when available: CLI tools are more context-efficient because they add no per-tool listing, and `gh` is already authenticated. Use the MCP server when you need something the CLI doesn't do well, or structured tools with server-side auth.

</details>

### P7. Always load?

**Difficulty:** Hard · **Type:** Trade-off · **Concepts:** alwaysLoad

A teammate sets `"alwaysLoad": true` on all six team servers "so Claude always sees the tools". What's the downside, and when is `alwaysLoad` justified?

<details>
<summary>Answer</summary>

Every tool definition from those servers now loads into every session, costing context that would otherwise hold conversation and code — and making compaction more frequent. Justified only for a small number of tools Claude needs on almost every turn; leave the rest deferred.

</details>
