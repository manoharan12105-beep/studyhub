# Subagents and Agent Teams

## Subagents in One Table

| Aspect | Detail |
|--------|--------|
| What | Separate worker: own context, system prompt, tools; returns one result |
| Sees | Its prompt, the delegation message, CLAUDE.md and Git status (not Explore/Plan), preloaded skills |
| Doesn't see | Your conversation (unless it's a fork), auto memory, output style |
| Built-ins | Explore (read-only, fast search), Plan (read-only, plan mode), general-purpose (all tools) |
| Files | `.claude/agents/*.md` (project), `~/.claude/agents/` (user); managed, `--agents` JSON, plugins |
| Priority | managed > `--agents` > project > user > plugin |
| Limits | 20 running at once (default); nesting up to 3 levels |
| Validate | `claude plugin validate .claude/agents` — bad files are skipped silently |

## Frontmatter Essentials

```yaml
---
name: security-reviewer          # required; no ":"
description: Read-only reviewer … # required; when to delegate
tools: Read, Grep, Glob          # allowlist → read-only
model: haiku                     # optional: sonnet, opus, haiku, fable, full ID, inherit
---
```

Other fields: `disallowedTools`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `isolation: worktree`, `effort`, `background`, `omitClaudeMd`. Names are camelCase; unknown fields are ignored without warning.

## Permission Mode Inheritance

| Session mode | Subagent runs in |
|--------------|------------------|
| `bypassPermissions`, `acceptEdits`, `auto` | The session's mode (its `permissionMode` ignored) |
| `default`, `dontAsk`, `plan` | Its own `permissionMode` (can't escalate to bypass) |

→ Read-only = **no Edit/Write/Bash in `tools`**, not `permissionMode: plan`.

## Forks

Fork = subagent that inherits the whole conversation (`/subtask <task>`); shares the prompt cache; its tool calls stay out of your context. Fork mode is on by default in interactive sessions (subagents run in the background).

## When to Delegate

- Yes: wide searches, verbose output, read-only reviews, independent parallel investigations.
- No: small sequential changes, iterative back-and-forth, tasks needing the conversation (use a fork).

## Parallel Review Pattern

1. Same inputs (changed files + requirement) to correctness, security, test-coverage reviewers.
2. Merge → deduplicate → **validate each finding** (open the line, reproduce) → Validated / Rejected / Needs a human.
3. Fix in a separate, reviewed step.

## Agent Teams (Experimental)

| Subagents | Agent teams |
|-----------|-------------|
| Report back to caller | Independent sessions; lead + teammates |
| Main agent coordinates | Shared task list + mailbox |
| Lower cost | Much higher cost (scales with teammates) |
| Stable | Opt-in: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`; interactive only |

Limits: `/resume`/`/rewind` don't restore in-process teammates; task status can lag; one team per session; no nested teams; fixed lead; teammates inherit the lead's mode (including bypass); teammate plan approvals are automatic. Best for research, review, competing hypotheses; avoid same-file edits.
