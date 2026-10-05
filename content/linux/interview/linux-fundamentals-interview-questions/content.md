# Linux Fundamentals Interview Questions

**Module:** Interview · **Interview priority:** Core

## What Is It?

A mixed interview bank on Linux basics: what Linux is, the kernel and shell, the filesystem hierarchy, paths, essential file commands, viewing files, help, redirection, pipes and the core text tools. These are the questions of a first technical round or a campus placement. The [questions](interview-questions.md) combine ideas from several lessons.

## Why It Matters

- Almost every backend, DevOps, QA and support interview opens with Linux basics.
- Short, precise answers here build credibility for the harder questions that follow.

## Core Concept

### How to answer a fundamentals question

1. **Define** in one sentence ("The kernel is …").
2. **Say what it is for** or what problem it solves.
3. **Show a command** that demonstrates it.
4. **Compare** with the obvious alternative (`cat` vs `less`, `>` vs `>>`).

### Coverage

| Area | Lessons |
|------|---------|
| Linux and its structure | [Introduction](../../linux-fundamentals/linux-introduction/content.md), [Architecture](../../linux-fundamentals/linux-architecture/content.md), [Shell and Terminal](../../linux-fundamentals/shell-and-terminal/content.md) |
| Filesystem | [Filesystem Hierarchy](../../filesystem/filesystem-hierarchy/content.md), [Paths and Navigation](../../filesystem/paths-and-navigation/content.md) |
| Basic commands | [File and Directory Commands](../../basic-commands/file-and-directory-commands/content.md), [Viewing Files](../../basic-commands/viewing-files/content.md), [Command Help](../../basic-commands/command-help-and-lookup/content.md) |
| Streams and pipes | [Redirection](../../redirection-and-pipes/standard-streams-and-redirection/content.md), [Pipes](../../redirection-and-pipes/pipes-and-command-chaining/content.md) |
| Text processing | [grep](../../text-processing/grep-command/content.md), [sort, uniq, wc](../../text-processing/sort-uniq-and-wc/content.md), [cut, tr, paste](../../text-processing/cut-tr-and-paste/content.md) |

## Key Takeaways

- Linux = the kernel; a distribution = kernel + GNU tools + package manager + defaults.
- User space talks to the kernel through system calls; the shell is just a user program.
- Everything starts at `/`; know `/etc`, `/var`, `/home`, `/tmp`, `/usr`, `/proc`, `/dev`.
- Streams: stdin 0, stdout 1, stderr 2; `>` overwrites, `>>` appends, `|` connects stdout to stdin.
- Know the classic pairs: `cat`/`less`, `cp`/`mv`, `grep`/`find`, absolute/relative paths.
