# Block 1: Fundamentals, Setup and Modes

## Claude Code in Five Lines

1. An agentic coding tool: it reads code, edits files, runs commands and iterates toward a goal.
2. It works inside **permissions** you set; by default it asks before edits and commands.
3. Its best results come from a **check it can run** — tests, a build — and evidence you review.
4. It runs in the terminal, IDE extensions, desktop app and web; `claude --version` shows yours.
5. It's a collaborator you supervise, not an autonomous committer or deployer.

## Setup Checklist

| Step | Command |
|------|---------|
| Install (macOS/Linux/WSL) | `curl -fsSL https://claude.ai/install.sh \| bash` (from the official docs) |
| Install (Windows PowerShell) | `irm https://claude.ai/install.ps1 \| iex` |
| Version | `claude --version` |
| Sign in / account | `claude`, then `/status` |
| Health check | `/doctor` |
| Personal safe defaults | `~/.claude/settings.json` with deny rules for secrets |

## The Six Modes

| Mode | Remember it as |
|------|----------------|
| `default` (Manual) | "Ask me first" |
| `acceptEdits` | "Edit freely, I'll read the diff" |
| `plan` | "Look, don't touch" |
| `auto` | "A classifier decides most prompts" |
| `dontAsk` | "Only what's pre-approved, deny the rest" |
| `bypassPermissions` | "No checks — sandbox only" |

Shift+Tab cycles; `--permission-mode <mode>` at start; `defaultMode` in settings (not `auto`/`bypassPermissions` from project settings).

## Not Modes

- **Model** (`/model`): which Claude. **Effort** (`/effort`): how hard it thinks. **Fast mode** (`/fast`): faster Opus, higher price.
- **"YOLO mode"**: slang for skipping permissions — not an official name; the CLI rejects `--permission-mode yolo`.

## First-Session Habits

- Start in **plan mode** on unfamiliar code; ask for `file:line` and "verified vs guess".
- Check claims with `grep` and by opening files.
- Keep the tree clean and work on a branch.
- Ask for evidence: the command run and its output.

## Self-Check

- Which mode for exploring a new repo? → `plan`.
- Which mode for a locked-down CI job? → `dontAsk` with explicit allowed tools.
- Is `/model opus` a permission change? → No.
