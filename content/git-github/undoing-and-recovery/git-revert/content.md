# git revert and Reset vs Revert

**Module:** Undoing Changes and Recovering Work · **Interview priority:** Core

## Learning Objectives

- Undo a commit that is already shared by creating a reverting commit.
- Revert a merge commit with `-m 1` and understand the consequence for re-merging.
- Choose correctly between `reset` and `revert`.

## What Is It?

`git revert <commit>` creates a **new commit** whose changes are the exact inverse of `<commit>`: lines it added are removed, lines it removed are added back. History is not rewritten — the original commit stays, followed later by its reversal.

## Why It Matters

Once a commit is on `main` (pushed, pulled by others, maybe deployed), the only safe way to undo it is to add another commit. Revert is that tool: it works with normal pushes, leaves a clear record of what was undone and why, and can itself be reverted to bring the change back.

## How It Works

```text
before:  A ◄── B ◄── C ◄── D          (C is the bad commit, D is later good work)
git revert C
after:   A ◄── B ◄── C ◄── D ◄── C'   (C' = inverse of C; D is kept)
```

```bash
git revert --no-edit 3a070e0
```

**Output:**

```text
[main 158213b] Revert "Raise the B threshold to 78"
 Date: Mon Oct 26 21:07:40 2026 +0530
 1 file changed, 1 insertion(+), 1 deletion(-)
```

```bash
git log --oneline -3
git log -1 --format=%B
```

**Output:**

```text
158213b Revert "Raise the B threshold to 78"
3a070e0 Raise the B threshold to 78
10b9974 Merge branch 'feature/class-report'
Revert "Raise the B threshold to 78"

This reverts commit 3a070e0d3d0abb543338e9b1bffc80830d43dd57.

```

Without `--no-edit`, Git opens the editor with that default message. **Replace or extend it with the reason** ("Revert: the policy change is postponed to next term") — the default only says *what* was reverted.

## Reverting a Merge Commit

A merge has two parents, so Git must be told which side is the "mainline" to keep:

```bash
git revert --no-edit 10b9974
```

**Output:**

```text
error: commit 10b997404d7d28c0dcbe8c24d68cd655ec2dfc74 is a merge but no -m option was given.
fatal: revert failed
```

```bash
git revert --no-edit -m 1 10b9974
```

**Output:**

```text
[main e255561] Revert "Merge branch 'feature/class-report'"
 Date: Mon Oct 26 21:09:40 2026 +0530
 1 file changed, 21 deletions(-)
 delete mode 100644 src/main/java/com/example/gradebook/ClassReport.java
```

`-m 1` means "keep parent 1 (`main` before the merge); undo what the merge brought in from parent 2" — here the whole `ClassReport` feature.

> [!WARNING]
> After reverting a merge, Git still considers the feature branch's commits **merged**. Merging the same branch again later brings in only *newer* commits, not the reverted ones. To re-introduce the feature, **revert the revert** (`git revert <hash-of-the-revert>`), then merge the newer work.

## Conflicts During Revert

If later commits changed the same lines, the inverse can't apply cleanly. Resolve like a merge conflict, `git add`, then `git revert --continue` (or `--abort`). Several commits: `git revert A B C`, or a range `git revert --no-commit OLD..NEW` followed by one `git commit`.

## Reset vs Revert

| | `git reset` | `git revert` |
|-|-------------|--------------|
| How it undoes | Moves the branch back; later commits leave the branch | Adds a new commit that inverts an old one |
| History | Rewritten | Preserved |
| Undo one commit in the middle | Not directly (would also drop everything after it) | Yes |
| Safe on pushed/shared branches | No | Yes |
| Typical use | Local cleanup before pushing | Undoing something on `main` or a release branch |
| Leaves a record | No (only the local reflog) | Yes — the revert commit with its message |

Rule of thumb: **reset what only you have; revert what others have.**

## Commands

### git revert

**Syntax:** `git revert [--no-edit] [--no-commit] [-m <parent>] <commit>...`, `git revert --continue | --abort | --skip` · **Safety:** changes local state (adds commits); safe on shared branches.

## Step-by-Step Example

A commit on `main` broke grading in production:

1. `git log --oneline -10` and `git show <hash>` — confirm the culprit.
2. `git switch main && git pull` — revert on top of the current `main`.
3. `git revert <hash>` — write a message explaining why.
4. Build and test — later commits may depend on the reverted change.
5. Push (or open a pull request for the revert, if `main` is protected).
6. Fix properly on a branch; when ready, re-apply (revert the revert, or a new commit).

## Common Mistakes

- **Resetting and force-pushing `main`** instead of reverting.
- **Keeping the default message** — record why.
- **Forgetting `-m 1`** for merges, or choosing the wrong parent number.
- **Re-merging a reverted branch** and expecting the old commits to come back.
- **Not testing** — a revert can break code that later commits built on the reverted change.

## Interview Angle

"How do you undo a commit that's already pushed?" — `git revert <hash>` and push; explain why not reset. "Difference between reset and revert?" — rewrite vs add; private vs shared. Bonus: reverting merges with `-m 1`, and "revert the revert" to re-apply.

## Recap

- `git revert` adds a commit that inverts another; history is preserved.
- Safe on shared branches; push normally.
- Merges need `-m 1`; re-applying a reverted merge needs reverting the revert.
- Reset for private history, revert for shared.

## Related Topics

- [git reset](../git-reset/content.md)
- [Rewriting History Safely](../../rebasing-and-rewriting/rewriting-history-safely/content.md)
- [Tags, Releases and Rollback Planning](../../tags-and-releases/github-releases/content.md)
