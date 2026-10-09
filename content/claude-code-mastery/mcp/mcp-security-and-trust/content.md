# MCP Security and Trust

**Module:** MCP and External Tools · **Interview priority:** Core

> [!NOTE]
> **Checked against:** Claude Code v2.1.289; *Connect Claude Code to tools via MCP* and *Security* (October 2026).

## Definition

**MCP security** is deciding which servers you allow to run or connect, what they can reach, what data they see, and how much Claude may do with their tools without a human. **Trust** is not a property of a server; it is a decision you make about its code, its operator, its credentials and the data that flows through it.

## Why It Matters

- A **local stdio server** is a program running with your user permissions — outside the Bash sandbox.
- A **remote server** receives the arguments Claude sends: possibly code, customer data or internal identifiers.
- Every **tool result** enters Claude's context and can carry instructions written by someone else (prompt injection).
- The official docs are explicit: Anthropic reviews connectors before listing them in its directory but **does not security-audit or manage any MCP server**.

## How It Works

```text
                  what can go wrong                              control
server code  ──── malicious or vulnerable package; latest     ── choose sources; pin versions; review
                  version pulled on every start (npx -y …)
credentials  ──── over-privileged token or DB user             ── least privilege: read-only, scoped
tool calls   ──── destructive write, data sent to third party  ── permission rules; ask/deny; human review
tool results ──── prompt injection, sensitive data in context  ── treat as untrusted; narrow queries; dev data
configuration ─── repository .mcp.json starts commands         ── approval prompts; trust; managed MCP policy
```

## Trust Questions for Any Server

1. **Who wrote and runs it?** Official vendor, your own team, an unknown package?
2. **How is it installed?** `npx -y package` downloads and runs whatever version is current — a supply-chain risk. Pin versions or vendor the server.
3. **What can it reach?** Filesystem, network, databases, production?
4. **What credentials does it hold?** Scoped, read-only, short-lived — or a personal admin token?
5. **What data leaves your machine?** Read the provider's data handling for remote servers.
6. **Which tools may run without a prompt?** Usually only read tools.

## Least Privilege in Practice

| Integration | Safe default |
|-------------|--------------|
| GitHub | Fine-grained token, only needed repositories; read-only unless writes are required; allow `get_`/`list_` tools, keep writes prompting |
| Database inspection | A **read-only** database user on a **development** database; never production credentials on a developer machine |
| Browser automation | Separate browser profile without your personal sessions; allowlisted sites |
| Documentation lookup | Read-only by nature; still treat fetched pages as untrusted input |
| OAuth servers | Pin scopes with `oauth.scopes` to the approved subset |

## Controls in Claude Code

**Permission rules** — MCP tools are `mcp__<server>__<tool>`:

```json
{
  "permissions": {
    "allow": ["mcp__github__get_issue", "mcp__github__list_issues"],
    "ask": ["mcp__github__create_pull_request"],
    "deny": ["mcp__db__execute_write"]
  }
}
```

(The tool names here are illustrative; use the names `/mcp` shows for your server.) Allow rules for MCP must name a specific server; `"deny": ["mcp__*"]` removes every MCP tool.

**Server-declared approval** — a server author can mark a tool with `_meta["anthropic/requiresUserInteraction"]: true`; Claude Code then prompts on **every** call, even in auto and bypass modes, and allow rules don't skip it. Use it for consent-style tools.

**Project approval** — `.mcp.json` servers need per-developer approval in interactive sessions; a repository's own approvals are ignored until the folder is trusted. Scripted (`-p`) runs load them without asking — use `--strict-mcp-config`, `--setting-sources user` or `disabledMcpjsonServers`.

**Organization policy** — managed MCP configuration can deploy a fixed set of servers (`managed-mcp.json`), provide servers to every user (`managedMcpServers`), and restrict servers with allow and deny lists (`allowedMcpServers`, `deniedMcpServers`).

**Environment hygiene** — Claude Code reads its own and cloud credentials as empty in remote servers' `url` and `headers`, so a project file can't forward them.

## Simulated vs Live Integrations

Be explicit about which you are using:

| Kind | Example | Risk |
|------|---------|------|
| **Local teaching server** | `RunbookServer.java` in Lab 10: canned data, no network | Minimal; still runs as you |
| **Mock or sandbox service** | A staging API with fake data | Low; check it really is isolated |
| **Live integration** | GitHub, a real database, a SaaS tool | Real data and real side effects |

StudyHub's MCP simulation (this module's interaction) runs entirely in the browser: no server, no network, no model.

## Real-World Example

A developer connects a community "postgres" MCP server with the team's shared admin connection string to "quickly look at a table". Claude, asked to "clean up test orders", calls a write tool and deletes rows in the shared database — the tool was allowed by a broad `mcp__postgres__*` rule. The fix the team adopted: a read-only user on a development database, allow rules for read tools only, writes denied, the server version pinned, and no shared admin credentials on laptops.

## Step-by-Step Walkthrough

1. Before adding a server, answer the six trust questions.
2. Create least-privilege credentials for it; store them in environment variables.
3. Add it at the narrowest scope that works.
4. Add permission rules: allow read tools, keep write tools prompting, deny destructive ones.
5. Treat its results as untrusted; avoid feeding it production data.
6. Review servers periodically; remove unused ones.

## Common Mistakes

- `allow: ["mcp__someserver__*"]` for a server with write tools.
- Production or admin credentials in an MCP configuration on a laptop.
- `npx -y` with unpinned packages from unknown publishers.
- Assuming a directory listing means a security audit.
- Approving a cloned repository's `.mcp.json` without reading it.

## Security Considerations

- Prompt injection through tool results is the defining MCP risk: an issue body, a web page or a database row can contain instructions. Permissions, auto mode's classifier, the sandbox and review are the defence — not the model's restraint.
- Local servers run outside the Bash sandbox; to box them in, run Claude Code inside a container or the sandbox runtime.

## Troubleshooting

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| A write tool ran without a prompt | Broad allow rule or a permissive mode | Narrow allow rules; add ask/deny for writes |
| Server appears in `-p` runs unexpectedly | Project `.mcp.json` loads without approval in `-p` | `--strict-mcp-config` with explicit `--mcp-config` |
| Organization blocks a server | Managed allow/deny lists | Ask the admin; use an approved server |

## Trade-offs

| Choice | Security | Convenience |
|--------|----------|-------------|
| Read-only, scoped credentials | High | Some tasks need a human to do writes |
| Broad allow rules | Low | Fewer prompts |
| Pinned, reviewed servers | High | Slower to adopt updates |
| Managed MCP policy | Consistent | Less individual flexibility |

## Interview Takeaways

- Every server is a trust decision about code, operator, credentials and data.
- Least privilege, pinned versions, narrow allow rules and untrusted-output handling.
- Know the controls: permission rules, `requiresUserInteraction`, project approval, managed MCP policy.

## Key Takeaways

- Local servers run as you; remote servers see what you send; results can inject instructions.
- Read-only, scoped credentials on development data are the default.
- Allow read tools, prompt for writes, deny destructive tools.
- Label integrations honestly: teaching mock, sandbox or live.
