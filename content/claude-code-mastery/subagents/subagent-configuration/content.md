# Subagent Configuration, Tools and Permission Boundaries

**Module:** Subagents and Agent Teams · **Interview priority:** Frequently asked

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 and *Create custom subagents* (October 2026). The three orderdesk reviewer files passed `claude plugin validate .claude/agents`; they were not run in a model session.

## Definition

A **custom subagent** is a Markdown file with YAML frontmatter (configuration) and a body (the subagent's **system prompt**). The file's location sets who can use it; the frontmatter sets its name, when Claude should delegate to it, which tools and model it gets, and its permission mode, hooks, MCP servers, memory and isolation.

## Why It Matters

- The `tools` field is the difference between a reviewer that *can't* edit and one that *promises* not to.
- Permission modes are **inherited in ways that surprise people** — a subagent's `permissionMode: plan` is ignored when you run the session in auto mode.
- Shared, version-controlled agent files give a team identical reviewers.

## How It Works

```text
.claude/agents/security-reviewer.md
┌──────────────────────────────────────────┐
│ ---                                      │
│ name: security-reviewer      ◄── identity │
│ description: …               ◄── routing  │
│ tools: Read, Grep, Glob      ◄── enforced │
│ ---                                      │
│ You review one change …      ◄── system   │
│                                  prompt   │
└──────────────────────────────────────────┘
Claude reads descriptions to decide when to delegate; the body loads only when the subagent runs.
```

## Subagent Files and Scopes

| Location | Scope | Priority when names clash |
|----------|-------|---------------------------|
| Managed settings `.claude/agents/` | Organization | 1 (highest) |
| `claude --agents '<json>'` | This session only | 2 |
| `.claude/agents/` | This project (commit it) | 3 |
| `~/.claude/agents/` | All your projects | 4 |
| A plugin's `agents/` | Where the plugin is enabled | 5 |

- Directories are scanned **recursively**; identity comes from `name`, not the filename or subfolder.
- Claude Code watches agent directories and picks up edits within seconds — except a scope's **first** `agents` directory created during the session, which needs a restart.
- Plugin subagents ignore `hooks`, `mcpServers` and `permissionMode` for security.

## Frontmatter Reference (Most Used)

| Field | Effect |
|-------|--------|
| `name` (required) | Unique id; no `:`; hooks receive it as `agent_type` |
| `description` (required) | When Claude should delegate; "use proactively" encourages automatic use |
| `tools` | Allowlist; omitted = every tool available to subagents |
| `disallowedTools` | Denylist; applied first. `Bash(git push *)` here removes **all** of Bash — use a permission deny rule to block single commands |
| `model` | `sonnet`, `opus`, `haiku`, `fable`, a full model ID, or `inherit` |
| `effort` | `low` … `max`, if the model supports it |
| `permissionMode` | `default`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`, `plan` (see inheritance below) |
| `maxTurns` | Stop after N turns; output marked partial |
| `skills` | Preload full skill content at startup |
| `mcpServers` | Servers only this subagent gets (inline or by name) |
| `hooks` | Hooks active only while it runs (project agents need a trusted folder) |
| `memory` | `user`, `project` or `local` persistent memory directory |
| `isolation: worktree` | Work in a temporary Git worktree |
| `omitClaudeMd` | Start without user/project/local CLAUDE.md (v2.1.271+) |
| `background` | Always run in the background |

Field names are **camelCase** and must match exactly; unknown fields are ignored silently. A file without `name`, without `description`, or with YAML that doesn't parse is **skipped without a message** in the session (details in `--debug`). Check a directory with `claude plugin validate .claude/agents`.

## Restricting Tools

```yaml
tools: Read, Grep, Glob              # read-only: no Edit, Write, Bash, MCP
```

```yaml
disallowedTools: Write, Edit         # everything else, including Bash and MCP tools
```

```yaml
disallowedTools: mcp__github         # every tool except those from one MCP server
```

Some tools are never available to subagents (`AskUserQuestion`, `EnterPlanMode`, …), and **background** subagents get a smaller built-in set, so one definition can resolve differently in foreground and background. If nothing in `tools` resolves, the subagent refuses to launch with an error naming the bad entries.

> [!IMPORTANT]
> Bash is not read-only. A "read-only" reviewer with `Bash` can still run `rm` or `git push` unless permission rules or hooks stop it. For a strictly read-only reviewer, leave Bash out and pass the list of changed files in the task.

## Permission Modes and Inheritance

Without `permissionMode`, a subagent inherits the main conversation's mode. With it, **the parent's mode decides**:

| Main conversation mode | Subagent runs in |
|------------------------|------------------|
| `bypassPermissions`, `acceptEdits` or `auto` | The **parent's** mode; your `permissionMode` is ignored |
| `default`, `dontAsk` or `plan` | Your `permissionMode` — except `bypassPermissions` (keeps the parent's mode, v2.1.267+) and `auto` when auto mode isn't available |

So `permissionMode: plan` does **not** make a reviewer read-only if you run the session in `acceptEdits`. Tool restrictions do. Permission rules (`deny`, `ask`) and hooks from settings apply inside subagents too.

## Models, Memory and Worktree Isolation

**Model order:** per-invocation `model` → the definition's `model` → `CLAUDE_CODE_SUBAGENT_MODEL` → the main conversation's model. `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` (v2.1.257+) forces one model for all subagents. `/tasks` shows the model each running subagent uses.

**Persistent memory** (`memory: project`) gives the subagent `.claude/agent-memory/<name>/`, loads the first 200 lines or 25 KB of its `MEMORY.md`, and enables Read, Write and Edit for that directory — so a memory-enabled agent is **not** tool-free. It does nothing when auto memory is off.

**`isolation: worktree`** runs the subagent in a temporary Git worktree branched from the remote default branch (not your current `HEAD`, unless settings set `worktree.baseRef` to `"head"`); it is removed if nothing changed. Commands that try to reach the main checkout are refused.

## Syntax and Configuration

The orderdesk correctness reviewer, verbatim:

```markdown
---
name: correctness-reviewer
description: Read-only reviewer that checks an orderdesk change for logic errors, missed edge cases and broken contracts. Use when asked to review a change for correctness.
tools: Read, Grep, Glob
---

You review one change to orderdesk, a Spring Boot 4.1 application on JDK 21. You cannot edit files or run commands. The task message lists the changed files and what the change is meant to do; read those files and the code they call.

Check:

1. The change does what the task says, and nothing the task did not ask for.
2. Null, blank, zero, negative and boundary inputs, and integer arithmetic on money (`long` cents, rounding down).
3. HTTP behaviour: status codes, validation, and what happens to stored data when a request fails.
4. State changes: allowed and forbidden transitions, and repeated requests.

For every finding give `file:line`, what goes wrong, and an input that triggers it. Mark each finding **Confirmed** (you traced it in the code) or **Suspected** (you could not trace it fully). If you find nothing, say "No correctness findings" and list what you checked. Do not suggest style changes.
```

Validation:

```bash
claude plugin validate .claude/agents
```

**Output** (Windows run; the absolute path is shortened to `…`):

```text
Validating components in: …\.claude\agents

✔ Validation passed
```

## Real-World Example

Consider a team that runs a `db-migrator` subagent with `permissionMode: plan` "for safety" while the developer works in `acceptEdits`. The subagent can still edit a migration: `plan` is ignored because the parent mode wins. The fix is structural: give the reviewer variant `tools: Read, Grep, Glob`, and add `"ask": ["Edit(/src/main/resources/db/migration/**)"]` to the project settings, which applies to every agent.

## Step-by-Step Walkthrough

1. Create `.claude/agents/` (restart if the directory is new to this session).
2. Write `name` and a specific `description`.
3. Choose tools: start with `Read, Grep, Glob`; add only what the job needs.
4. Write the system prompt: role, inputs it receives, checks, report format, limits.
5. `claude plugin validate .claude/agents`.
6. Test with an @-mention on a known change; confirm with `/tasks` which model it used.
7. Commit it for the team.

## Common Mistakes

- Relying on `permissionMode: plan` for read-only behaviour.
- Listing `Bash` in a "read-only" reviewer.
- `disallowedTools: Bash(git push *)` expecting to block only push (it removes Bash).
- snake_case or misspelled fields (`disallowed_tools`) — silently ignored.
- Long descriptions: all subagent descriptions together over 15,000 tokens trigger a startup warning.

## Security Considerations

- Restrict tools in the definition; back it with deny/ask rules and hooks that apply to every agent.
- Review project agent files from untrusted repositories: `mcpServers` and `hooks` in them need workspace trust, but the system prompt and tools apply as soon as you delegate.
- `bypassPermissions` in a subagent only takes effect when the main conversation already bypasses permissions.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Agent not offered | New `agents` directory, missing `name`/`description`, bad YAML | Restart; `claude plugin validate`; `--debug` |
| Agent edits despite `plan` | Parent in `acceptEdits`/`auto`/`bypassPermissions` | Restrict `tools` |
| Agent fails to launch with zero tools | Misspelled tool names | Fix entries named in the error |
| Frontmatter hooks don't run | Project folder not trusted | Accept the trust dialog |

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| `tools` allowlist | Enforced, predictable | Must update when needs change |
| Cheaper model (`haiku`) | Faster, lower cost | Weaker reasoning on hard reviews |
| `memory` | Learns project patterns | Adds file tools; memory can go stale |
| `isolation: worktree` | No conflicts with your checkout | Based on default branch, not your branch |

## Interview Takeaways

- Agent files: frontmatter + system prompt; scopes managed > CLI > project > user > plugin.
- `tools`/`disallowedTools` enforce capability; `permissionMode` is overridden by permissive parent modes.
- Validate with `claude plugin validate .claude/agents`; bad files are skipped silently.

## Key Takeaways

- Read-only means **no Edit, Write or Bash in `tools`**.
- Know the inheritance table for permission modes.
- Choose model, memory and isolation deliberately; each has a cost.
- Treat agent files as shared code: review, validate, commit.
