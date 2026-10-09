# Block 4: MCP and Skills

## MCP in Five Lines

1. Open protocol: Claude Code (client) ↔ servers exposing tools, resources and prompts.
2. Transports: `stdio` (local process; stdout is protocol only) and `http` (remote). SSE is deprecated.
3. `claude mcp add [--scope local|project|user] <name> -- <command>`; `list`, `get`, `remove`; `/mcp`.
4. Tools are `mcp__<server>__<tool>`; permission rules and hooks use that name.
5. Results are untrusted input; servers run as you; tokens via `${VAR}`, never committed.

## MCP Scopes

| Scope | Where | Shared |
|-------|-------|--------|
| local (default) | `~/.claude.json` per project | No |
| project | `.mcp.json` | Yes — needs approval |
| user | `~/.claude.json` | No — all projects |

`claude mcp list` statuses: `✔ Connected`, `✘ Failed to connect`, `⏸ Pending approval`.

## Skills in Five Lines

1. `SKILL.md` = frontmatter + instructions, in `.claude/skills/<name>/`.
2. Description always listed; body loads on `/name` or a description match.
3. `$ARGUMENTS` and `` !`command` `` injection ground it in real data.
4. `allowed-tools` pre-approves tools for the invoking turn only (and isn't trust-gated).
5. `disable-model-invocation: true` for side-effect workflows; `paths` for area-specific skills.

## Which Mechanism?

| Need | Use |
|------|-----|
| Always-true project fact | CLAUDE.md |
| Repeatable procedure | Skill |
| Must-hold rule | Hook / permission rule |
| External system access | MCP server (or a CLI like `gh`) |
| Isolated, verbose or read-only work | Subagent |

## Validation and Cost

- `claude plugin validate .claude/skills` — broken YAML = skill loads with empty metadata.
- `/skills` (sort by tokens), `/skill-doctor`, `/context` — retire unused skills.
- Disable unused MCP servers; prefer CLIs when available.

## Self-Check

- Why does a stdio server break when it logs with `System.out`? → stdout must carry only protocol messages.
- Team-shared server? → project scope (`.mcp.json`); each developer approves.
- Release check skill Claude must never start itself? → `disable-model-invocation: true`.
- Skill with `Bash(*)` in `allowed-tools`? → Too broad; pre-approve exact commands.
