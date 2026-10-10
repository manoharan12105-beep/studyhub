# Branches: Movable Pointers to Commits

**Module:** Branching and Merging · **Interview priority:** Core

## Learning Objectives

- Explain what a branch is in Git and why creating one is instant.
- Create, list, rename and delete branches with `git branch`.
- Know which branch deletions are safe and which can lose commits.

## What Is It?

A **branch** is a named, movable pointer to a commit. Technically it's a tiny file under `.git/refs/heads/` containing one commit id. When you commit on a branch, Git moves that pointer to the new commit.

```text
            main
             │
A ◄── B ◄── C          feature/d-grade
             │              │
             └────── D ◄────┘     (D's parent is C)
```

A branch is **not** a copy of the files and not a folder. Commits don't belong to branches; a branch just marks the tip of one line of development.

## Why It Matters

Branches let you work on several things in parallel — a feature, a bug fix, an experiment — without them interfering, and keep `main` stable. Because a branch is only a pointer, creating, switching and deleting branches is cheap, so the normal Git workflow uses a new branch for **every** task.

## How It Works

```bash
git branch feature/d-grade
git branch -v
```

**Output:**

```text
  feature/d-grade c378147 Create gradebook project
* main            c378147 Create gradebook project
```

Both branches point at the same commit; `*` marks the current branch (the one `HEAD` points to). On disk:

```bash
cat .git/refs/heads/feature/d-grade
```

**Output:**

```text
c37814746dd0978b172dfcce31aca778dfbdd92f
```

A 41-byte file — that's the whole branch. (Git may later move refs into a single `packed-refs` file; the idea is the same — see [References and HEAD Internals](../../git-internals/refs-and-head-internals/content.md).)

## Creating, Renaming and Deleting

| Task | Command |
|------|---------|
| List local branches | `git branch` (`-v` adds the tip commit, `-a` adds remote-tracking branches) |
| Create (don't switch) | `git branch <name> [<start-point>]` |
| Create and switch | `git switch -c <name>` — see [git switch and git checkout](../git-switch-and-checkout/content.md) |
| Rename | `git branch -m <old> <new>` (`-m <new>` renames the current branch) |
| Delete a merged branch | `git branch -d <name>` |
| Force-delete an unmerged branch | `git branch -D <name>` |
| Which branches are merged into the current one | `git branch --merged` / `--no-merged` |
| Current branch name | `git branch --show-current` |

`git branch -d` protects you from losing work:

```bash
git branch -d feature/d-grade
```

**Output:**

```text
error: the branch 'feature/d-grade' is not fully merged
hint: If you are sure you want to delete it, run 'git branch -D feature/d-grade'
hint: Disable this message with "git config set advice.forceDeleteBranch false"
```

The branch has a commit ("Add D grade") that no other branch contains. `-d` refuses; `-D` would delete the pointer and leave the commit unreachable.

You also can't delete the branch you're on:

**Output:**

```text
error: cannot delete branch 'feature/rounding' used by worktree at '/home/student/git-lab/gradebook'
```

> [!CAUTION]
> `git branch -D` on an unmerged branch makes its unique commits unreachable. They are **recoverable for a while** through the reflog (`git reflog`, then `git branch <name> <hash>`), but they are not on any branch and garbage collection eventually deletes them. Check `git log main..<branch>` first. See [git reflog](../../undoing-and-recovery/git-reflog/content.md).

## Branch Names

Git allows `/` in names, so teams group branches by purpose:

| Prefix | Example |
|--------|---------|
| `feature/` | `feature/class-report` |
| `fix/` or `bugfix/` | `fix/empty-marks-npe` |
| `docs/`, `chore/`, `test/` | `docs/readme-run` |
| issue number | `fix/42-rounding` |

Use lowercase, hyphens, no spaces, and a name a teammate can understand. A branch named `feature` blocks `feature/x` (a ref can't be both a file and a folder).

## Commands

### git branch

**Syntax:** `git branch [-v] [-a] [-m] [-d|-D] [<name>] [<start>]` · **Safety:** listing is safe anywhere; creating/renaming changes local state; `-D` is **Practice repository first**.

## Step-by-Step Example

1. `git branch` — see where you are.
2. `git branch fix/empty-marks-npe` — create a pointer at the current commit.
3. `git branch -v` — both point at the same commit.
4. `git switch fix/empty-marks-npe`, commit a fix, `git switch main`.
5. `git branch --no-merged` — the fix branch is listed until it's merged.
6. After merging: `git branch -d fix/empty-marks-npe`.

## Common Mistakes

- **Thinking a branch copies the project.** It's a pointer; switching branches rewrites the working directory to match the target commit.
- **Creating a branch and forgetting to switch.** `git branch x` doesn't move you; `git switch -c x` does.
- **Reflexively using `-D`.** Read the "not fully merged" warning — it's protecting commits.
- **Long-lived branches** that drift far from `main` and become painful to merge.

## Interview Angle

"What is a branch in Git?" — a lightweight movable pointer to a commit, stored as a ref; committing moves it. "Why are Git branches cheap compared to SVN?" — no file copy, just a 41-byte ref. "What's the difference between `-d` and `-D`?" — merged check vs force.

## Recap

- A branch is a file holding a commit id; committing moves it forward.
- `HEAD` names the current branch; `*` marks it in `git branch`.
- `-d` deletes only fully merged branches; `-D` forces and can strand commits.
- Name branches by purpose: `feature/…`, `fix/…`.

## Related Topics

- [git switch and git checkout](../git-switch-and-checkout/content.md)
- [Merging Branches](../merging-branches/content.md)
- [HEAD and Relative References](../../history-and-inspection/head-and-relative-references/content.md)
