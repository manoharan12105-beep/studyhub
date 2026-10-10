# git switch and git checkout

**Module:** Branching and Merging · **Interview priority:** Core

## Learning Objectives

- Switch branches and create new ones with `git switch`.
- Explain the two jobs of the older `git checkout` and why Git split them.
- Predict what happens to uncommitted changes when you switch.

## What Is It?

- **`git switch <branch>`** moves `HEAD` to another branch and updates the working directory and index to that branch's commit. `git switch -c <new>` creates a branch and switches to it.
- **`git checkout`** is the older command that does **two unrelated jobs**: switching branches (`git checkout main`) and overwriting files (`git checkout -- README.md`). Git 2.23 (2019) introduced `git switch` for the first job and `git restore` for the second.

## Why It Matters

`git checkout` is still everywhere — tutorials, scripts, interview questions — and its dual meaning causes real accidents: `git checkout README.md` silently discards your edits to that file if no branch is named `README.md`. Using `switch` for branches and `restore` for files makes intent explicit.

## How It Works

Switching does three things:

```text
1. HEAD → refs/heads/<target>
2. index        ← target commit's snapshot
3. working dir  ← target commit's snapshot, for files that differ between the branches
   (your uncommitted changes are carried along when they don't collide)
```

## Switching and Creating

```bash
git switch feature/d-grade
```

**Output:**

```text
Switched to branch 'feature/d-grade'
```

```bash
git switch -c experiment/rounding
```

**Output:**

```text
Switched to a new branch 'experiment/rounding'
```

| Task | git switch | Older git checkout |
|------|-----------|--------------------|
| Switch to a branch | `git switch main` | `git checkout main` |
| Create and switch | `git switch -c fix/x` | `git checkout -b fix/x` |
| Create from a start point | `git switch -c fix/x v1.0.0` | `git checkout -b fix/x v1.0.0` |
| Go back to the previous branch | `git switch -` | `git checkout -` |
| Inspect an old commit (detached) | `git switch --detach 8ddf4ed` | `git checkout 8ddf4ed` |
| Track a remote branch | `git switch feature/x` (if only `origin/feature/x` exists, Git creates a tracking branch) | `git checkout feature/x` |

`git switch` refuses things that `checkout` silently allows — for example, `git switch 8ddf4ed` errors and asks for `--detach`, so you can't enter detached HEAD by accident.

## Uncommitted Changes When Switching

**Case 1 — the change doesn't collide.** `README.md` is modified, and it's identical on both branches:

**Output:**

```text
M	README.md
Switched to branch 'feature/d-grade'
```

The modification **comes with you** (`M README.md` is still listed by `git status`). Uncommitted changes don't belong to any branch.

**Case 2 — the change collides.** `GradeCalculator.java` is modified, and the target branch has a different version of it:

**Output:**

```text
error: Your local changes to the following files would be overwritten by checkout:
	src/main/java/com/example/gradebook/GradeCalculator.java
Please commit your changes or stash them before you switch branches.
Aborting
```

Nothing changed. Choose: commit the work, [stash it](../../undoing-and-recovery/git-stash/content.md), or discard it deliberately.

> [!CAUTION]
> `git switch --discard-changes` (or `-f`) and `git checkout -f` switch anyway and **throw away** uncommitted changes to the colliding files. Only use them when you are sure.

## The Two Faces of git checkout

```bash
git checkout feature/d-grade      # job 1: switch branch
git checkout -- README.md         # job 2: overwrite README.md from the index (discard edits)
```

The `--` means "what follows are file paths". Without it, `git checkout name` means "branch `name` if one exists, otherwise file `name`" — the ambiguity that motivated the split. The modern equivalents:

| Old | New |
|-----|-----|
| `git checkout <branch>` | `git switch <branch>` |
| `git checkout -b <new>` | `git switch -c <new>` |
| `git checkout -- <file>` | `git restore <file>` |
| `git checkout <commit> -- <file>` | `git restore --source=<commit> <file>` |

## Commands

### git switch

**Syntax:** `git switch [-c <new>] [--detach] <branch|commit>` · **Safety:** changes local state; refuses to overwrite uncommitted work unless forced.

### git checkout

**Syntax:** `git checkout [-b <new>] <branch>` · `git checkout [<commit>] -- <path>` · **Safety:** branch form is like `switch`; the path form is **Practice repository first** — it overwrites files without asking.

## Step-by-Step Example

1. `git status` — clean? If not, commit or stash.
2. `git switch -c fix/empty-marks main` — new branch from `main`, whatever you were on.
3. Work and commit.
4. `git switch -` — back to the previous branch.

## Common Mistakes

- **`git checkout <file>` to "look at" a file.** It discards your edits to it. Use `git show <commit>:<file>` to look.
- **Assuming uncommitted changes stay on the old branch.** They follow you to the new branch.
- **Forcing a switch to get past the "would be overwritten" error.** Stash instead.
- **Not knowing your Git version.** `git switch` needs Git 2.23+.

## Interview Angle

"What's the difference between `git switch` and `git checkout`?" — `checkout` both switches branches and restores files; Git 2.23 split these into `switch` (branches) and `restore` (files) to remove the dangerous ambiguity. `checkout` still works and is fine for branches.

## Recap

- `git switch` changes branches; `-c` creates; `-` returns; `--detach` inspects a commit.
- Uncommitted changes travel with you unless they collide — then Git refuses.
- `git checkout` does both branch switching and file overwriting; prefer `switch` + `restore`.
- Forced switches discard work.

## Related Topics

- [Branches](../branches-fundamentals/content.md)
- [git restore](../../undoing-and-recovery/git-restore/content.md)
- [Detached HEAD](../../rebasing-and-rewriting/detached-head/content.md)
