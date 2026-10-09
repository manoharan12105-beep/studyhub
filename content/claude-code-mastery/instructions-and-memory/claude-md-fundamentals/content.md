# What Is CLAUDE.md?

**Module:** Project Instructions, Rules and Memory · **Interview priority:** Core

## Definition

**`CLAUDE.md`** is a Markdown file of persistent instructions that Claude Code loads into the context at the start of every session. You write it; Claude reads it. It holds what you would otherwise re-explain every time: build and test commands, conventions, architecture decisions, "always do X" and "never do Y" rules.

`CLAUDE.md` files can exist at several **scopes** — organization, user, project and local — and they all load together.

## Why It Matters

- Each session starts with a fresh context window. Without `CLAUDE.md`, Claude rediscovers your build command and conventions every time — or guesses.
- A short, accurate project `CLAUDE.md` is the cheapest quality improvement available: it costs a few hundred tokens per session and prevents repeated mistakes.
- It is also the most misunderstood feature. `CLAUDE.md` **guides** Claude; it does not **enforce** anything.

## How It Works

```text
session start
   │
   ├─ managed policy CLAUDE.md          (organization; cannot be excluded)
   ├─ ~/.claude/CLAUDE.md               (you, every project)
   ├─ CLAUDE.md files from the filesystem root down to the working directory:
   │     ../CLAUDE.md  →  ./CLAUDE.md or ./.claude/CLAUDE.md  →  ./CLAUDE.local.md
   └─ .claude/rules/*.md without paths:  (next lesson)
                     │
                     ▼  concatenated into context, broadest first, closest last
later: a subdirectory's CLAUDE.md loads when Claude reads or edits a file in that subdirectory
```

- All discovered files are **concatenated**, not overridden. Instructions closer to the working directory are read last.
- Within a directory, `CLAUDE.local.md` comes after `CLAUDE.md`.
- `CLAUDE.md` content is delivered as a message after the system prompt, not as part of it. Claude tries to follow it; there is no guarantee of strict compliance, especially for vague or conflicting instructions.
- Block-level HTML comments (`<!-- maintainer note -->`) are stripped before the content reaches Claude — useful for notes to humans.

## User-Level vs Project-Level Instructions

| Scope | Location | Shared with | Use for |
|-------|----------|-------------|---------|
| **Managed policy** | `/Library/Application Support/ClaudeCode/CLAUDE.md` (macOS), `/etc/claude-code/CLAUDE.md` (Linux, WSL), `C:\Program Files\ClaudeCode\CLAUDE.md` (Windows) | Everyone on the machine | Company standards, compliance reminders |
| **User** | `~/.claude/CLAUDE.md` | Only you, all projects | Personal preferences: response style, your tools |
| **Project** | `./CLAUDE.md` or `./.claude/CLAUDE.md` | The team, via Git | Build commands, conventions, architecture |
| **Local** | `./CLAUDE.local.md` (add to `.gitignore`) | Only you, this project | Your sandbox URLs, your test data |

Rule of thumb: if a teammate cloning the repository needs it, it is **project**. If it is about how *you* like to work, it is **user**. If it is about your machine for this project, it is **local**.

## AGENTS.md

Many repositories already have an `AGENTS.md` for other coding agents. **Status:** Version-dependent (v2.1.277+). By default Claude Code reads `AGENTS.md` **instead of** `CLAUDE.md` only when there is no `CLAUDE.md` or `CLAUDE.local.md` in the working directory or above it. When both exist, it reads `CLAUDE.md`. The **Project instructions** option in `/config` can change this (`claude-md-and-agents-md` reads both). To share one file explicitly, put `@AGENTS.md` at the top of `CLAUDE.md` (imports are the next lesson).

## Instructions Are Context, Not Enforcement

| Need | Tool | Enforced by |
|------|------|-------------|
| "Use records for DTOs" | `CLAUDE.md` | The model's judgement |
| "Never read `.env`" | `permissions.deny: ["Read(./.env)"]` | Claude Code, always |
| "Run the formatter after every edit" | A `PostToolUse` hook | Claude Code, always |
| "Never push to main" | Deny or ask rule, branch protection on the server | Claude Code and GitHub |

The official memory docs put it directly: to block an action regardless of what Claude decides, use a hook or settings, not `CLAUDE.md`.

## Managing CLAUDE.md Files

| Command | Use |
|---------|-----|
| `/init` | Generate a starting `CLAUDE.md` from the codebase (or suggest improvements to an existing one) |
| `/memory` | List and open your `CLAUDE.md`, `CLAUDE.local.md` and auto memory files; toggle auto memory |
| `/context` | Check which memory files actually loaded |
| "add this to CLAUDE.md" | Ask Claude to edit the file for you (review the change) |

## Real-World Example

A new teammate's sessions keep running `mvn test` (no Maven installed globally) and suggesting `double` for prices. The project has no `CLAUDE.md`. Adding six lines — the wrapper command, "money is `long` cents", the test command for one class, "never edit applied migrations" — removes both mistakes for everyone who clones the repository.

## Step-by-Step Walkthrough

1. In the repository root, run `claude` and `/init`; read the generated file critically.
2. Delete anything Claude could discover by reading the code (directory listings, dependency lists).
3. Keep commands, conventions that differ from defaults, and gotchas.
4. Commit it. Put personal preferences in `~/.claude/CLAUDE.md` instead.
5. Start a new session and run `/context` to confirm it loaded.

## Common Mistakes

- Expecting `CLAUDE.md` to block actions. Use permissions and hooks.
- Writing project rules in your user file, so teammates never get them.
- Committing `CLAUDE.local.md` with personal URLs or credentials.
- Having both `CLAUDE.md` and `AGENTS.md` and expecting both to load by default.
- Asking Claude to "remember" a project rule — that goes to auto memory on your machine, not to the shared project file.

## Security Considerations

- A project's `CLAUDE.md` comes from the repository: in an untrusted repository it is text written by someone else that Claude will treat as instructions. Read it before trusting the project.
- Never put secrets in any `CLAUDE.md`; it is loaded into context and often committed.
- Imports of files **outside** the working directory trigger an approval dialog the first time in a project — a protection against a committed `CLAUDE.md` pulling in arbitrary files.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Claude ignores a rule | `/context` → is the file listed under memory files? Is the rule specific? Does another file contradict it? |
| A subdirectory's `CLAUDE.md` seems ignored | It loads only after Claude reads or edits a file in that subdirectory |
| `AGENTS.md` ignored | A `CLAUDE.md` exists on the path; change **Project instructions** in `/config` or import it |
| Instructions lost after compaction | Project-root `CLAUDE.md` is re-read; chat-only instructions are not |

## Trade-offs

| More in CLAUDE.md | Less in CLAUDE.md |
|-------------------|-------------------|
| Fewer repeated explanations | Lower context cost per session |
| Risk of bloat and lost rules | Risk of missing a key convention |

Target: under 200 lines per file (the docs' guidance); move procedures to skills and area-specific rules to `.claude/rules/`.

## Interview Takeaways

- `CLAUDE.md` = persistent instructions loaded every session, at managed, user, project and local scope, concatenated from broad to specific.
- It guides behaviour; permissions and hooks enforce.
- Know `/init`, `/memory`, `/context`, and how `AGENTS.md` interacts.

## Key Takeaways

- Write down what you would otherwise repeat; keep it short and specific.
- Project file for the team, user file for you, local file for your machine.
- Files concatenate; subdirectory files load on demand.
- Context, not enforcement: anything that must always hold belongs in settings or hooks.
