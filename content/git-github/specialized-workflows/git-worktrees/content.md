# Git Worktrees: Several Branches Checked Out at Once

**Module:** Submodules, Worktrees and Specialized Workflows · **Interview priority:** Awareness

## Learning Objectives

- Create additional working directories for other branches with `git worktree add`.
- List, remove and prune worktrees, and understand the one-branch-one-worktree rule.
- Decide when a worktree beats stashing or a second clone.

## What Is It?

A **worktree** is an additional working directory attached to the **same repository**. Each worktree has its own checked-out branch, index and working files, but they share one object database, one set of branches and one configuration. The original folder is the **main worktree**; others are **linked worktrees**.

## Why It Matters

Context switches are expensive: stashing half-done work, switching branches, rebuilding, switching back. With worktrees you can fix an urgent bug in `../gradebook-hotfix` while your feature branch stays exactly as it is in `gradebook/` — no stash, no rebuild, and no second full clone. It's also how tools run several tasks in parallel on one repository (Claude Code uses worktrees for parallel sessions — see [Checkpoints, Recovery and Worktrees](../../../claude-code-mastery/context-and-sessions/checkpoints-recovery-and-worktrees/content.md)).

## How It Works

```text
~/git-lab/gradebook/            main worktree        [main]        uncommitted README edit stays here
~/git-lab/gradebook-hotfix/     linked worktree      [hotfix/1.0.1]
        └── .git  (a file: "gitdir: …/gradebook/.git/worktrees/gradebook-hotfix")
shared: objects, refs, config in ~/git-lab/gradebook/.git
```

### Adding a worktree with a new branch

Priya has an uncommitted change on `main` and needs to hotfix the release at `4b17431`:

```bash
git worktree add -b hotfix/1.0.1 ../gradebook-hotfix 4b17431
git worktree list
```

**Output:**

```text
Preparing worktree (new branch 'hotfix/1.0.1')
HEAD is now at 4b17431 Document the grading scale in README
/home/student/git-lab/gradebook         3a070e0 [main]
/home/student/git-lab/gradebook-hotfix  4b17431 [hotfix/1.0.1]
```

Inside `../gradebook-hotfix`, `git status -sb` shows `## hotfix/1.0.1`, and its `.git` is a small file pointing back to the main repository:

```text
gitdir: /home/student/git-lab/gradebook/.git/worktrees/gradebook-hotfix
```

Back in `gradebook/`, `git status -s` still shows ` M README.md` — untouched.

### Existing branches and the one-branch rule

```bash
git worktree add ../gradebook-report feature/class-report
```

**Output:**

```text
Preparing worktree (checking out 'feature/class-report')
HEAD is now at 8b503ca Show each student's average in ClassReport
```

A branch can be checked out in **only one** worktree at a time:

**Output (`git worktree add ../gb2 main`):**

```text
Preparing worktree (checking out 'main')
fatal: 'main' is already used by worktree at '/home/student/git-lab/gradebook'
```

This protects you from two working directories moving the same branch. To look at the same commit twice, add a worktree in detached mode: `git worktree add --detach ../gb-look main`.

### Removing and pruning

```bash
git worktree remove ../gradebook-report
```

Git refuses if the worktree has changes:

**Output:**

```text
fatal: '../gradebook-report' contains modified or untracked files, use --force to delete it
```

If a worktree folder was deleted by hand, Git marks it prunable:

**Output (`git worktree list`, then `git worktree prune -v`):**

```text
/home/student/git-lab/gradebook         3a070e0 [main]
/home/student/git-lab/gradebook-hotfix  4b17431 [hotfix/1.0.1] prunable
Removing worktrees/gradebook-hotfix: gitdir file points to non-existent location
```

The **branch** `hotfix/1.0.1` still exists after removing or pruning its worktree; delete it separately if unneeded.

## Worktree vs Stash vs Second Clone

| | Stash + switch | Worktree | Second clone |
|-|---------------|----------|--------------|
| Keeps current files untouched | No (stashed) | Yes | Yes |
| Disk usage | None extra | Working files only | Full repository again |
| Shares branches/commits instantly | — | Yes | Only via push/fetch |
| Same branch in two places | — | Not allowed | Possible (risky) |
| Rebuild needed when returning | Often | No | No |

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git worktree add [-b <new>] <path> [<commit-ish>]` | New linked worktree | Changes local state (new folder) |
| `git worktree list` | All worktrees and their branches | Safe anywhere |
| `git worktree remove [--force] <path>` | Remove one | `--force` discards its uncommitted changes — **Practice repository first** |
| `git worktree prune` | Clean up records of deleted folders | Changes local state |

## Step-by-Step Example

Review Arjun's branch while keeping your work open:

1. `git fetch`.
2. `git worktree add --detach ../gradebook-review origin/feature/class-report`.
3. `cd ../gradebook-review && mvn -B verify`.
4. `cd ../gradebook && git worktree remove ../gradebook-review`.

## Common Mistakes

- **Deleting worktree folders with `rm -rf`** and leaving stale records — use `git worktree remove` (or `prune` afterwards).
- **Expecting a branch to be checkable in two worktrees.**
- **Forgetting that branches are shared** — deleting `hotfix/1.0.1` in one worktree affects all.
- **Putting worktrees inside the main working tree** — they show up as untracked folders; put them next to it.

## Interview Angle

"How do you work on two branches at the same time?" — `git worktree add` creates a separate working directory sharing the same repository; no stashing, no second clone; one branch per worktree. A crisp answer shows depth beyond everyday commands.

## Recap

- Worktrees = several working directories, one repository.
- `git worktree add [-b new] <path> [<start>]`, `list`, `remove`, `prune`.
- A branch can be checked out in only one worktree; use `--detach` to look at the same commit twice.
- Ideal for hotfixes, reviews and parallel tasks without disturbing current work.

## Related Topics

- [git stash](../../undoing-and-recovery/git-stash/content.md)
- [Coordinating a Team](../../team-workflows/team-coordination-practices/content.md)
- [Git Submodules](../git-submodules/content.md)
