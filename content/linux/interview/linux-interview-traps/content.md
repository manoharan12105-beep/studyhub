# Linux Interview Traps

**Module:** Interview · **Interview priority:** Core

## What Is It?

A collection of statements and commands that *sound* right but are wrong — the misconceptions interviewers deliberately probe. Each [question](interview-questions.md) states the trap, explains the truth, and, where possible, proves it with a command you can run in the [practice lab](../../linux-fundamentals/linux-practice-lab/content.md).

## Why It Matters

- Interviewers use traps to separate memorised answers from real understanding ("Does `kill` always kill?", "Does deleting a file free its space?").
- Most of these traps are also real production bugs: empty files from `sort f > f`, scripts that break on file names with spaces, cron jobs that never run.

## Core Concept

### How to answer a trap question

1. **Do not agree too quickly.** If a statement uses "always", "never" or "just", look for the exception.
2. **State the precise rule** ("deleting needs write permission on the *directory*").
3. **Give the exception or the proof** — ideally a tiny command.
4. **Give the safe practice** that avoids the trap.

### Coverage

| Area | Lessons |
|------|---------|
| Redirection and pipes | [Standard Streams and Redirection](../../redirection-and-pipes/standard-streams-and-redirection/content.md), [Pipes](../../redirection-and-pipes/pipes-and-command-chaining/content.md) |
| Text tools | [sort, uniq and wc](../../text-processing/sort-uniq-and-wc/content.md), [grep](../../text-processing/grep-command/content.md) |
| Permissions | [File Permissions](../../permissions/file-permissions/content.md), [Special Permissions](../../permissions/special-permissions/content.md), [su and sudo](../../users-and-groups/su-and-sudo/content.md) |
| Processes and signals | [Processes](../../processes/linux-processes/content.md), [Signals](../../processes/linux-signals/content.md) |
| Shell and scripting | [Quoting and Expansion](../../shell-and-bash/quoting-and-expansion/content.md), [Environment Variables](../../shell-and-bash/shell-and-environment-variables/content.md), [Conditionals](../../bash-scripting/bash-conditionals/content.md), [Loops](../../bash-scripting/bash-loops/content.md) |
| Storage | [df and du](../../storage/disk-usage-df-du/content.md), [Inodes and Links](../../storage/inodes-and-links/content.md) |

## Key Takeaways

- `cmd file > file` empties the file before `cmd` reads it; `uniq` only removes **adjacent** duplicates.
- Deleting depends on the **directory**; a deleted file stays on disk while it is open; `kill` sends SIGTERM, which can be ignored.
- Quote variables, never parse `ls`, export variables that child processes need, and remember that pipelines run in subshells.
- `2>&1 > file` and `> file 2>&1` are different; `$?` changes after every command.
- `sudo cmd > /root/file` redirects as **you**, not as root.
