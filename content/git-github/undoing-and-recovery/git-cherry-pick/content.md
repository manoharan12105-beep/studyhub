# git cherry-pick: Copying Individual Commits

**Module:** Undoing Changes and Recovering Work · **Interview priority:** Frequently asked

## Learning Objectives

- Copy a single commit from one branch to another with `git cherry-pick`.
- Record where a cherry-picked commit came from with `-x`.
- Resolve cherry-pick conflicts, and know when cherry-picking is the wrong tool.

## What Is It?

`git cherry-pick <commit>` takes the **change** introduced by one commit and applies it on top of the current branch as a **new commit** (same message and author, new id). The original commit stays where it is.

## Why It Matters

Typical uses: back-porting a bug fix from `main` to a release branch, rescuing one good commit from an abandoned branch, or moving a commit you made on the wrong branch. It's precise — one commit, not a whole branch — which is also its danger: the same change now exists as two different commits.

## How It Works

```text
main:         A ── B ── F1 ── F2          (F1 = fix, F2 = unrelated)
release/1.0:  A ── R1                      (released code)

git switch release/1.0
git cherry-pick -x F1

release/1.0:  A ── R1 ── F1'               (F1' = copy of F1's change)
```

Priya fixed the empty-marks error message on `fix/empty-average` (`a9f609c`), but the release branch needs only that fix, not the README note after it:

```bash
git switch release/1.0
git cherry-pick -x a9f609c
```

**Output:**

```text
Auto-merging src/main/java/com/example/gradebook/GradeCalculator.java
[release/1.0 3ec1b96] Clarify the empty marks error
 Date: Fri Oct 30 08:27:40 2026 +0530
 1 file changed, 1 insertion(+), 1 deletion(-)
```

`-x` appends the origin to the message:

**Output (`git log -1 --format=%B`):**

```text
Clarify the empty marks error

(cherry picked from commit a9f609c8ed08322254c283963dec1563f21f33a7)
```

The `Date:` line shows that the **author date of the original commit** is kept; the committer and commit date are new.

## Conflicts

If the target branch differs around the changed lines, the copy can't apply cleanly. The release line uses 80 for B; cherry-picking `main`'s "Raise the B threshold to 78":

```bash
git cherry-pick 3a070e0
```

**Output:**

```text
Auto-merging src/main/java/com/example/gradebook/GradeCalculator.java
CONFLICT (content): Merge conflict in src/main/java/com/example/gradebook/GradeCalculator.java
error: could not apply 3a070e0... Raise the B threshold to 78
hint: After resolving the conflicts, mark them with
hint: "git add/rm <pathspec>", then run
hint: "git cherry-pick --continue".
hint: You can instead skip this commit with "git cherry-pick --skip".
hint: To abort and get back to the state before "git cherry-pick",
hint: run "git cherry-pick --abort".
hint: Disable this message with "git config set advice.mergeConflict false"
```

Resolve as for any conflict, `git add`, `git cherry-pick --continue` — or `git cherry-pick --abort` to return to where you were.

## Several Commits

| Form | Picks |
|------|-------|
| `git cherry-pick A B C` | A, B and C in that order |
| `git cherry-pick A..C` | Commits after A up to and including C |
| `git cherry-pick A^..C` | A through C |
| `git cherry-pick -n <commit>` | Apply the change without committing (combine several into one commit) |
| `git cherry-pick -m 1 <merge>` | A merge commit's changes relative to its first parent |

## When Not to Cherry-Pick

- **To bring a whole feature branch over** — merge or rebase it instead; dozens of cherry-picks create duplicate commits and confusing history.
- **Regularly between two long-lived branches** — the same change appears twice with different ids; later merges between those branches may conflict on code that is "the same" in content.
- **Dependent commits** — picking a commit without the earlier ones it relies on gives code that doesn't compile.

Prefer: fix on the **oldest** branch that needs it (e.g. the release branch) and merge it forward into `main`; cherry-pick when that isn't how your team works.

## Commands

### git cherry-pick

**Syntax:** `git cherry-pick [-x] [-n] [-m <parent>] <commit>...`, `--continue | --skip | --abort` · **Safety:** changes local state (adds commits).

## Step-by-Step Example — Committed on the Wrong Branch

You committed a fix on `main` that should have gone to `fix/rounding` (and haven't pushed):

1. `git log --oneline -1` — note the hash, e.g. `5be1c02`.
2. `git switch fix/rounding && git cherry-pick 5be1c02`.
3. `git switch main && git reset --hard HEAD~1` — remove it from `main` (check `git status` first; only because it wasn't pushed).

## Common Mistakes

- **Forgetting `-x`** on back-ports — later nobody can tell the two commits are the same change.
- **Cherry-picking instead of merging** a set of related commits.
- **Picking a fix without its prerequisites** and not compiling.
- **Running `--skip` to get past a conflict** — that commit's change is dropped.

## Interview Angle

"What is cherry-pick and when would you use it?" — copies one commit's change onto the current branch as a new commit; back-port a hotfix, rescue a commit, move a commit off the wrong branch. Follow-up: drawbacks — duplicate commits with different ids, dependency problems, prefer merge for whole branches.

## Recap

- Cherry-pick applies one commit's change as a new commit on the current branch.
- `-x` records the source commit; author date is kept, commit id is new.
- Conflicts resolve like merges: `add` + `--continue`, or `--abort`.
- Use it for selected commits, not for moving whole branches.

## Related Topics

- [git revert](../git-revert/content.md)
- [Troubleshooting Commits and Branches](../../troubleshooting/troubleshooting-commits-and-branches/content.md)
- [Tags and GitHub Releases](../../tags-and-releases/github-releases/content.md)
