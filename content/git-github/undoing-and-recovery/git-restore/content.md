# git restore: Discard Edits, Unstage, Restore from Any Commit

**Module:** Undoing Changes and Recovering Work · **Interview priority:** Core

## Learning Objectives

- Discard unstaged edits to a file, and know they cannot be recovered afterwards.
- Unstage a file without touching your working copy.
- Restore one file from another commit without moving the branch.

## What Is It?

`git restore` (Git 2.23+) copies file content **into** the working directory and/or the staging area **from** somewhere else. It never moves a branch or creates a commit.

| Command | Copies from | Into | Everyday meaning |
|---------|-------------|------|------------------|
| `git restore <file>` | index | working directory | "Throw away my unstaged edits" |
| `git restore --staged <file>` | `HEAD` | index | "Unstage it, keep my edits" |
| `git restore --source=<commit> <file>` | that commit | working directory | "Bring back the old version of this file" |
| `git restore --source=<commit> --staged --worktree <file>` | that commit | index **and** working directory | "Old version, staged and on disk" |

## Why It Matters

These are the most frequent "undo" needs, and they're all **file-level**. Using `restore` instead of `reset` or `checkout` for them keeps the branch and history untouched and makes your intent explicit.

> [!CAUTION]
> `git restore <file>` (without `--staged`) **overwrites** your working copy. Unstaged edits were never stored by Git, so they are gone for good — no reflog, no undo. Check `git diff <file>` first, or stash the edits if you might want them.

## How It Works

```text
  HEAD (last commit) ──restore --staged──► index ──restore──► working directory
  any commit ──────────restore --source=<commit>───────────────►  (and/or index)
```

## Discarding Unstaged Edits

```bash
echo "oops" >> README.md
git status -s
git restore README.md
git status -s
```

**Output:**

```text
 M README.md
```

The second `git status -s` prints nothing: the file matches the index again.

## Unstaging

```bash
git add README.md
git status -s
git restore --staged README.md
git status -s
```

**Output:**

```text
M  README.md
 M README.md
```

The `M` moved from the left column (staged) to the right (unstaged). The edit itself is still in the file. This is what `git status` suggests: `(use "git restore --staged <file>..." to unstage)`. Older equivalent: `git reset HEAD <file>`.

## Restoring a File from Another Commit

Bring back `README.md` as it was in the first commit, leaving everything else alone:

```bash
git restore --source=8ddf4ed README.md
git status -s
git diff --stat
```

**Output:**

```text
 M README.md
 README.md | 4 ----
 1 file changed, 4 deletions(-)
```

The old version is now in the working directory as an ordinary modification: review it, then commit it (or `git restore README.md` to go back). Add `--staged --worktree` to put it in both areas at once:

```bash
git restore --source=HEAD~2 --staged --worktree src/main/java/com/example/gradebook/GradeCalculator.java
git status -s
```

**Output:**

```text
M  src/main/java/com/example/gradebook/GradeCalculator.java
```

Useful forms: `--source=main`, `--source=v1.0.0`, and the `.` pathspec to restore every file (`git restore --source=HEAD~1 .`).

## restore vs reset vs checkout vs revert

| Goal | Command | Moves the branch? |
|------|---------|-------------------|
| Discard unstaged edits to a file | `git restore <file>` | No |
| Unstage a file | `git restore --staged <file>` | No |
| Old version of one file | `git restore --source=<commit> <file>` | No |
| Undo whole commits locally | `git reset` | Yes — see [git reset](../git-reset/content.md) |
| Undo a pushed commit | `git revert` | No — adds a commit |
| Older spelling of the first and third rows | `git checkout -- <file>`, `git checkout <commit> -- <file>` | No |

## Commands

### git restore

**Syntax:** `git restore [--source=<tree>] [--staged] [--worktree] <pathspec>...` · **Safety:** `--staged` alone is safe (edits kept); writing to the working tree is **Practice repository first** — it discards unstaged edits.

| Option | Effect |
|--------|--------|
| `--staged` (`-S`) | Write to the index |
| `--worktree` (`-W`) | Write to the working directory (the default when `--staged` isn't given) |
| `--source=<commit>` (`-s`) | Take content from a commit (default: index for worktree, `HEAD` for staged) |
| `-p` | Choose hunks interactively |
| `--ours` / `--theirs` | During a conflict, take one side |

## Step-by-Step Example

You experimented in `GradeCalculator.java`, staged part of it, and want to back out completely:

1. `git diff --staged` and `git diff` — look at what you'd lose.
2. Keep a copy if in doubt: `git stash push -m "rounding experiment"`.
3. Otherwise: `git restore --staged --worktree src/main/java/com/example/gradebook/GradeCalculator.java` (source defaults to `HEAD` when `--staged` is given).
4. `git status` — clean.

## Common Mistakes

- **Using `git restore <file>` to unstage** — it discards edits instead. Unstaging is `--staged`.
- **Expecting restore to undo a commit.** It only changes files; the commit stays in history.
- **Restoring with `.` from the wrong folder.** `.` means the current directory and below.
- **Old Git versions:** `restore` needs Git 2.23+.

## Interview Angle

"How do you discard local changes to a file?" — `git restore <file>` (older: `git checkout -- <file>`), noting that it's irreversible. "How do you unstage?" — `git restore --staged <file>` (older: `git reset HEAD <file>`). "`restore` vs `reset`?" — restore is file-level and never moves a branch; reset moves the branch.

## Recap

- `git restore <file>` discards unstaged edits — irreversibly.
- `git restore --staged <file>` unstages and keeps edits.
- `--source=<commit>` brings back any version of a file without moving the branch.
- For whole commits use `reset` (local) or `revert` (shared).

## Related Topics

- [git reset](../git-reset/content.md)
- [git switch and git checkout](../../branching-and-merging/git-switch-and-checkout/content.md)
- [Lab 06 — Undo a Staged Change](../../labs/git-lab-06-undo-staged-change/content.md)
