# Shell and Bash Scripting Interview Questions

**Module:** Interview · **Interview priority:** Core

## What Is It?

An interview bank on the shell and Bash scripting: variables and the environment, quoting and expansion, startup files, script structure, exit codes, conditionals, loops, functions, special parameters, and the text tools (`grep`, `find`, `sed`, `awk`, `xargs`) that scripts glue together. Many interviews include "write a one-liner" or "write a small script" tasks; the [questions](interview-questions.md) include verified one-liners for the practice lab.

## Why It Matters

- DevOps, SRE, QA-automation and backend roles expect you to automate routine work in Bash.
- Quoting, exit codes and `$@` vs `$*` reveal quickly whether someone has written real scripts.

## Core Concept

### How to answer a scripting question

1. **Clarify the input and output** (file? arguments? what if it is missing?).
2. **Write the simplest working version** — one pipeline if it fits.
3. **Make it robust**: quote variables, check arguments, use exit codes, `set -euo pipefail` where suitable.
4. **Mention edge cases**: spaces in file names, empty input, missing files.

### Coverage

| Area | Lessons |
|------|---------|
| Shell | [Variables and Environment](../../shell-and-bash/shell-and-environment-variables/content.md), [Quoting and Expansion](../../shell-and-bash/quoting-and-expansion/content.md), [Startup Files and Aliases](../../shell-and-bash/shell-startup-files-and-aliases/content.md) |
| Scripting | [Script Basics](../../bash-scripting/bash-script-basics/content.md), [Conditionals](../../bash-scripting/bash-conditionals/content.md), [Loops](../../bash-scripting/bash-loops/content.md), [Functions](../../bash-scripting/bash-functions/content.md), [Practical Scripts](../../bash-scripting/bash-practical-scripts/content.md) |
| Text tools | [find](../../find-sed-awk/find-command/content.md), [sed](../../find-sed-awk/sed-command/content.md), [awk](../../find-sed-awk/awk-command/content.md), [xargs and tee](../../text-processing/xargs-and-tee/content.md) |

## Key Takeaways

- Start scripts with `#!/usr/bin/env bash` (or `#!/bin/bash`), make them executable, quote every expansion: `"$var"`, `"$@"`.
- Exit status 0 = success; `if cmd`, `&&`, `||` test it; `exit 1` on errors; `set -euo pipefail` for fail-fast scripts.
- `$1…$9`, `$#`, `"$@"` (each argument separately), `$?`, `$$`, `$!`.
- `[[ ]]` for strings and patterns, `(( ))` for arithmetic, `-f`/`-d`/`-z`/`-n` tests.
- Parameter expansion trims and defaults without external tools: `${f%.log}`, `${f#prefix}`, `${var:-default}`.
