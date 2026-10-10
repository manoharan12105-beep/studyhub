# Merging Pull Requests: Merge Commit, Squash and Rebase

**Module:** Pull Requests and Code Review · **Interview priority:** Core

> [!NOTE]
> The merge button is a GitHub feature (**Instruction only**). The history each method produces was reproduced in the practice lab with the equivalent Git commands, and those graphs are real output.

## Learning Objectives

- Describe GitHub's three merge methods and the history each produces.
- Choose a method for a team and explain the trade-offs.
- Understand approvals, required checks and branch protection as merge gates, and close PRs without merging.

## What Is It?

When a pull request is ready, the merge button offers up to three methods (repository admins choose which are allowed in **Settings → General**):

| Method | What lands on `main` | Local equivalent |
|--------|---------------------|------------------|
| **Create a merge commit** | All PR commits + a merge commit with two parents | `git merge --no-ff feature` |
| **Squash and merge** | One new commit containing the whole PR's change | `git merge --squash feature && git commit` |
| **Rebase and merge** | Each PR commit re-created on top of `main`, no merge commit | `git rebase main` on the branch, then fast-forward `main` |

## Why It Matters

The merge method shapes `main`'s history for good: whether `git log` reads as features or as every "fix typo" commit, whether `git revert` can undo a feature in one step, and whether branches can be deleted safely afterwards.

## How It Works

The same PR — two commits on `feature/class-report`, while `main` gained "Fix README typo" — merged three ways:

**Merge commit** (`git merge --no-ff`):

```text
*   c837718 Merge branch 'feature/class-report'
|\  
| * 0b98c37 Add summary method
| * b49f095 Add ClassReport skeleton
* | 8906da9 Fix README typo
|/  
* c378147 Create gradebook project
```

**Squash** (`git merge --squash` then commit):

```text
* 9d9fad9 Add ClassReport (#14)
* f5f58ca Fix README typo
* f0999d3 Create gradebook project
```

Afterwards Git doesn't consider the branch merged — `git branch -d feature/class-report` says `error: the branch 'feature/class-report' is not fully merged` — because the original commits aren't ancestors of `main`.

**Rebase and merge** (rebase, then fast-forward):

```text
* 1ed5a15 Add summary method
* dfc94a8 Add ClassReport skeleton
* d5471a6 Fix README typo
* 16fca13 Create gradebook project
```

(Each method was run in a fresh lab repository, so the hashes differ between the three graphs.)

## Choosing a Method

| | Merge commit | Squash | Rebase |
|-|--------------|--------|--------|
| `main` history | Full detail, non-linear | One commit per PR, linear | Every commit, linear |
| Commit quality needed on the branch | High (all kept) | Low (squashed away) | High (all kept) |
| Revert a whole feature | `git revert -m 1 <merge>` | `git revert <commit>` | Revert each commit |
| Bisect | Works; merges add noise | Coarse (one big commit per PR) | Fine-grained |
| Branch shows as merged in Git | Yes | No | No (commits were re-created) |
| Original commit ids on `main` | Kept | Lost | Lost |

Many teams use **squash** for small PRs (clean `main`, PR number in each message) and allow **merge commits** for large, well-structured ones. There's no universally right answer — consistency matters most.

## Merge Gates

Before the button turns green, GitHub can require (via branch protection or rulesets on the base branch):

- a number of **approving reviews** (and approval from **code owners** for files they own);
- **status checks** passing — e.g. the Maven CI job from DevOps' [CI with GitHub Actions](../../../devops/ci-cd/ci-with-github-actions/content.md);
- the branch to be **up to date** with the base;
- **conversation resolution**, signed commits, linear history.

**Auto-merge** merges a PR automatically once all requirements are met; a **merge queue** serialises merges on busy repositories so each one is tested against the latest `main`. Details: [Branch Protection and Code Ownership](../../team-workflows/branch-protection-and-code-ownership/content.md).

## Closing and Cleaning Up

- After merging, **Delete branch** (or enable automatic deletion of head branches). Locally: `git switch main && git pull && git branch -d <branch>` (use `-D` after squash/rebase merges, once you've confirmed the PR merged), and `git fetch --prune`.
- **Closing without merging** keeps the PR and its discussion for reference; reopen if needed.
- A merged PR can't be "unmerged" — revert it (GitHub offers a **Revert** button that opens a new PR with the reverting commit).

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git merge --no-ff <branch>` | Merge-commit method locally | Changes local state |
| `git merge --squash <branch>` + `git commit` | Squash method locally | Changes local state |
| `gh pr merge <n> --squash --delete-branch` | Merge from the CLI | **Changes the remote** |

## Step-by-Step Example

1. PR #14 has two approvals and green checks.
2. The team convention is squash: edit the squash message to a good subject and keep the PR number — "Handle students with no marks in ClassReport (#14)".
3. **Squash and merge**, then **Delete branch**.
4. Locally: `git switch main && git pull`, `git branch -D fix/12-empty-marks`, `git fetch --prune`.

## Common Mistakes

- **Accepting the auto-generated squash message** — a list of "fix", "wip" lines.
- **`git branch -d` failing after a squash merge** and assuming the PR didn't merge — it did; Git just can't tell.
- **Continuing to commit on a branch after it was squash-merged** — the next PR re-includes old changes; start a fresh branch from `main`.
- **Rebase-merging a PR whose commits don't build individually.**

## Interview Angle

"Merge commit vs squash vs rebase merge?" — describe the resulting history, revertability, bisect and traceability, and give a reasoned team choice. Mention required reviews and checks as merge gates.

## Recap

- Merge commit keeps everything plus a merge; squash makes one commit; rebase replays commits linearly.
- Squash/rebase create new commits, so Git doesn't see the branch as merged.
- Required reviews, code owners and status checks gate the merge.
- Delete merged branches; revert merged PRs instead of rewriting `main`.

## Related Topics

- [Merging Branches](../../branching-and-merging/merging-branches/content.md)
- [git rebase and Rebase vs Merge](../../rebasing-and-rewriting/git-rebase/content.md)
- [Branch Protection and Code Ownership](../../team-workflows/branch-protection-and-code-ownership/content.md)
