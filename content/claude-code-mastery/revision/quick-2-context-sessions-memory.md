# Block 2: Context, Sessions and Memory

## Context Window

- Everything Claude sees each request: system prompt, instructions, memory, tool and skill listings, conversation, tool results.
- `/context` shows the breakdown. Big consumers: long conversations, verbose tool output, large CLAUDE.md, many MCP servers/skills.

## Commands to Know Cold

| Command | Effect |
|---------|--------|
| `/compact [focus]` | Summarize and continue the same task |
| `/clear` | Fresh conversation for a new task |
| `/rewind` | Restore code and/or conversation to a checkpoint |
| `/rename`, `/resume`, `--continue` | Name, find, reopen sessions |
| `/branch` | Explore another direction from here |
| `/memory` | Open CLAUDE.md files and auto memory |

## Checkpoints vs Git

- Checkpoints: automatic per prompt; Claude's file edits; session-local; not Bash side effects.
- Git: durable, shared, everything tracked. Commit after each verified step.

## Instructions

| File | Loads |
|------|-------|
| `~/.claude/CLAUDE.md` | All your projects |
| `./CLAUDE.md` / `.claude/CLAUDE.md` | This project (committed) |
| `CLAUDE.local.md` | You, this project |
| `<subdir>/CLAUDE.md` | When working there |
| `.claude/rules/*.md` + `paths` | For matching files |
| `@path` imports | Up to 4 hops |

Write CLAUDE.md as short, specific, verifiable facts: commands, conventions, rules, definition of done. It's guidance — enforce must-hold rules elsewhere.

## Auto Memory

- Claude's own notes per project; `MEMORY.md` first 200 lines / 25 KB load each session.
- Review it with `/memory`; delete wrong entries; turn it off if unwanted.

## After Compaction

- Root CLAUDE.md and unscoped rules re-read; auto memory reloads; skills re-attached within a budget.
- Conversation details are summarized → keep plans and decisions in files.

## Self-Check

- Switching to an unrelated task? → `/clear`.
- Claude edited the wrong file 2 turns ago? → `/rewind`.
- A Bash command deleted a local file? → Git (or recreate) — checkpoints don't track it.
- A rule Claude keeps ignoring? → shorten/clarify; if it must hold, add a hook or permission rule.
