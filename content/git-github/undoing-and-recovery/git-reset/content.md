# git reset: Soft, Mixed and Hard

**Module:** Undoing Changes and Recovering Work · **Interview priority:** Core

## Learning Objectives

- Explain the three things `git reset` can change and how `--soft`, `--mixed` and `--hard` differ.
- Undo the latest commit while keeping its changes, staged or unstaged.
- Use `--hard` only after inspecting, and recover from it with the reflog.

## What Is It?

`git reset <commit>` **moves the current branch** to `<commit>`. Depending on the mode, it also resets the staging area and the working directory to match:

| Mode | Branch (HEAD) | Index | Working directory |
|------|---------------|-------|-------------------|
| `--soft` | moved | unchanged | unchanged |
| `--mixed` (default) | moved | reset to the commit | unchanged |
| `--hard` | moved | reset to the commit | **reset to the commit** |

The commits "after" the target aren't deleted — the branch just stops pointing at them. They stay reachable through the reflog for a while.

## Why It Matters

Reset is the precise tool for undoing **local** commits: re-doing the last commit, splitting it, squashing several, or throwing away an experiment. Misused, `--hard` destroys uncommitted work, and resetting a pushed branch rewrites shared history.

> [!CAUTION]
> `git reset --hard` overwrites tracked files in your working directory. **Uncommitted changes to tracked files are lost permanently** — they were never in a commit, so the reflog can't help. Before `--hard`: run `git status`, and commit or `git stash` anything you might want. Untracked files are not touched by reset (use `git clean` for those).

> [!WARNING]
> Resetting a branch that has been pushed rewrites history. On shared branches use [git revert](../git-revert/content.md) instead.

## How It Works

Starting point (`main` at `3a070e0`, clean working tree):

```text
3a070e0 Raise the B threshold to 78          ← main, HEAD
10b9974 Merge branch 'feature/class-report'
8b503ca Show each student's average in ClassReport
```

### --soft: uncommit, keep everything staged

```bash
git reset --soft HEAD~1
git log --oneline -1
git status -s
```

**Output:**

```text
10b9974 Merge branch 'feature/class-report'
M  src/main/java/com/example/gradebook/GradeCalculator.java
```

The branch moved back one commit; the change from `3a070e0` is **staged**, ready to be recommitted (with a better message, or combined with more changes).

### --mixed (default): uncommit and unstage

```bash
git reset HEAD~1
```

**Output:**

```text
Unstaged changes after reset:
M	src/main/java/com/example/gradebook/GradeCalculator.java
```

**Output (`git status -s`):**

```text
 M src/main/java/com/example/gradebook/GradeCalculator.java
```

The change is now **unstaged** in the working directory — useful when you want to re-stage it in pieces.

### --hard: uncommit and discard

With an uncommitted line added to `README.md` first:

```bash
git reset --hard HEAD~1
git status -s
```

**Output:**

```text
HEAD is now at 10b9974 Merge branch 'feature/class-report'
```

`git status -s` prints nothing. The threshold change **and** the uncommitted README line are gone from the working directory.

## Recovering from a Reset

The reset commit is still in the reflog:

**Output (`git reflog -3`):**

```text
10b9974 HEAD@{0}: reset: moving to HEAD~1
3a070e0 HEAD@{1}: reset: moving to 3a070e0
10b9974 HEAD@{2}: reset: moving to HEAD~1
```

```bash
git reset --hard 3a070e0
```

**Output:**

```text
HEAD is now at 3a070e0 Raise the B threshold to 78
```

The **commit** came back. The uncommitted README line did not — it was never committed. `ORIG_HEAD` also holds the position before the last reset, so `git reset --hard ORIG_HEAD` undoes a reset immediately afterwards.

## Common Uses

| Goal | Command |
|------|---------|
| Redo the last commit (message or content) | `git reset --soft HEAD~1`, adjust, `git commit` (or just `git commit --amend`) |
| Squash the last 3 commits into one | `git reset --soft HEAD~3 && git commit -m "…"` |
| Split the last commit | `git reset HEAD~1`, then stage and commit in pieces |
| Throw away the last commit entirely (local only) | `git reset --hard HEAD~1` |
| Make the branch match the remote exactly | `git fetch && git reset --hard origin/main` (discards local commits and edits) |
| Unstage a file | `git reset <file>` (same as `git restore --staged <file>`) |

## Commands

### git reset

**Syntax:** `git reset [--soft | --mixed | --hard | --keep] [<commit>]`, `git reset [<commit>] -- <path>` · **Safety:** `--soft`/`--mixed` change local state (recoverable via reflog); `--hard` is **Practice repository first**.

`--keep` is a safer alternative to `--hard`: it moves the branch and updates files, but **refuses** if any file with local changes would be overwritten.

## Step-by-Step Example

"My last commit included a debug line; I want to fix it before pushing."

1. `git status` — clean? Nothing to lose.
2. `git reset --soft HEAD~1` — changes return to the index.
3. `git restore --staged -p` or edit the file to remove the debug line.
4. `git commit -m "Round averages to two decimals"`.
5. `git log --oneline -2` — the new commit replaced the old one.

## Common Mistakes

- **`--hard` with uncommitted work you wanted.** Inspect and stash first.
- **Resetting a pushed branch, then pulling** — the reset commits come right back (and you diverge). Use revert for pushed commits.
- **Confusing `reset <file>` with `reset --hard`.** The path form only unstages.
- **Expecting reset to delete untracked files.** It doesn't; `git clean` does.

## Interview Angle

"Explain soft, mixed and hard reset" is a staple. Answer with the three-area table: soft moves HEAD only; mixed also resets the index; hard also resets the working directory. Add: commits are recoverable through the reflog; uncommitted changes destroyed by `--hard` are not; don't reset shared history — revert.

## Recap

- `reset` moves the current branch; the mode decides whether index and working tree follow.
- Soft = keep staged, mixed = keep unstaged, hard = discard.
- Reset commits are recoverable from the reflog or `ORIG_HEAD`; uncommitted edits after `--hard` are not.
- Use reset for local commits, revert for shared ones.

## Related Topics

- [git revert](../git-revert/content.md)
- [git reflog](../git-reflog/content.md)
- [Safe Recovery Workflows](../safe-recovery-workflows/content.md)
