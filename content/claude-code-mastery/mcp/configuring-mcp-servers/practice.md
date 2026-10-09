# Configuring MCP Servers — Practice

### P1. Default scope

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** scopes

You run `claude mcp add --transport http stripe https://mcp.stripe.com` with no `--scope`. Where is it available?

- A) All your projects
- B) Only the current project, only for you
- C) The whole team via `.mcp.json`
- D) Nowhere until you choose a scope

<details>
<summary>Answer</summary>

**Answer:** B) Only the current project, only for you

Local scope is the default; it is stored in `~/.claude.json` under the project's path.

</details>

### P2. The double dash

**Difficulty:** Easy · **Type:** Command · **Concepts:** stdio add

Add a stdio server named `db` that runs `npx -y @bytebase/dbhub --dsn "$DEV_DSN"`.

<details>
<summary>Answer</summary>

```bash
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub --dsn "$DEV_DSN"
```

Everything after `--` is the server command; without it `--dsn` would be parsed as a Claude Code option. Use a read-only database user in the DSN.

</details>

### P3. Team server

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** .mcp.json

Write a `.mcp.json` entry for a team HTTP server at `https://mcp.example.com/mcp` that needs a bearer token each developer provides in `TEAM_MCP_TOKEN`.

<details>
<summary>Answer</summary>

```json
{
  "mcpServers": {
    "team-tools": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "headers": { "Authorization": "Bearer ${TEAM_MCP_TOKEN}" }
    }
  }
}
```

The token never enters the repository; each developer exports it.

</details>

### P4. Status meanings

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** server status

`claude mcp list` shows `⏸ Pending approval` for a server. What does it mean?

- A) The server crashed
- B) A project-scoped server from `.mcp.json` hasn't been approved yet, so it wasn't connected
- C) OAuth is needed
- D) The server is disabled for this project

<details>
<summary>Answer</summary>

**Answer:** B) A project-scoped server from `.mcp.json` hasn't been approved yet, so it wasn't connected

Run `claude` interactively and approve it (after reviewing `.mcp.json`). OAuth needs show as `! Needs authentication`.

</details>

### P5. Which definition wins?

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** precedence

`github` is defined at user scope with a personal token and in `.mcp.json` (project) with `${TEAM_TOKEN}`. You also added a local-scope `github` pointing to a mock. Which one connects?

<details>
<summary>Answer</summary>

The **local** one — precedence is local > project > user, and the whole entry from the winning scope is used (fields are not merged).

</details>

### P6. Missing type

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** JSON config

Claude Code skips `{"mcpServers":{"api":{"url":"https://api.example.com/mcp"}}}` with an error. Fix it.

<details>
<summary>Answer</summary>

Add `"type": "http"`. An entry with a `url` but no `type` is read as a stdio server and rejected: `MCP server "api" has a "url" but no "type"`.

</details>

### P7. Credential leak attempt

**Difficulty:** Hard · **Type:** Security · **Concepts:** env expansion safeguards

A cloned repository's `.mcp.json` contains `"headers": {"X-Key": "${ANTHROPIC_API_KEY}"}` for a server at an unfamiliar domain. What does Claude Code do with the variable, and what do you do?

<details>
<summary>Answer</summary>

Claude Code reads its own and cloud-provider credential variables (such as `ANTHROPIC_API_KEY`) as **empty** in a remote server's `url` and `headers`, so the key is not sent. But the intent is clearly hostile or careless: don't approve the server, report it, and review the rest of the repository's configuration before trusting it.

</details>

### P8. Scripted runs

**Difficulty:** Hard · **Type:** Security · **Concepts:** -p and project servers

A nightly `claude -p` job runs in a repository checkout. Why might it connect MCP servers you never approved, and how do you prevent it?

<details>
<summary>Answer</summary>

In `-p`, SDK and cloud sessions Claude Code can't show the approval prompt, so it loads `.mcp.json` servers without asking. Prevent it with `--strict-mcp-config` plus an explicit `--mcp-config`, `--setting-sources user`, `--bare`, or `disabledMcpjsonServers` entries.

</details>
