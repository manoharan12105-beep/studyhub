# git push and Upstream Tracking

**Module:** Remote Repositories · **Interview priority:** Core

## Learning Objectives

- Push a branch for the first time and set its upstream with `-u`.
- Read `git branch -vv` and ahead/behind information.
- Delete remote branches, prune stale tracking branches and push tags.

## What Is It?

`git push` uploads your commits to a remote and **moves the remote's branch** to your branch's commit. By default it only does that if the move is a **fast-forward** — the remote branch's current commit must be an ancestor of yours — so nobody's commits are lost.

An **upstream** (tracking) branch is the remote branch your local branch is linked to, such as `main` ↔ `origin/main`. It's what `git pull`, `git push` and `git status` use when you don't name a branch.

## Why It Matters

Pushing is the moment your work becomes visible to others and, often, triggers CI and deployments. It's also the operation that changes **shared** state, so knowing what it changes — and what it refuses to change — matters.

| Command | Changes locally | Changes on the remote |
|---------|-----------------|----------------------|
| `git push` | `origin/<branch>` is updated | The branch moves to your commit (fast-forward only) |
| `git push -u origin <branch>` | Also records the upstream in `.git/config` | Creates the branch if new |
| `git push origin --delete <branch>` | Removes `origin/<branch>` | Deletes the branch |
| `git push --force-with-lease` | `origin/<branch>` | Replaces the branch, if unchanged since your last fetch |

## How It Works

### First push of a new branch

```bash
git switch -c feature/class-report
# … commit …
git push
```

**Output:**

```text
fatal: The current branch feature/class-report has no upstream branch.
To push the current branch and set the remote as upstream, use

    git push --set-upstream origin feature/class-report

To have this happen automatically for branches without a tracking
upstream, see 'push.autoSetupRemote' in 'git help config'.

```

```bash
git push -u origin feature/class-report
```

**Output:**

```text
branch 'feature/class-report' set up to track 'origin/feature/class-report'.
To /home/student/git-lab/remotes/gradebook.git
 * [new branch]      feature/class-report -> feature/class-report
```

From now on, plain `git push` and `git pull` on this branch know where to go. `git config --global push.autoSetupRemote true` makes the first plain `git push` do this automatically.

### Reading tracking information

```bash
git branch -vv
```

**Output:**

```text
* feature/class-report 27e2ad6 [origin/feature/class-report] Add ClassReport skeleton
  main                 d9b72cf [origin/main] Raise the B threshold to 78
```

In Arjun's clone, where `main` hadn't been updated:

**Output:**

```text
* feature/class-report 27e2ad6 [origin/feature/class-report] Add ClassReport skeleton
  main                 c080e23 [origin/main: behind 1] Explain how to run the tests
```

`[origin/main: ahead 2]`, `[behind 1]`, `[ahead 1, behind 1]` and `[gone]` (the remote branch was deleted) are the states you'll see. They compare with your **local** `origin/*` refs — fetch first for current numbers.

### Getting a teammate's branch

After `git fetch`, Arjun runs `git switch feature/class-report`. Because only `origin/feature/class-report` exists, Git creates a local branch tracking it:

**Output:**

```text
branch 'feature/class-report' set up to track 'origin/feature/class-report'.
Switched to a new branch 'feature/class-report'
```

### A normal push

**Output (`git push` after integrating remote changes):**

```text
To /home/student/git-lab/remotes/gradebook.git
   c080e23..d9b72cf  main -> main
```

`old..new` means a fast-forward from `c080e23` to `d9b72cf`.

## Deleting Remote Branches

After the pull request is merged:

```bash
git push origin --delete feature/class-report
```

**Output:**

```text
To /home/student/git-lab/remotes/gradebook.git
 - [deleted]         feature/class-report
```

Teammates still have `origin/feature/class-report` until they prune:

```bash
git fetch --prune
```

**Output:**

```text
From /home/student/git-lab/remotes/gradebook
 - [deleted]         (none)     -> origin/feature/class-report
```

**Output (`git branch -vv` in Arjun's clone):**

```text
  feature/class-report 85c5a3f [origin/feature/class-report: gone] Comment ClassReport
* main                 cee1bbd [origin/main] Document ClassReport
```

His local branch survives (`gone` marks the missing upstream); delete it with `git branch -d` once its work is merged. `git config --global fetch.prune true` prunes on every fetch.

> [!CAUTION]
> `git push origin --delete <branch>` changes the shared repository. Deleting someone else's unmerged branch removes it for everyone (GitHub can restore a branch deleted from a pull request page for a while, but don't rely on it).

## Pushing Tags

Tags are **not** pushed by a plain `git push`:

```bash
git push origin v1.0.0          # one tag
git push origin --tags          # all local tags (careful: includes experiments)
git push --follow-tags          # annotated tags reachable from pushed commits
git push origin --delete v1.0.0 # delete a remote tag
```

Details in [Lightweight and Annotated Tags](../../tags-and-releases/git-tags/content.md).

## Commands

### git push

**Syntax:** `git push [-u] [<remote> [<branch>]]`, `git push <remote> --delete <branch>`, `git push --tags` · **Safety:** **Changes the remote**; fast-forward-only by default.

| Option | Effect |
|--------|--------|
| `-u` / `--set-upstream` | Record the upstream for the branch |
| `--delete` | Delete a remote branch or tag |
| `--tags`, `--follow-tags` | Push tags |
| `--force-with-lease` | Replace a remote branch safely — see [Push Rejection and Divergence](../push-rejection-and-divergence/content.md) |
| `--dry-run` (`-n`) | Show what would be pushed |

### git branch -vv / --set-upstream-to

**Syntax:** `git branch -vv`, `git branch --set-upstream-to=origin/<branch>` · **Safety:** safe / local configuration only.

## Step-by-Step Example

1. `git switch -c fix/rounding`, commit.
2. `git push -u origin fix/rounding` — create the remote branch, set upstream.
3. Open a pull request on GitHub.
4. More commits → plain `git push`.
5. After merging: `git push origin --delete fix/rounding` (GitHub's "Delete branch" button does the same), then `git switch main && git pull && git branch -d fix/rounding`.

## Common Mistakes

- **Expecting `git push` to push all branches.** It pushes the current branch (with the default `push.default=simple`).
- **Wrong upstream** (e.g. `feature/x` tracking `origin/main`) — `git push` then targets the wrong branch or is refused. Check `git branch -vv`; fix with `git branch --set-upstream-to=origin/feature/x`.
- **Forgetting to push tags.**
- **Stale `origin/*` branches** cluttering `git branch -a` — prune.

## Interview Angle

"What does `git push -u` do?" — pushes and sets the upstream so future push/pull need no arguments. "How do you delete a remote branch?" — `git push origin --delete <branch>`; others run `git fetch --prune`. "What is upstream?" — the remote branch a local branch tracks.

## Recap

- `git push` moves the remote branch to your commit, fast-forward only by default.
- `-u` sets the upstream; `git branch -vv` shows upstream and ahead/behind.
- Delete remote branches with `--delete`; others prune with `fetch --prune`.
- Tags need an explicit push.

## Related Topics

- [Push Rejection, Divergence and Force-with-Lease](../push-rejection-and-divergence/content.md)
- [Pull Requests](../../pull-requests-and-review/pull-requests-fundamentals/content.md)
- [Lab 02 — Add a Remote and Push](../../labs/git-lab-02-push-to-remote/content.md)
