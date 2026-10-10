# Detached HEAD

**Module:** Rebasing and History Rewriting · **Interview priority:** Core

## Learning Objectives

- Explain what "detached HEAD" means and the common ways to get there.
- Work safely in detached HEAD: look around, experiment, and keep or discard commits.
- Rescue commits made while detached.

## What Is It?

Normally `HEAD` points at a **branch**, which points at a commit. In **detached HEAD** state, `HEAD` points **directly at a commit**, with no branch in between.

```text
attached:   HEAD → main → 3a070e0
detached:   HEAD → 4b17431            (no branch involved)
```

You get there by checking out something that isn't a local branch: a commit hash, a tag (`git switch --detach v1.0.0`), a remote-tracking branch (`git checkout origin/main`), and temporarily during rebases and `git bisect`.

## Why It Matters

Detached HEAD is **not an error** — it's useful for inspecting old versions. The risk is committing while detached and then switching away: those commits aren't on any branch, so they become hard to find and are eventually garbage-collected.

## How It Works

```bash
git checkout 4b17431
```

**Output:**

```text
Note: switching to '4b17431'.

You are in 'detached HEAD' state. You can look around, make experimental
changes and commit them, and you can discard any commits you make in this
state without impacting any branches by switching back to a branch.

If you want to create a new branch to retain commits you create, you may
do so (now or later) by using -c with the switch command. Example:

  git switch -c <new-branch-name>

Or undo this operation with:

  git switch -

Turn off this advice by setting config variable advice.detachedHead to false

HEAD is now at 4b17431 Document the grading scale in README
```

```bash
git status
cat .git/HEAD
git branch
```

**Output:**

```text
HEAD detached at 4b17431
nothing to commit, working tree clean
4b17431839600a5d1f32a771d395b173cd9377eb
* (HEAD detached at 4b17431)
  feature/class-report
  main
```

`.git/HEAD` holds a hash instead of `ref: refs/heads/main`.

## Committing While Detached

Commits work normally — `HEAD` moves to each new commit:

**Output (`git commit -am "Try a shorter README"`):**

```text
[detached HEAD 332c03d] Try a shorter README
 1 file changed, 1 insertion(+)
```

Switching away warns you:

**Output (`git switch main`):**

```text
Warning: you are leaving 1 commit behind, not connected to
any of your branches:

  332c03d Try a shorter README

If you want to keep it by creating a new branch, this may be a good time
to do so with:

 git branch <new-branch-name> 332c03d

Switched to branch 'main'
```

## Keeping the Work

**Before leaving:** `git switch -c experiment/short-readme` — creates a branch at the current commit and attaches HEAD to it.

**After leaving:** create a branch at the printed hash:

```bash
git branch experiment/short-readme 332c03d
git log --oneline -2 experiment/short-readme
```

**Output:**

```text
332c03d Try a shorter README
4b17431 Document the grading scale in README
```

Lost the hash? It's in the reflog:

**Output (`git reflog -4`):**

```text
3a070e0 HEAD@{0}: checkout: moving from 332c03d8042ad5c016e016b4f2dd542369ade2af to main
332c03d HEAD@{1}: commit: Try a shorter README
4b17431 HEAD@{2}: checkout: moving from main to 4b17431
3a070e0 HEAD@{3}: commit: Raise the B threshold to 78
```

## Discarding the Work

If the experiment was throwaway, just switch to a branch. The commits become unreachable and are pruned by garbage collection later (by default unreachable reflog entries expire after 30 days).

## Detached HEAD You Didn't Ask For

| Situation | What to do |
|-----------|------------|
| Rebase stopped on a conflict (`interactive rebase in progress`) | Normal — finish with `--continue` or `--abort`; don't create branches here |
| `git bisect` in progress | Normal — finish with `git bisect reset` |
| Submodule checked out at a commit | Normal for submodules — see [Submodules](../../specialized-workflows/git-submodules/content.md) |
| You ran `git checkout origin/main` | You looked at the remote-tracking branch; switch to `main` and merge/pull instead |
| CI checkouts | CI often checks out a commit detached; that's expected |

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git switch --detach <commit>` | Detach on purpose | Changes local state |
| `git switch -c <new>` | Turn the current detached position into a branch | Changes local state |
| `git branch <new> <hash>` | Create a branch at a stranded commit | Changes local state |
| `git switch -` / `git switch main` | Return to a branch | Changes local state |
| `git reflog` | Find commits made while detached | Safe anywhere |

## Step-by-Step Example

Check whether the release `v1.0.0` already had the rounding bug:

1. `git switch --detach v1.0.0`
2. Build and run the scenario.
3. Need a fix on top of it? `git switch -c hotfix/1.0.1` now, then commit.
4. Otherwise `git switch main`.

## Common Mistakes

- **Panicking at the message.** It's informational.
- **Committing a real fix while detached and switching away** — create a branch first.
- **Creating a branch in the middle of a rebase** to "fix" the detached state — it isn't broken; finish or abort the rebase.

## Interview Angle

"What is detached HEAD and how do you get out of it?" — HEAD points at a commit instead of a branch; switch back to a branch (`git switch main`), and if you made commits you want, create a branch at them first (`git switch -c new` or `git branch new <hash>`; the reflog finds lost hashes).

## Recap

- Detached HEAD = `HEAD` holds a commit hash, not a branch name.
- Caused by checking out commits, tags or remote-tracking branches, and during rebase/bisect.
- Commits made while detached must be given a branch, or they're eventually lost.
- The reflog remembers where HEAD has been.

## Related Topics

- [HEAD and Relative References](../../history-and-inspection/head-and-relative-references/content.md)
- [git reflog](../../undoing-and-recovery/git-reflog/content.md)
- [Troubleshooting Commits and Branches](../../troubleshooting/troubleshooting-commits-and-branches/content.md)
