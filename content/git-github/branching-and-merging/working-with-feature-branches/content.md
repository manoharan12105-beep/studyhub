# Working with Feature Branches

**Module:** Branching and Merging · **Interview priority:** Frequently asked

## Learning Objectives

- Run the everyday feature-branch routine from a fresh branch to a merged change.
- Check how far a feature branch is ahead of and behind `main`.
- Keep a feature branch up to date by merging `main` into it (and know when rebasing is the alternative).

## What Is It?

The **feature-branch routine** is how one developer handles one task: branch from the latest `main`, commit the work on that branch, keep it current with `main`, then merge it back (usually through a pull request) and delete it. `main` only ever receives finished, reviewed work.

## Why It Matters

`main` is what everyone else builds on and what gets deployed. A feature branch lets you commit freely — half-done steps, experiments — without breaking `main`, and gives reviewers one coherent unit to look at. Keeping it current with `main` avoids a painful conflict at the end.

## How It Works

```text
1. git switch main && git pull            start from the latest main
2. git switch -c feature/class-report      one branch per task
3. edit → test → commit (repeat)           small atomic commits
4. bring in new main commits               merge main into the branch (or rebase)
5. push, open a pull request, review       see Pull Requests
6. merge into main, delete the branch
```

## Ahead and Behind

While Priya worked on `feature/class-report`, two commits landed on `main`:

```bash
git rev-list --left-right --count main...feature/class-report
```

**Output:**

```text
2	1
```

Left number: commits on `main` not on the feature branch (the branch is **2 behind**). Right number: commits on the feature branch not on `main` (**1 ahead**). Which commits is it missing?

```bash
git log --oneline feature/class-report..main
```

**Output:**

```text
ece4aa7 Raise the B threshold to 78
4c29fbd Fix README typo
```

## Keeping the Branch Updated: Merge main In

```bash
git switch feature/class-report
git merge main
```

**Output:**

```text
Merge made by the 'ort' strategy.
 README.md                                                | 1 +
 src/main/java/com/example/gradebook/GradeCalculator.java | 2 +-
 2 files changed, 2 insertions(+), 1 deletion(-)
```

**Output (`git log --oneline --graph --decorate -5`):**

```text
*   21c1ac7 (HEAD -> feature/class-report) Merge branch 'main' into feature/class-report
|\  
| * ece4aa7 (main) Raise the B threshold to 78
| * 4c29fbd Fix README typo
* | b49f095 Add ClassReport skeleton
|/  
* c378147 Create gradebook project
```

The branch now contains everything on `main` plus its own work. Conflicts, if any, are resolved here — on your branch, with your context — rather than when merging into `main`. Then run the tests again: your feature must work with the new `main`.

**The alternative: rebase.** `git rebase main` replays the feature commits on top of the new `main`, giving a straight line without the "Merge branch 'main' into…" commit — but it rewrites the branch's commits, so it's for branches nobody else has based work on. See [Rebase vs Merge](../../rebasing-and-rewriting/git-rebase/content.md).

| | Merge `main` into the feature | Rebase the feature onto `main` |
|-|-------------------------------|--------------------------------|
| History | Extra merge commit(s) | Linear |
| Rewrites commits | No | Yes (new hashes) |
| Safe on a shared branch | Yes | Only with agreement + `--force-with-lease` |
| Conflicts | Resolved once, in the merge | Possibly once per replayed commit |

With a remote, the update step is `git fetch` followed by `git merge origin/main` (or `git pull` on `main`, then merge) — see [git fetch and git pull](../../remote-repositories/git-fetch-and-pull/content.md).

## Branch Naming Conventions

Agree on a pattern and stick to it:

```text
feature/class-report        new capability
fix/42-empty-marks-npe      bug fix, optionally with the issue number
docs/readme-build-steps     documentation only
chore/bump-junit-5.11       maintenance
release/1.2                 release preparation (in workflows that use release branches)
```

Short, lowercase, hyphenated, describing the task — not the person (`priya-branch`) or the date.

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git switch -c <branch> main` | Start a branch from `main` | Changes local state |
| `git rev-list --left-right --count main...<branch>` | Behind/ahead counts | Safe anywhere |
| `git log --oneline <branch>..main` | Commits the branch is missing | Safe anywhere |
| `git merge main` (on the feature branch) | Bring `main`'s changes in | Changes local state |
| `git branch -d <branch>` | Delete after merge | Changes local state |

## Step-by-Step Example

Priya implements "class report":

1. `git switch main && git pull` (or, without a remote, `git switch main`).
2. `git switch -c feature/class-report`.
3. Commit `ClassReport` and its test as one atomic commit.
4. Two days later, `git rev-list --left-right --count main...feature/class-report` shows she is behind; `git merge main`, resolve, test.
5. Push and open a pull request; after approval it is merged.
6. `git switch main && git pull && git branch -d feature/class-report`.

## Common Mistakes

- **Branching from an old `main`.** Update `main` first, or branch from `origin/main` after a fetch.
- **Working on `main` directly** "just for a small fix" — then the fix can't be reviewed separately.
- **Letting a branch live for weeks.** The longer it lives, the bigger the final conflict. Merge small pieces.
- **One branch for several unrelated tasks.** Each task gets its own branch and pull request.
- **Forgetting to test after updating from `main`.**

## Interview Angle

"Describe your Git workflow for a new feature" — branch from latest `main`, small commits, keep it updated (merge or rebase), push, pull request with review and CI, merge, delete. "How do you keep a feature branch up to date?" — merge `main` in, or rebase if the branch is private; explain the trade-off.

## Recap

- One branch per task, from the latest `main`.
- `rev-list --left-right --count` shows behind/ahead; `log branch..main` shows what's missing.
- Merge `main` into the feature (safe, adds merge commits) or rebase (linear, rewrites).
- Clear names; short lives; delete after merging.

## Related Topics

- [Merging Branches](../merging-branches/content.md)
- [Rebase vs Merge](../../rebasing-and-rewriting/git-rebase/content.md)
- [Collaboration Workflows](../../team-workflows/git-collaboration-workflows/content.md)
- [Lab 03 — Feature Branch and Merge](../../labs/git-lab-03-feature-branch-merge/content.md)
