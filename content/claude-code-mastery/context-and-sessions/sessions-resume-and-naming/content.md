# Saving, Resuming and Organizing Sessions

**Module:** Context Windows, Sessions and Checkpoints · **Interview priority:** Frequently asked

## Definition

A **session** is a saved conversation tied to a project directory. Claude Code writes every message, tool call and result to a local transcript as you work, so you can **resume** a session later, **name** it to find it again, or **branch** it to try another approach without losing the original.

## Why It Matters

- Real tasks span days: an investigation on Monday, a fix on Tuesday, review feedback on Thursday. Resuming avoids re-explaining everything.
- Named sessions work like branches for your conversations: one per workstream.
- Knowing what a session does **not** restore (some launch flags, background tasks, in-process agent team members) prevents surprises.
- Session history is not version control. Mixing them up leads to lost work.

## How It Works

```text
~/.claude/projects/<project>/<session-id>.jsonl      ← one JSONL transcript per session
         │
         ├── claude --continue         most recent session in this directory
         ├── claude --resume [name]    picker, or a named/ID'd session
         ├── /resume                   switch sessions from inside Claude Code
         └── /branch, --fork-session   copy history into a new session ID
```

`<project>` is derived from the working directory path. Transcripts are kept for 30 days by default (`cleanupPeriodDays`). The JSONL format is internal and changes between versions — use `/export` or `claude -p --output-format json` for anything a script must read.

## Resuming

| Command | What it does |
|---------|--------------|
| `claude --continue` (`-c`) | Reopen the most recent conversation in the current directory |
| `claude --resume` (`-r`) | Open the session picker |
| `claude --resume pay-endpoint` | Resume a named session directly (exact match) |
| `claude --resume <session-id>` | Resume by ID, from any directory |
| `claude --from-pr 42` | Pick among sessions linked to pull request 42 |
| `/resume` | Switch to another conversation inside a running session |

Sessions started with `claude -p` (or the Agent SDK) are left out of the picker and of `--continue`; resume them by ID.

**What a resumed session restores:** the conversation history (including tool calls), the model, a session's `--agent`, the permission mode in most terminal resumes (with exceptions: a session that ended in `bypassPermissions` restarts in the mode a new session would use), and unexpired scheduled tasks.

**What it does not restore:** launch flags such as `--add-dir`, `--mcp-config`, `--settings` and `--plugin-dir` (pass them again); directories added with `/add-dir`; background Bash commands. A tool call that was cut off by a crash is shown to Claude as interrupted, not silently re-run.

On a Pro or Max plan, resuming a session that has been inactive for more than about an hour and is over 100,000 tokens offers **Resume from summary** (runs `/compact` first, cheaper later) or **Resume full session as-is**.

## Naming and Organizing Sessions

| When | How |
|------|-----|
| At startup | `claude -n pay-endpoint` |
| During a session | `/rename pay-endpoint` |
| In the picker | Highlight a session, `Ctrl+R` |
| Automatically | Accepting a plan generates a title from the plan |

Unnamed sessions get a generated title (a short summary of your first prompt), which also works as a resume handle.

**The session picker** (`claude --resume` or `/resume`): arrow keys to move, `Enter` to resume, `Space` to preview, `/` to search (paste a pull request URL to find the session that created it), `Ctrl+W` to widen to all worktrees, `Ctrl+A` to all projects, `Ctrl+B` to the current Git branch.

A naming convention that works on teams: `<ticket>-<intent>` — `BUG-101-investigate`, `FEAT-7-implement`, `PR-42-review`.

## Branching a Session

```text
/branch try-optimistic-locking
```

`/branch` copies the conversation so far into a new session and switches you into it; the original stays unchanged and resumable. From the command line: `claude --continue --fork-session`. Use it to explore an alternative approach while keeping the first one intact.

If you resume the **same** session in two terminals without forking, messages from both interleave into one transcript — fork instead.

## Session History vs Git History vs Filesystem

| | Session history | Git history | Filesystem |
|---|---|---|---|
| What it records | The conversation: prompts, tool calls, outputs | Committed snapshots of files | The current files |
| Where | `~/.claude/projects/...` on your machine | `.git` in the repository, plus remotes | Your working tree |
| Shared with team? | No | Yes (when pushed) | No |
| Kept for | 30 days by default | Permanently | Until changed |
| Undo tool | `/rewind` (checkpoints, next lesson) | `git restore`, `git revert`, branches | Your editor, backups |

Resuming a session restores the *conversation*, not the files. If you edited files in your IDE or switched Git branches since, the files are whatever they are now — Claude sees the current branch's files, while its conversation still remembers the old ones.

## Exporting and Deleting

- `/export` copies the conversation as readable text or saves it to a file — useful for a pull request description or an incident write-up.
- `claude purge <path>` deletes a project's local Claude Code state (transcripts, file history, its `~/.claude.json` entry); use `--dry-run` first.

## Real-World Example

Monday: `claude -n BUG-101-investigate` — you reproduce the null-discount bug and stop at the root cause. Tuesday: `claude -r BUG-101-investigate`, then *"implement the fix we agreed and add regression tests"*. Wednesday, a reviewer suggests a different approach: `/branch BUG-101-alt-validation` to try validating at the API boundary instead, while the original session keeps the first fix's context. You compare both diffs and keep one.

## Step-by-Step Walkthrough

1. Start work with a name: `claude -n <ticket>-<intent>`.
2. Before stopping for the day, ask Claude for a three-line status (what is done, what is next) — it ends up at the end of the transcript.
3. Commit work in progress on a branch; the session does not protect files.
4. Next day: `claude -r <name>`; re-pass any launch flags you used (`--add-dir`, `--mcp-config`).
5. To try an alternative, `/branch <name>`.
6. When the task ships, `/export` anything useful for the PR, then start new tasks in new sessions.

## Common Mistakes

- Expecting `--continue` to find a `claude -p` session.
- Resuming the same session in two terminals and getting an interleaved transcript.
- Treating the transcript as a backup of your code.
- Parsing the JSONL files in scripts — the format is internal.
- Forgetting to re-pass `--add-dir` after resuming, then wondering why Claude cannot read the second repository.

## Security Considerations

- Transcripts contain everything that entered the conversation — code, command output, anything sensitive you pasted. They are plain files under your home directory; protect them like source code, and shorten `cleanupPeriodDays` if policy requires.
- A session that ended in bypass permissions does not resume in bypass mode from the terminal; you must enable it again deliberately.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `No conversation found with session ID` | Wrong ID, or the transcript aged out | `claude --resume` and search; check retention |
| Session not in the picker | Started with `-p`, or in another project | Resume by ID; `Ctrl+A` in the picker |
| Claude cannot see a directory after resume | `--add-dir` not restored | Pass it again |
| Name resolves to several sessions | Ambiguous name | `claude --resume` opens the picker with the name as search |

## Trade-offs

| Approach | Benefit | Cost |
|----------|---------|------|
| Resume one long session per task | Continuity | Context grows; compaction loses detail |
| New session per phase with a notes file | Clean context | Must write the notes |
| Branching | Safe experiments | More sessions to manage |

## Interview Takeaways

- Explain `--continue`, `--resume`, names, the picker and `/branch`.
- State what resuming restores and what it does not (some flags, background tasks).
- Contrast session history, Git history and the filesystem — sessions are not version control.

## Key Takeaways

- Every session is saved locally as a transcript for 30 days by default.
- Name sessions per workstream; resume with `-c` or `-r`; branch to explore alternatives.
- Re-pass launch flags after resuming.
- Commit your code — resuming a conversation never restores files.
