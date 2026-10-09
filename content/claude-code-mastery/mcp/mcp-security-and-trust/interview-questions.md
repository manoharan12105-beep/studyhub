# MCP Security and Trust — Interview Questions

## Beginner

### Q1. Why shouldn't you trust every MCP server?

**Style:** Why

<details>
<summary>Answer</summary>

A local server is code running with your permissions; a remote server receives your data; any server's output enters Claude's context and can contain prompt injection. Anthropic doesn't security-audit or manage servers. Each one is a decision about its code, operator, credentials and data.

</details>

## Intermediate

### Q2. How do you apply least privilege to MCP?

**Style:** How

<details>
<summary>Answer</summary>

Scoped, read-only, short-lived credentials (fine-grained tokens, read-only DB users on dev data), the narrowest configuration scope, allow rules only for read tools, prompts for writes, denies for destructive tools, pinned server versions, OAuth scopes pinned to an approved subset, and removing servers you don't use.

</details>

### Q3. How does Claude Code protect against a malicious `.mcp.json` in a cloned repository?

**Style:** Security

<details>
<summary>Answer</summary>

Interactive sessions require per-developer approval of project servers, and the repository's own approval settings are ignored until the folder is trusted. Its own and cloud credentials read as empty in remote URLs and headers. But `-p`/SDK runs connect project servers without asking, so scripted use needs `--strict-mcp-config`, `--setting-sources` or `disabledMcpjsonServers`.

</details>

## Advanced

### Q4. Design a safe database-inspection setup for Claude Code.

**Style:** Workflow design

<details>
<summary>Answer</summary>

A pinned database MCP server (or the `psql` CLI) connecting as a read-only role to a development database with synthetic or anonymized data, credentials from an environment variable, local scope, allow rules for schema/read tools, writes denied, results kept small with narrow queries, and no network path to production from the laptop. Schema changes go through migrations and code review, never through the tool.

</details>

### Q5. What is different about MCP tools marked as requiring user interaction?

**Style:** Follow-up

<details>
<summary>Answer</summary>

The server sets `_meta["anthropic/requiresUserInteraction"]: true`; Claude Code then prompts a person on every call in every mode including auto and bypass, allow rules and hook allows don't skip it, there's no "don't ask again", and `dontAsk` denies it. It's meant for consent or access-grant steps where auto-approval would defeat the purpose.

</details>
