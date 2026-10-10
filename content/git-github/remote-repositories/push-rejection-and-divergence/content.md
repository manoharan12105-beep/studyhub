# Push Rejection, Divergence and Force-with-Lease

**Module:** Remote Repositories · **Interview priority:** Core

## Learning Objectives

- Read the two kinds of push rejection and choose the right response.
- Synchronise diverged local and remote branches without losing anyone's work.
- Explain exactly how `--force-with-lease` protects a teammate's commits, and its limits.

## What Is It?

A push is **rejected** when updating the remote branch would not be a **fast-forward** — when the remote has commits that your branch doesn't contain. Accepting it would throw those commits away, so Git refuses unless you explicitly force.

Two situations produce it:

| Message | Situation | Usual fix |
|---------|-----------|-----------|
| `! [rejected] main -> main (fetch first)` | Someone pushed new commits you haven't fetched | Fetch, integrate (rebase or merge), push |
| `! [rejected] … (non-fast-forward)` | Your branch is behind or diverged from what you already fetched — often after you rewrote history (amend, rebase) | Integrate — or, if you deliberately rewrote **your own** branch, `--force-with-lease` |

## Why It Matters

Push rejection is Git protecting your teammates. The wrong reflex — `git push --force` — silently deletes their work from the shared branch. The right reflex is: fetch, look, integrate, push.

## How It Works

### Someone pushed first

Priya committed "Raise the B threshold to 78"; meanwhile Arjun pushed "Explain how to run the tests":

```bash
git push
```

**Output:**

```text
To /home/student/git-lab/remotes/gradebook.git
 ! [rejected]        main -> main (fetch first)
error: failed to push some refs to '/home/student/git-lab/remotes/gradebook.git'
hint: Updates were rejected because the remote contains work that you do not
hint: have locally. This is usually caused by another repository pushing to
hint: the same ref. If you want to integrate the remote changes, use
hint: 'git pull' before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
```

```bash
git fetch
git status -sb
```

**Output:**

```text
From /home/student/git-lab/remotes/gradebook
   a73641f..c080e23  main       -> origin/main
## main...origin/main [ahead 1, behind 1]
```

Diverged: one commit each. Look before integrating:

```bash
git log --oneline --graph main origin/main -4
git diff main...origin/main --stat
```

Then integrate and push:

```bash
git pull --rebase       # or: git pull --no-rebase
git push
```

**Output (push):**

```text
To /home/student/git-lab/remotes/gradebook.git
   c080e23..d9b72cf  main -> main
```

If the rebase or merge conflicts, resolve it as usual ([Merge Conflicts](../../branching-and-merging/merge-conflicts/content.md)), then push.

### You rewrote your own branch

After amending or rebasing a branch you had pushed, the remote has your **old** commits, and the push is refused with `(non-fast-forward)` — see the captured example in [Rewriting History Safely](../../rebasing-and-rewriting/rewriting-history-safely/content.md). Here pulling is wrong (it merges the old commits back). If the branch is yours alone, replace it with `--force-with-lease`.

## --force vs --force-with-lease

Priya amended her `feature/class-report` commit. Unknown to her, Arjun had pushed "Comment ClassReport" to that branch in the meantime. Priya hasn't fetched.

```bash
git push --force-with-lease
```

**Output:**

```text
To /home/student/git-lab/remotes/gradebook.git
 ! [rejected]        feature/class-report -> feature/class-report (stale info)
error: failed to push some refs to '/home/student/git-lab/remotes/gradebook.git'
```

The **lease** check: "the remote branch must still be at the commit my `origin/feature/class-report` records". It isn't — Arjun moved it — so the push is refused and Arjun's commit is safe. Priya fetches and sees why:

**Output (`git fetch` then `git status -sb`):**

```text
## feature/class-report...origin/feature/class-report [ahead 1, behind 2]
```

Now compare with a plain `--force` in the same situation (run against a copy of the remote):

```bash
git push --force
```

**Output:**

```text
To /home/student/git-lab/remotes/gradebook.git
 + 85c5a3f...a0c8039 feature/class-report -> feature/class-report (forced update)
```

**Output (`git log --oneline origin/feature/class-report -3`):**

```text
a0c8039 Add an empty ClassReport
d9b72cf Raise the B threshold to 78
c080e23 Explain how to run the tests
```

Arjun's "Comment ClassReport" (`85c5a3f`) is no longer on the branch. Nobody was warned.

> [!CAUTION]
> `git push --force` overwrites the remote branch unconditionally and can erase teammates' commits. Use `--force-with-lease` — and only on branches you own. Protect `main` and release branches on GitHub so force pushes are blocked entirely ([Branch Protection](../../team-workflows/branch-protection-and-code-ownership/content.md)).

### The lease's blind spot

The lease compares with your **local** `origin/<branch>`. If you (or your IDE, automatically) **fetch** after Arjun's push, your `origin/…` now includes his commit, the lease matches, and `--force-with-lease` would overwrite his work even though you never looked at it. Safer options:

- Name the commit you expect to replace: `git push --force-with-lease=feature/class-report:27e2ad6`.
- Add `--force-if-includes` (Git 2.30+), which also requires that the remote tip is included in your branch's reflog history — i.e. you actually integrated it.

## Synchronising Safely: a Checklist

1. `git status` and `git stash list` — no uncommitted work at risk.
2. `git fetch` — current `origin/*`.
3. `git log --oneline --graph --all -15` — what diverged, and who wrote it.
4. Integrate: `git rebase origin/<branch>` (your unpushed commits) or `git merge origin/<branch>` (shared branch).
5. Build and test.
6. `git push` — or `git push --force-with-lease` only for an intentional rewrite of your own branch.

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git fetch` | Update `origin/*` | Safe anywhere |
| `git status -sb`, `git branch -vv` | Ahead/behind | Safe anywhere |
| `git pull --rebase` / `--no-rebase` | Integrate | Changes local state |
| `git push --force-with-lease[=<ref>:<expect>]` | Replace a remote branch if unchanged | **Changes the remote** |
| `git push --force` | Replace unconditionally | **Changes the remote** — avoid |

## Common Mistakes

- **Answering every rejection with `--force`.**
- **Pulling after an intentional rewrite** — duplicates commits.
- **Force-pushing `main`.**
- **Assuming `--force-with-lease` is always safe** after a background fetch.

## Interview Angle

"Your push was rejected — what do you do?" — read the reason, fetch, inspect, rebase or merge, test, push; never force a shared branch. "`--force` vs `--force-with-lease`?" — lease refuses if the remote moved since your last fetch; mention the fetch blind spot and `--force-if-includes` to stand out.

## Recap

- Rejection = the push wouldn't be a fast-forward; Git protects others' commits.
- "fetch first" → fetch, integrate, push.
- Intentional rewrite of your own branch → `--force-with-lease`.
- `--force` can erase teammates' work; protect important branches on the server.

## Related Topics

- [git fetch and git pull](../git-fetch-and-pull/content.md)
- [Rewriting History Safely](../../rebasing-and-rewriting/rewriting-history-safely/content.md)
- [Troubleshooting Remotes and Pushes](../../troubleshooting/troubleshooting-remotes-and-push/content.md)
