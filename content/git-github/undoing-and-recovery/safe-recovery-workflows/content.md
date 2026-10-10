# Safe Recovery Workflows and Destructive Commands

**Module:** Undoing Changes and Recovering Work · **Interview priority:** Frequently asked

## Learning Objectives

- Classify Git commands by what they can destroy: nothing, uncommitted work, or shared history.
- Follow an inspect → back up → act → verify routine before any risky command.
- Use `git clean` safely with a dry run, and pick the least destructive undo for each situation.

## What Is It?

A **safe recovery workflow** is a habit: before changing state to "fix" something, you look at the current state, make it cheap to go back, choose the least destructive command that solves the problem, and check the result. It matters because the dangerous commands are also the most tempting ones under pressure.

## Why It Matters

Committed work is very hard to lose in Git (the reflog keeps it). Most real losses come from three things: discarding **uncommitted** changes, **force-pushing** over other people's commits, and **deleting** files Git never tracked. All three are avoidable with a few seconds of inspection.

## How It Works

### What each command can destroy

| Risk | Commands | Recoverable? |
|------|----------|--------------|
| Nothing (read-only) | `status`, `log`, `diff`, `show`, `blame`, `reflog`, `branch -v`, `remote -v`, `fetch` | — |
| Moves pointers only | `reset --soft/--mixed`, `branch -d`, `switch`, `commit --amend`, `rebase` | Yes — reflog |
| **Uncommitted changes** to tracked files | `reset --hard`, `restore <file>`, `checkout -- <file>`, `checkout -f`, `switch --discard-changes`, `stash drop/clear` | **No** (stash drop: only with the printed id) |
| **Untracked files** | `clean -f`, `clean -fdx` | **No** — Git never had them |
| Unmerged commits (until gc) | `branch -D`, `reset --hard` to an older commit | Yes — reflog, for a while |
| **Shared history** | `push --force`, deleting remote branches or tags | Only from someone's clone |

### The routine

```text
1. INSPECT   git status · git log --oneline --graph --all -10 · git stash list · git remote -v
2. BACK UP   git branch backup/<what> · git stash push -u -m "<what>"   (cheap insurance)
3. ACT       the least destructive command that solves the problem
4. VERIFY    git status · git log · build and test
5. CLEAN UP  delete the backup branch / stash once you're sure
```

## Choosing the Least Destructive Undo

| You want to… | Prefer | Avoid |
|--------------|--------|-------|
| Unstage a file | `git restore --staged <file>` | `git reset --hard` |
| Discard edits to one file | `git restore <file>` (after `git diff`) | `git reset --hard` (discards everything) |
| Set work aside | `git stash push -u` | Deleting files |
| Undo a local commit, keep the changes | `git reset --soft HEAD~1` | `--hard` |
| Undo a pushed commit | `git revert <hash>` | `reset` + `push --force` |
| Update a rebased branch on the remote | `git push --force-with-lease` | `git push --force` |
| Move the branch but protect local edits | `git reset --keep <commit>` | `git reset --hard <commit>` |
| Remove build output | `git clean -n` first, then `-f` with explicit paths | `git clean -fdx` blindly |

## git clean: Deleting Untracked Files

`git clean` deletes untracked files from the working directory — the only common Git command that destroys files Git **never stored**. It refuses to do anything without `-f` (unless `clean.requireForce` is set to false), and a **dry run** shows what it would delete:

```bash
git clean -n
```

**Output:**

```text
Would remove scratch.txt
```

```bash
git clean -nd       # also directories
git clean -ndx      # also ignored files (target/, .env …)
```

**Output:**

```text
Would remove scratch.txt
Would remove tmp/
Would remove scratch.txt
Would remove target/
Would remove tmp/
```

| Flag | Adds |
|------|------|
| `-n` | Dry run — always first |
| `-f` | Actually delete |
| `-d` | Untracked directories |
| `-x` | Ignored files too (build output, **and** local config like `.env`) |
| `-X` | Only ignored files |
| `-i` | Interactive selection |

> [!CAUTION]
> `git clean -fdx` deletes every untracked **and ignored** file: your `.env`, IDE settings, local databases, downloaded dependencies. There is no undo. Prefer `mvn clean` for build output, or name paths: `git clean -f -- tmp/`.

## Common Destructive-Command Mistakes

| Mistake | Consequence | Safer alternative |
|---------|-------------|-------------------|
| `git reset --hard` to "fix" a messy status | Uncommitted work lost | `git stash push -u`, then reset |
| `git checkout .` / `git restore .` to undo one file | Every unstaged edit lost | Name the file |
| `git push --force` after a rebase | Teammates' commits removed from the remote | `--force-with-lease`; branch protection |
| `git clean -fdx` to "start fresh" | Local config and secrets files gone | `git clean -n`, explicit paths |
| Deleting `.git` and re-cloning | Unpushed commits, stashes, reflog gone | Diagnose with status/log/reflog first |
| `git branch -D` from habit | Unmerged commits stranded | `-d`; read the warning; `git log main..branch` |

## Practising Safely

Practise every command in this module in `~/git-lab` ([The Git Practice Lab](../../vcs-fundamentals/git-practice-lab/content.md)), never in a real project, and never against a shared remote. The **troubleshooting simulator** in this lesson lets you pick commands for broken-repository scenarios and explains why the tempting choices are dangerous.

## Commands

### git clean

**Syntax:** `git clean [-n|-f] [-d] [-x|-X] [-i] [-- <path>...]` · **Safety:** dry run is safe anywhere; `-f` is **Practice repository first**.

## Step-by-Step Example

"Something's wrong — `git status` is a mess and I'm on the wrong branch with half-done edits."

1. **Inspect:** `git status`, `git branch --show-current`, `git log --oneline -5`, `git stash list`.
2. **Back up:** `git stash push -u -m "messy state before cleanup"` — everything is now saved.
3. **Act:** `git switch <right-branch>`, then `git stash pop` (or `git stash branch fix/x`).
4. **Verify:** `git status`, build, test.
5. **Clean up:** the stash was dropped by `pop`; delete any backup branches.

## Common Mistakes

- **Acting before looking.** Every command in step 1 is read-only — run them first.
- **Skipping the backup** because "it's just one command".
- **Trusting memory** about what's committed. `git status` tells the truth.

## Interview Angle

"What Git commands are dangerous and how do you protect yourself?" — name `reset --hard`, `clean -fdx`, `push --force`, `checkout/restore` on files, `branch -D`, `stash drop`; explain that uncommitted and untracked work is unrecoverable; describe inspect → backup → least destructive action → verify. Mention server-side branch protection for force pushes.

## Recap

- Committed work is recoverable; uncommitted and untracked work and shared history are the real risks.
- Inspect, back up (branch or stash), act minimally, verify.
- `git clean -n` before `-f`; avoid `-x` unless you mean it.
- Prefer restore, stash, soft reset, revert and force-with-lease over their destructive counterparts.

## Related Topics

- [git reflog](../git-reflog/content.md)
- [Diagnosing Repository State](../../troubleshooting/diagnosing-repository-state/content.md)
- [The Git Practice Lab](../../vcs-fundamentals/git-practice-lab/content.md)
