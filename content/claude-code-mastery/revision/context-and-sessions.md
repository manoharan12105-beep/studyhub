# Context and Session Management

## What Fills the Context Window

| Item | When it loads |
|------|---------------|
| System prompt, tool definitions | Every request |
| CLAUDE.md (working dir + parents), user CLAUDE.md, managed policy | Session start |
| Subdirectory CLAUDE.md, path-scoped rules | When Claude works there |
| Auto memory `MEMORY.md` | Session start (first 200 lines / 25 KB) |
| Skill descriptions / agent descriptions | Session start (bodies on demand) |
| MCP tool names | Session start (full definitions when used — tool search) |
| Your messages, Claude's replies, tool results | As the conversation grows |

## Commands

| Command | Use it when |
|---------|-------------|
| `/context` | You want to see what's using the window |
| `/compact [focus]` | Same task, too much history — keep what you name |
| `/clear` | Switching to an unrelated task (free; keeps project instructions) |
| `/rewind` (Esc Esc) | Undo recent turns: code, conversation, or both; or summarize from a point |
| `/rename`, `/resume`, `claude --continue` | Name, find and reopen sessions |
| `/branch` | Try a different direction from here |
| `/btw` | Quick question about current context; no tools; not added to history |

## What Survives Compaction

- Project-root CLAUDE.md and unscoped rules: re-read from disk.
- Auto memory: re-loaded.
- Invoked skills: latest invocation re-attached (first 5,000 tokens each, 25,000 total).
- Path-scoped rules and nested CLAUDE.md: reload when matching files are read again.
- Conversation detail: summarized — decisions not written to a file can be lost.

## Checkpoints vs Git

| | Checkpoints (`/rewind`) | Git |
|---|---|---|
| Created | Every prompt that starts a turn | When you commit |
| Covers | Claude's file-tool edits | Everything tracked |
| Misses | Bash side effects, remote actions, some subagent edits | Uncommitted, untracked work you didn't stash |
| Lifetime | Session; cleaned up after retention (30 days default) | Permanent, shared |

## Habits

- One task per conversation; `/clear` between tasks.
- Plans and decisions in files, not only in the chat.
- Commit after each verified step on a branch.
- Delegate verbose work (searches, test logs) to subagents.
- After two failed corrections: rewind or clear and re-prompt better.
- Destructive Git (`reset --hard`, `clean -fd`): `git status` first, dry-run `git clean -n`.

## Worktrees

`claude --worktree <name>` runs a session in its own Git worktree and branch, so parallel sessions don't edit the same checkout. Subagents can use `isolation: worktree` (based on the remote default branch unless `worktree.baseRef: "head"`).
