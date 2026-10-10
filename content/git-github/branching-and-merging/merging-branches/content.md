# Merging Branches: Fast-Forward and Three-Way Merges

**Module:** Branching and Merging · **Interview priority:** Core

## Learning Objectives

- Merge a branch into the current branch with `git merge`.
- Tell a fast-forward merge from a three-way merge, and predict which one Git will do.
- Explain the merge base and when to use `--no-ff` or `--ff-only`.

## What Is It?

`git merge <branch>` integrates the history of `<branch>` into the **current** branch. Git chooses one of two outcomes:

- **Fast-forward** — the current branch has no commits of its own since the other branch split off. Git simply moves the current branch pointer forward. No new commit is created.
- **Three-way merge** — both branches have new commits. Git combines the changes using three snapshots — the two branch tips and their **merge base** (the most recent common ancestor) — and records a **merge commit** with two parents.

## Why It Matters

Merging is how work done on branches reaches `main`. Knowing which kind of merge happens explains the shape of your history, why some merges create commits and others don't, and what a team's "always use `--no-ff`" or "only fast-forward" policy means.

## How It Works

### Fast-forward

```text
before:  A ◄── B          main
                └── C     feature/d-grade         (main has nothing new since B)

git switch main && git merge feature/d-grade

after:   A ◄── B ◄── C    main, feature/d-grade   (main just moved to C)
```

**Output:**

```text
Updating c378147..ffc0059
Fast-forward
 src/main/java/com/example/gradebook/GradeCalculator.java | 1 +
 1 file changed, 1 insertion(+)
```

### Three-way merge

While Arjun added `ClassReport` on `feature/class-report`, Priya committed a README change on `main`:

**Output (`git log --oneline --graph --decorate --all`):**

```text
* d2762f9 (feature/class-report) Add ClassReport skeleton
| * 2196031 (HEAD -> main) Document the grading scale
|/  
* ffc0059 Add D grade
* c378147 Create gradebook project
```

The branches diverged at `ffc0059` — the merge base:

```bash
git merge-base main feature/class-report
```

**Output:**

```text
ffc00591f646a9abaff4c370b7e2fd8b1f931151
```

```bash
git merge feature/class-report
```

**Output:**

```text
Merge made by the 'ort' strategy.
 src/main/java/com/example/gradebook/ClassReport.java | 4 ++++
 1 file changed, 4 insertions(+)
 create mode 100644 src/main/java/com/example/gradebook/ClassReport.java
```

```text
*   e6416d8 (HEAD -> main) Merge branch 'feature/class-report'
|\  
| * d2762f9 (feature/class-report) Add ClassReport skeleton
* | 2196031 Document the grading scale
|/  
* ffc0059 Add D grade
* c378147 Create gradebook project
```

Without `--no-edit`, Git opens your editor with the default message "Merge branch 'feature/class-report'".

## Why "Three-Way"?

For each file Git compares **base**, **ours** (current branch) and **theirs** (merged branch):

| Base | Ours | Theirs | Result |
|------|------|--------|--------|
| X | X | Y | Y — only theirs changed |
| X | Y | X | Y — only ours changed |
| X | Y | Y | Y — both made the same change |
| X | Y | Z | **Conflict** — both changed the same lines differently |

Comparing only the two tips (a two-way merge) couldn't tell "they added this line" from "we deleted it"; the base answers that. `ort` is Git's default merge strategy since Git 2.34 (it replaced `recursive`).

## Forcing or Forbidding Fast-Forward

| Option | Effect | Typical use |
|--------|--------|-------------|
| (default) | Fast-forward when possible, otherwise merge commit | Personal work |
| `--no-ff` | Always create a merge commit | Keep each feature visible as a group in history |
| `--ff-only` | Fast-forward or fail; never create a merge commit | Keep history linear; forces you to rebase or update first |

```bash
git merge --no-ff docs/readme-run
```

**Output (`git log --oneline --graph -4` afterwards):**

```text
*   5f12141 (HEAD -> main) Merge branch 'docs/readme-run'
|\  
| * a9b0822 (docs/readme-run) Rename Run section
|/  
*   e6416d8 Merge branch 'feature/class-report'
```

`docs/readme-run` could have been fast-forwarded; `--no-ff` recorded a merge commit anyway.

## After the Merge

The merged branch still points at its last commit; delete it when you're done: `git branch -d feature/class-report` (it is now fully merged, so `-d` succeeds). If a merge goes wrong before you commit it, `git merge --abort` restores the pre-merge state. Undoing a merge that's already committed: `git reset --hard ORIG_HEAD` locally (unpushed) or `git revert -m 1 <merge>` (pushed) — see [git revert](../../undoing-and-recovery/git-revert/content.md).

## Commands

### git merge

**Syntax:** `git merge [--no-ff | --ff-only] [--no-edit] [--squash] <branch>` · **Safety:** changes local state; easy to abort before committing.

| Option | Effect |
|--------|--------|
| `--no-ff` / `--ff-only` | See above |
| `--no-edit` | Accept the default merge message |
| `--squash` | Stage the combined changes without creating a merge commit or recording the branch as merged |
| `--abort` | Stop a conflicted merge and return to the pre-merge state |

### git merge-base

**Syntax:** `git merge-base <a> <b>` · **Safety:** safe anywhere.

## Step-by-Step Example

1. `git switch main` — merge **into** the branch you are on.
2. `git log --oneline --graph --all -10` — predict: fast-forward or three-way?
3. `git merge feature/class-report`.
4. Build and test: a clean merge can still break the build (two compatible-looking changes that don't work together).
5. `git branch -d feature/class-report`.

The **branch and merge visualizer** in this lesson draws both kinds of merge step by step.

## Common Mistakes

- **Merging in the wrong direction.** `git merge X` brings X into the **current** branch. Check `git branch --show-current` first.
- **Assuming a conflict-free merge is correct.** Git merges text, not meaning; run the tests.
- **Using `--squash` and then deleting the branch with `-d`.** Squash doesn't record the branch as merged, so `-d` complains; that's expected.
- **Merging `main` into a feature branch dozens of times** — clutters history; consider rebasing private branches instead.

## Interview Angle

"Fast-forward vs three-way merge?" — fast-forward moves the pointer when the current branch hasn't diverged; three-way uses the merge base and both tips and records a merge commit with two parents. "What is a merge base?" — the best common ancestor of the two branches.

## Recap

- `git merge X` integrates X into the current branch.
- No divergence → fast-forward (pointer moves, no new commit).
- Divergence → three-way merge using the merge base → merge commit with two parents.
- `--no-ff` always records a merge; `--ff-only` refuses to.

## Related Topics

- [Merge Conflicts](../merge-conflicts/content.md)
- [Rebase vs Merge](../../rebasing-and-rewriting/git-rebase/content.md)
- [Merging Pull Requests](../../pull-requests-and-review/merging-pull-requests/content.md)
