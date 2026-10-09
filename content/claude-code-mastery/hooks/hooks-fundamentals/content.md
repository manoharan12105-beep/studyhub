# What Are Hooks? Lifecycle and Events

**Module:** Hooks and Workflow Guardrails · **Interview priority:** Core

> [!NOTE]
> **Checked against:** Claude Code v2.1.289, *Automate actions with hooks* and the *Hooks reference* (October 2026). The event list grows between versions; `/hooks` shows what your version supports.

## Definition

A **hook** is a handler — usually a shell command — that Claude Code runs automatically at a specific point in its **lifecycle**, called an **event**: before a tool runs, after it runs, when a session starts, when Claude finishes responding, and so on. Hooks give you **deterministic** control: the action always happens at that point, instead of relying on the model to remember to do it.

## Why It Matters

- Some things must happen every time: format the file Claude just edited, block edits to applied migrations, notify you when Claude waits for input. A sentence in `CLAUDE.md` is a request; a hook is a mechanism.
- Hooks can **inspect** what Claude is about to do and **block** it with a reason Claude can read and adapt to.
- They run with your full user permissions — a hook is code executing on your machine, so it is also a security topic.

## How It Works

```text
SessionStart ─► UserPromptSubmit ─► ┌─────────────── agentic loop ────────────────┐ ─► Stop ─► … ─► SessionEnd
                                    │ PreToolUse ─► (PermissionRequest) ─► tool    │
                                    │   runs ─► PostToolUse / PostToolUseFailure   │
                                    │   … PostToolBatch, SubagentStart/Stop …       │
                                    └──────────────────────────────────────────────┘
          Notification, PreCompact/PostCompact, ConfigChange, FileChanged … fire when their situation occurs
```

When an event fires, Claude Code runs every matching hook **in parallel**, sends each one the event's data as **JSON on stdin**, and reads back the **exit code** and **stdout/stderr** (or an HTTP response). Some events honour a block; others are informational.

## Hook Events

The events you will use most (the reference lists more):

| Event | Fires | Can block? |
|-------|-------|------------|
| `SessionStart` | A session begins or resumes (matchers: `startup`, `resume`, `clear`, `compact`, `fork`) | No — but plain stdout becomes context for Claude |
| `UserPromptSubmit` | You submit a prompt, before Claude processes it | Yes — rejects the prompt |
| `PreToolUse` | Before a tool call runs | **Yes — blocks the tool call** |
| `PermissionRequest` | Claude Code is about to ask you for permission | Via JSON decision (allow/deny), not exit code 2 |
| `PostToolUse` | After a tool call succeeds | No (already ran) — stderr goes to Claude |
| `PostToolUseFailure` | After a tool call fails | No — stderr goes to Claude |
| `Notification` | Claude Code sends a notification (`permission_prompt`, `idle_prompt` …) | No |
| `Stop` | Claude finishes responding | Yes — keeps Claude working |
| `SubagentStart` / `SubagentStop` | A subagent starts / finishes | Stop: yes |
| `PreCompact` / `PostCompact` | Around compaction | PreCompact: yes |
| `InstructionsLoaded` | A `CLAUDE.md` or rule file loads | No — useful for debugging |
| `ConfigChange` | A settings or skills file changes during a session | Yes (except managed policy) |
| `SessionEnd` | The session ends | No (short time budget) |

Other events cover worktrees, model switches, MCP elicitation, file and directory changes, tasks and agent teams.

## Blocking vs Informational

- **Blocking-capable** events represent something that has not happened yet: a tool call, a prompt, stopping. Exit code `2` (or a JSON decision) prevents it.
- **Informational** events report something that already happened or cannot be prevented: `PostToolUse` cannot undo an edit; `Notification` cannot cancel a notification. Exit code `2` there just surfaces a message.

> [!WARNING]
> Exit code **1** — the usual Unix failure code — does **not** block. For most events it is a non-blocking error and the action proceeds. A policy hook must exit **2** (or return a JSON deny).

## Hook Types

