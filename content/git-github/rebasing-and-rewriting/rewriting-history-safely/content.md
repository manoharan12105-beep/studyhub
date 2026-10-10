# Rewriting History Safely

**Module:** Rebasing and History Rewriting · **Interview priority:** Core

## Learning Objectives

- List the commands that rewrite history and what "rewrite" means.
- Decide when rewriting is safe, when it needs coordination, and when it is off-limits.
- Publish a rewritten private branch with `--force-with-lease`, and know what teammates must do.

## What Is It?

**Rewriting history** means replacing existing commits with new ones: `git commit --amend`, `git rebase` (including `-i`), `git reset` to an earlier commit followed by new commits, `git cherry-pick` used to rebuild a branch, and history-filtering tools such as `git filter-repo`. The old commits aren't edited — commits are immutable — but the branch now points at different commits with different ids.

## Why It Matters

Locally, rewriting is a superpower: clean commits, fixed messages, removed debug code. Once commits are **shared**, rewriting them breaks other people's clones: their branches still contain the old commits, so the next pull produces duplicates, conflicts or — if someone force-pushes carelessly — **lost work**.

## How It Works

Priya pushed `feature/report`, then amended the commit's message:

```bash
git commit --amend -m "Add report notes for teachers"
git status -sb
```

**Output:**

```text
## feature/report...origin/feature/report [ahead 1, behind 1]
```

The amended commit replaced the pushed one, so the branches have diverged: one new commit locally, one old commit remotely. A normal push is refused:

**Output (`git push`):**

```text
To /home/student/git-lab/remotes/gradebook.git
 ! [rejected]        feature/report -> feature/report (non-fast-forward)
error: failed to push some refs to '/home/student/git-lab/remotes/gradebook.git'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart. If you want to integrate the remote changes,
hint: use 'git pull' before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
```

The hint's advice (`git pull`) is right for ordinary divergence but **wrong here**: pulling would merge the old commit back in. Because the branch is Priya's alone, she replaces the remote branch deliberately:

```bash
git push --force-with-lease
```

**Output:**

```text
To /home/student/git-lab/remotes/gradebook.git
 + 5839129...cda2b9e feature/report -> feature/report (forced update)
```

`+` and `(forced update)` mark a non-fast-forward update: commit `5839129` is no longer on the remote branch.

## The Safety Ladder

| Commits are… | Rewrite? | How |
|--------------|----------|-----|
| Local only, never pushed | Freely | amend, rebase, reset |
| Pushed to **your own** branch nobody else uses (e.g. your PR branch) | Yes, then force-push | `git push --force-with-lease` |
| Pushed to a branch others have pulled or built on | Only with explicit team agreement and a plan | Announce, force-push with lease, everyone resets |
| On `main`, release branches or tags | No | Add new commits instead: `git revert`, follow-up fixes |

The test question: **"Could anyone else have these commits?"** If yes, prefer adding a commit over rewriting.

## --force vs --force-with-lease

> [!CAUTION]
> `git push --force` overwrites the remote branch with yours **unconditionally**. If a teammate pushed commits since your last fetch, they are removed from the branch without warning.

`--force-with-lease` overwrites only if the remote branch is still where your remote-tracking branch (`origin/feature/report`) says it was — i.e. nobody pushed in between. If someone did, the push is rejected (`stale info`) and you fetch and look first. Details and a captured rejection: [Push Rejection, Divergence and Force-with-Lease](../../remote-repositories/push-rejection-and-divergence/content.md).

Caveat: a plain `git fetch` (or an IDE fetching in the background) updates `origin/…` and so refreshes the "lease" — the protection then compares against what you fetched, not what you've looked at. For the strongest guarantee name the expected commit: `git push --force-with-lease=feature/report:5839129`, or add `--force-if-includes`.

## When Rewriting Shared History Is Unavoidable

The main legitimate case is removing something that must not stay in history — a large binary that breaks the repository, or a secret (after rotating it — see [Secrets in Git History](../../authentication-and-security/secrets-in-git-history/content.md)). Then:

1. Announce it; ask everyone to push their work first.
2. Rewrite (for example with `git filter-repo`) and force-push all affected branches and tags.
3. Everyone re-clones, or resets each branch to the new remote (`git fetch && git reset --hard origin/<branch>` after saving local work).
4. On GitHub, cached views, forks and old pull requests may still reference the old commits; contact support for sensitive data.

## What Teammates Do After a Force-Push

If a teammate force-pushed a branch you have locally (and you have no local commits on it):

```bash
git fetch
git switch feature/report
git reset --hard origin/feature/report     # discards your copy of the old commits
```

If you **do** have local commits on top of the old version: `git rebase --onto origin/feature/report <old-upstream-commit>` replays only your commits, or create a branch, reset, and cherry-pick them. Inspect with `git log --oneline --graph feature/report origin/feature/report` before deciding.

## Merge or Rebase: Practical Rules

- Updating your private branch with `main` → rebase (linear) or merge (simpler); your choice.
- Updating a shared branch → merge.
- Cleaning your PR before review → interactive rebase, force-with-lease.
- Undoing something on `main` → `git revert`, never reset + force.
- Integrating into `main` → whatever the team chose (merge commits, squash or rebase merges in pull requests).

## Commands

| Command | Rewrites? | Safety |
|---------|-----------|--------|
| `git commit --amend` | Last commit | **Practice repository first** once pushed |
| `git rebase`, `git rebase -i` | Branch commits | **Practice repository first** |
| `git reset <commit>` + new commits | Branch commits | **Practice repository first** |
| `git push --force-with-lease` | Remote branch | **Changes the remote** |
| `git push --force` | Remote branch, unconditionally | **Changes the remote** — avoid |
| `git revert` | Nothing — adds a commit | Changes local state; safe on shared branches |

## Common Mistakes

- **Following the "use git pull" hint after an intentional rewrite.** It merges old and new copies.
- **`--force` out of habit.** Use `--force-with-lease`; better, protect important branches on the server so force pushes are blocked.
- **Rewriting `main`** to "clean up" — breaks everyone's clones, CI references and links.
- **Thinking a force-push deletes the old commits everywhere.** Clones, forks and caches keep them.

## Interview Angle

"When is it OK to rewrite Git history?" — when the commits are only yours; once others may have them, add commits instead (`revert`). "`--force` vs `--force-with-lease`?" — lease refuses if the remote moved since your last fetch, protecting teammates' work.

## Recap

- Amend, rebase, reset and filtering create replacement commits.
- Rewrite freely locally; on your own pushed branch, publish with `--force-with-lease`.
- Never rewrite `main` or shared branches without team agreement — revert instead.
- After someone force-pushes, reset or rebase onto the new remote branch.

## Related Topics

- [git rebase](../git-rebase/content.md)
- [git revert](../../undoing-and-recovery/git-revert/content.md)
- [Push Rejection, Divergence and Force-with-Lease](../../remote-repositories/push-rejection-and-divergence/content.md)
