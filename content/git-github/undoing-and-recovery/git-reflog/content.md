# git reflog: Recovering Lost Commits and Branches

**Module:** Undoing Changes and Recovering Work · **Interview priority:** Core

## Learning Objectives

- Read the reflog and explain what it records and for how long.
- Recover commits after a bad `reset`, a rebase, a deleted branch or a detached-HEAD experiment.
- Know what the reflog **cannot** recover.

## What Is It?

The **reflog** (reference log) is Git's local diary of every position `HEAD` and each branch have pointed to: every commit, checkout, reset, merge, rebase and pull, with the old and new commit ids. `git reflog` shows `HEAD`'s diary; `git reflog show <branch>` shows a branch's.

## Why It Matters

Almost nothing you **committed** is ever truly lost in Git — even after `reset --hard`, a rebase or `branch -D`, the commits still exist in the object database, and the reflog tells you their ids. Knowing this turns "I destroyed my work" into a two-minute recovery.

> [!IMPORTANT]
> The reflog is **local**: it's not pushed, cloned or shared, and a fresh clone starts with an empty one. Entries expire — by default after 90 days for commits still reachable and **30 days for unreachable ones** — and garbage collection then deletes unreachable commits. Recover promptly.

## How It Works

Each line: commit id, a reference to that entry (`HEAD@{n}` = n moves ago), and what happened.

After an accidental `git reset --hard HEAD~2` on gradebook:

```bash
git reflog -5
```

**Output:**

```text
d0e8c67 HEAD@{0}: reset: moving to HEAD~2
3a070e0 HEAD@{1}: commit: Raise the B threshold to 78
10b9974 HEAD@{2}: merge feature/class-report: Merge made by the 'ort' strategy.
d0e8c67 HEAD@{3}: checkout: moving from feature/class-report to main
8b503ca HEAD@{4}: commit: Show each student's average in ClassReport
```

Read from the top: the reset (most recent) moved `HEAD` from `3a070e0` to `d0e8c67`. So the lost tip is `HEAD@{1}`:

```bash
git reset --hard HEAD@{1}
```

**Output:**

```text
HEAD is now at 3a070e0 Raise the B threshold to 78
```

(Make sure `git status` is clean before using `--hard` for the recovery itself.)

## Recovering a Deleted Branch

```bash
git branch -D spike/csv-export
```

**Output:**

```text
Deleted branch spike/csv-export (was a8cdcbf).
```

The commit `a8cdcbf` was on no other branch. Find it:

```bash
git reflog -3
```

**Output:**

```text
3a070e0 HEAD@{0}: checkout: moving from spike/csv-export to main
a8cdcbf HEAD@{1}: commit: Sketch CSV export
3a070e0 HEAD@{2}: checkout: moving from main to spike/csv-export
```

```bash
git branch spike/csv-export a8cdcbf
```

The branch is back with all its commits. When the reflog doesn't help (for example the commits came from a fetch and you never checked them out), `git fsck` lists unreachable commits:

```bash
git fsck --unreachable --no-reflogs | grep commit
```

**Output:**

```text
unreachable commit a8cdcbf33c4cda79c73de38029cda459a14b13e3
```

## Other Recoveries

| Situation | Find the commit | Restore with |
|-----------|-----------------|--------------|
| Bad `reset --hard` | entry before `reset: moving to …` | `git reset --hard <hash>` |
| Regretted rebase | entry before `rebase (start)`, or `ORIG_HEAD` | `git reset --hard <hash>` |
| Commits made in detached HEAD | `commit:` entries after `checkout: moving from … to <hash>` | `git branch <name> <hash>` |
| Amended away the original commit | `commit (amend):` and the entry before it | `git branch old-version <hash>` |
| Deleted branch | last `commit:` / `checkout: moving from <branch>` entry | `git branch <name> <hash>` |
| Branch moved by a bad pull | `git reflog show <branch>` | `git reset --hard <branch>@{1}` |

Time-based references also work: `git log -1 main@{"2 hours ago"}`, `git diff main@{yesterday} main`.

## What the Reflog Cannot Recover

- **Uncommitted changes** destroyed by `reset --hard`, `restore`, `checkout -- <file>` or `clean`. They never became commits.
- **Commits that only existed in another clone** — each clone has its own reflog.
- **Commits already garbage-collected** after the reflog entry expired.

Staged-but-never-committed content may survive as **dangling blobs**: `git fsck --lost-found` writes them to `.git/lost-found/other/` — without file names, so you must recognise them by content.

## Commands

### git reflog

**Syntax:** `git reflog [show <ref>] [-n]`, `git reflog --date=iso` · **Safety:** safe anywhere.

### git fsck

**Syntax:** `git fsck --unreachable --no-reflogs`, `git fsck --lost-found` · **Safety:** safe anywhere (`--lost-found` only writes copies into `.git/lost-found`).

## Step-by-Step Example

"I rebased and now my two commits are gone."

1. Stop and don't run more history-changing commands.
2. `git reflog -15` — find `rebase (start)`; the entry just before it is your old tip.
3. `git log --oneline -3 <that-hash>` — confirm the commits are there.
4. `git branch rescue/before-rebase <that-hash>` — a branch makes it safe from garbage collection.
5. Then decide: reset your branch to it, or cherry-pick what you need.

## Common Mistakes

- **Panicking and re-cloning.** A fresh clone has no reflog and none of your unpushed commits.
- **Recovering with `reset --hard` while having new uncommitted work** — check `git status` first, or recover into a new branch instead.
- **Waiting weeks.** Expiry and `git gc` eventually remove unreachable commits.
- **Thinking the reflog shows other people's actions.** It only records this clone.

## Interview Angle

"You ran `git reset --hard` by mistake — how do you recover?" — `git reflog`, find the entry before the reset, `git reset --hard <hash>` (or `HEAD@{1}`). "What is the reflog?" — a local log of ref movements, with expiry; differentiate from `git log` (commit ancestry). Mention its limit: uncommitted work isn't in it.

## Recap

- The reflog records every move of `HEAD` and branches in this clone.
- Lost commits: find the hash in the reflog, then `branch` or `reset --hard` to it.
- `git fsck --unreachable` finds commits the reflog doesn't list.
- Uncommitted changes and other clones' commits are out of reach; recover before expiry.

## Related Topics

- [git reset](../git-reset/content.md)
- [Detached HEAD](../../rebasing-and-rewriting/detached-head/content.md)
- [Safe Recovery Workflows](../safe-recovery-workflows/content.md)
- [Lab 07 — Recover a Commit with the Reflog](../../labs/git-lab-07-reflog-recovery/content.md)
