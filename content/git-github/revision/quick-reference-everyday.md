# Quick Reference: Everyday Commands

Setup, the edit–stage–commit cycle and inspection. Safety: ✅ safe anywhere · 🔵 changes local state · ⚠️ practice repository first.

## Setup

| Command | What it does | |
|---------|--------------|-|
| `git config --global user.name "Name"` | Set your commit name | 🔵 |
| `git config --global user.email "you@example.com"` | Set your commit email | 🔵 |
| `git config --global init.defaultBranch main` | First branch name for new repositories | 🔵 |
| `git config --show-origin <key>` | Which file sets a value | ✅ |
| `git init` | New repository in this folder | 🔵 |
| `git clone <url> [dir]` | Copy a repository with full history | ✅ |

## The Daily Cycle

| Command | What it does | |
|---------|--------------|-|
| `git status -sb` | Branch, ahead/behind, two-column file status | ✅ |
| `git diff` | Unstaged changes | ✅ |
| `git add <path>` | Stage a file or folder | 🔵 |
| `git add -p` | Stage chosen hunks | 🔵 |
| `git add -A` / `-u` | Stage everything / tracked files only | 🔵 |
| `git diff --staged` | What the next commit contains | ✅ |
| `git commit -m "Subject"` | Record the staged snapshot | 🔵 |
| `git commit` | Same, with the editor for subject + body | 🔵 |
| `git commit --amend` | Replace the last (unpushed) commit | ⚠️ |
| `git rm --cached <file>` | Stop tracking, keep on disk | 🔵 |
| `git mv <old> <new>` | Rename and stage | 🔵 |

## Inspecting History

| Command | What it does | |
|---------|--------------|-|
| `git log --oneline --graph --decorate --all` | Picture of all branches | ✅ |
| `git log --author="Arjun" --since="2026-10-01 00:00"` | Filter by person and date (include a time) | ✅ |
| `git log --grep="rounding" -i` | Search messages | ✅ |
| `git log --follow -- <file>` | A file's history across renames | ✅ |
| `git log -S "<string>"` / `-G "<regex>"` | Commits that changed code | ✅ |
| `git show <commit>` | One commit and its diff | ✅ |
| `git show <commit>:<path>` | A file at a commit | ✅ |
| `git blame -L 10,20 <file>` | Last change per line | ✅ |
| `git grep -n "<pattern>" [<commit>]` | Search tracked files | ✅ |
| `git diff A B` / `git diff A...B` | Tip to tip / since they diverged | ✅ |
| `git rev-parse HEAD` / `--abbrev-ref HEAD` | Current commit id / branch name | ✅ |

## Status Codes

| Code | Meaning |
|------|---------|
| `??` | Untracked |
| ` M` | Modified, not staged |
| `M ` | Staged |
| `MM` | Staged, then modified again |
| `A ` | New file, staged |
| ` D` / `D ` | Deleted (unstaged / staged) |
| `R ` | Renamed (staged) |
| `UU` | Conflict — both modified |

## References

| Write | Means |
|-------|-------|
| `HEAD` | Current commit (via the current branch) |
| `HEAD~1`, `HEAD~3` | Parent, great-grandparent (first parents) |
| `HEAD^2` | Second parent of a merge |
| `main@{1}` | Where `main` was one move ago (reflog) |
| `@{u}` | The current branch's upstream |
| `origin/main` | Remote branch as of your last fetch |

## .gitignore Patterns

| Pattern | Matches |
|---------|---------|
| `target/` | Directory anywhere |
| `/target/` | Only at the root |
| `*.log` | Files ending in .log |
| `logs/*` + `!logs/keep.log` | Everything in logs except keep.log |
| `git check-ignore -v <path>` | Which rule matched |