| `type` | What runs | Use for |
|--------|-----------|---------|
| `command` | A shell command (or an executable with `args`) | Most hooks: scripts, formatters, guards |
| `http` | POST of the event JSON to a URL | A shared audit or policy service |
| `mcp_tool` | A tool on a configured MCP server | Reusing an existing MCP integration |
| `prompt` | A single model call that returns `{"ok": true/false, "reason": …}` | Judgement calls ("are all tasks done?") |
| `agent` | A subagent that can read files and run tools before deciding | **Experimental** — verification against the codebase |

## Hooks vs Prompts, Skills, MCP and GitHub Actions

| | Runs when | Decided by | Deterministic? | Typical use |
|---|---|---|---|---|
| **Prompt / CLAUDE.md** | Whenever Claude reads it | The model | No | Conventions, preferences |
| **Skill** | You type `/name` or Claude finds it relevant | The model follows it | No | Procedures and reference knowledge |
| **Hook** | Every matching lifecycle event | Claude Code runs your handler | **Yes** (trigger is guaranteed) | Guardrails, formatting, notifications, context injection |
| **MCP tool** | Claude decides to call it | The model | No | Access to external systems |
| **GitHub Actions** | A repository event on GitHub | GitHub's runner | Yes | CI/CD on the server, independent of anyone's laptop |

Hooks run **inside a Claude Code session on the machine where it runs**. GitHub Actions run **on GitHub** when code is pushed — even if nobody used Claude Code. A local hook is never a substitute for server-side CI and branch protection.

## Real-World Example

On `orderdesk`, three hooks change daily work:

- `SessionStart` prints the branch, uncommitted file count and two reminders — Claude starts every session oriented.
- `PreToolUse` on `Edit|Write` blocks edits to existing Flyway migrations and `.env` files, with a reason Claude reads ("add a new V<n>__ file instead").
- `Notification` shows a desktop alert when Claude waits for permission, so you can work elsewhere.

All three are built and tested in [Lab 09](../../labs/cc-lab-09-create-hook/content.md).

## Common Mistakes

- Using exit code 1 for "block" — the action proceeds.
- Expecting `PostToolUse` to prevent an edit — it runs after.
- Writing a guard in `CLAUDE.md` and calling it a hook.
- Matching only `Edit` when Claude also uses `Write` (and can change files with `Bash`).
- Assuming a local hook protects the `main` branch on GitHub.

## Security Considerations

- Command hooks execute shell commands **with your full user permissions**. Review every hook, especially in repositories you did not write.
- In interactive sessions Claude Code holds back settings-file hooks until you trust the folder; in `claude -p` runs it treats the folder as trusted, so a repository's hooks run.
- Hooks are guardrails, not a security boundary: they see only what their script checks, can be bypassed by a different command spelling, and can fail open if the script errors.

## Troubleshooting

| Symptom | First check |
|---------|-------------|
| Hook never runs | `/hooks` — is it listed under the right event? Is the matcher exact (case-sensitive)? |
| Hook runs but doesn't block | Exit code must be 2, or JSON with the right fields for that event |
| "hook error" notice | Script failed — run it by hand with sample JSON on stdin |

(Module 5's last lesson covers debugging in depth.)

## Trade-offs

| Benefit | Cost |
|---------|------|
| Guaranteed execution at the event | You write and maintain scripts |
| Blocks with a reason Claude can use | Adds latency to every matching event |
| Zero context cost unless the hook outputs text | A buggy hook can block legitimate work or silently fail open |

## Interview Takeaways

- Hooks = deterministic handlers at lifecycle events; command, http, mcp_tool, prompt and (experimental) agent types.
- `PreToolUse` blocks with exit 2 or a JSON deny; `PostToolUse` cannot undo; exit 1 doesn't block.
- Contrast hooks with CLAUDE.md, skills, MCP tools and GitHub Actions.

## Key Takeaways

- Use a hook when something must happen every time, without relying on the model.
- Know which events can block, and block with exit 2.
- Hooks run your code with your permissions — review them like any script.
- Local hooks complement, never replace, server-side CI and protection.
