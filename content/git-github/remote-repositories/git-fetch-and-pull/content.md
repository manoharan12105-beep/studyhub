# git fetch and git pull

**Module:** Remote Repositories · **Interview priority:** Core

## Learning Objectives

- State exactly what `git fetch` and `git pull` change locally.
- Integrate remote work by merging or rebasing, and configure a default for `git pull`.
- Handle the "divergent branches" message deliberately.

## What Is It?

- **`git fetch`** downloads new commits, branches and tags from a remote and updates your **remote-tracking branches** (`origin/main`). It never changes your local branches or your working directory.
- **`git pull`** = `git fetch` **plus** integrating the upstream branch into your current branch — by **merge** (`--no-rebase`), **rebase** (`--rebase`) or **fast-forward only** (`--ff-only`).

| | Changes `origin/*` | Changes your branch | Changes working files | Can conflict |
|-|-------------------|---------------------|-----------------------|--------------|
| `git fetch` | Yes | No | No | No |
| `git pull` | Yes | Yes | Yes | Yes |

## Why It Matters

"Fetch vs pull" is a top interview question because it reveals whether you understand remote-tracking branches. Practically, fetching first lets you **look before you integrate**: see what teammates changed, then choose how to combine it.

## How It Works

### Fetch: look first

Arjun pushed "Add Student record". In Priya's clone:

```bash
git status -sb          # before: "## main...origin/main" — Git doesn't know yet
git fetch
```

**Output:**

```text
From /home/student/git-lab/remotes/gradebook
   c378147..a73641f  main       -> origin/main
```

`origin/main` moved from `c378147` to `a73641f`. Priya's `main` didn't:

**Output (`git status`, first lines):**

```text
On branch main
Your branch is behind 'origin/main' by 1 commit, and can be fast-forwarded.
  (use "git pull" to update your local branch)
```

What's new? `git log --oneline main..origin/main` (prints `a73641f Add Student record`), and `git diff main...origin/main` for the changes.

### Pull: integrate

```bash
git pull
```

**Output:**

```text
Updating c378147..a73641f
Fast-forward
 src/main/java/com/example/gradebook/Student.java | 4 ++++
 1 file changed, 4 insertions(+)
 create mode 100644 src/main/java/com/example/gradebook/Student.java
```

Priya had no local commits, so `main` fast-forwarded.

## When Both Sides Have Commits

Later, Priya commits "Raise the B threshold to 78" while Arjun pushes "Explain how to run the tests". After `git fetch`:

**Output (`git status`, lines 2–4):**

```text
Your branch and 'origin/main' have diverged,
and have 1 and 1 different commits each, respectively.
  (use "git pull" if you want to integrate the remote branch with yours)
```

With no preference configured, `git pull` refuses to guess:

**Output:**

```text
hint: You have divergent branches and need to specify how to reconcile them.
hint: You can do so by running one of the following commands sometime before
hint: your next pull:
hint:
hint:   git config pull.rebase false  # merge
hint:   git config pull.rebase true   # rebase
hint:   git config pull.ff only       # fast-forward only
hint:
hint: You can replace "git config" with "git config --global" to set a default
hint: preference for all repositories. You can also pass --rebase, --no-rebase,
hint: or --ff-only on the command line to override the configured default per
hint: invocation.
fatal: Need to specify how to reconcile divergent branches.
```

Nothing changed. Choose:

**Rebase** — replay your local commit on top of the remote's:

```bash
git pull --rebase
```

**Output (final line, then `git log --oneline --graph -4`):**

```text
Successfully rebased and updated refs/heads/main.
* d9b72cf Raise the B threshold to 78
* c080e23 Explain how to run the tests
* a73641f Add Student record
* c378147 Create gradebook project
```

**Merge** — keep both lines and join them:

```bash
git pull --no-rebase
```

**Output (from a later, similar divergence):**

```text
From /home/student/git-lab/remotes/gradebook
   d9b72cf..cee1bbd  main       -> origin/main
Merge made by the 'ort' strategy.
 README.md | 1 +
 1 file changed, 1 insertion(+)
```

```text
*   0ec3829 Merge branch 'main' of /home/student/git-lab/remotes/gradebook
|\  
| * cee1bbd Document ClassReport
* | 6fdbeb1 Add release notes file
|/  
* d9b72cf Raise the B threshold to 78
```

**Fast-forward only** refuses whenever a merge or rebase would be needed:

**Output (`git pull --ff-only` on diverged branches):**

```text
hint: Diverging branches can't be fast-forwarded, you need to either:
hint:
hint: 	git merge --no-ff
hint:
hint: or:
hint:
hint: 	git rebase
hint:
hint: Disable this message with "git config set advice.diverging false"
fatal: Not possible to fast-forward, aborting.
```

## Pull vs Pull --rebase

| | `git pull` (merge) | `git pull --rebase` |
|-|--------------------|---------------------|
| Your unpushed commits | Kept; a merge commit joins them with the remote's | Rewritten on top of the remote's |
| History | "Merge branch 'main' of …" commits appear on `main` | Linear |
| Safe when your commits are unpushed | Yes | Yes |
| If your local commits were already pushed elsewhere | Fine | Rewrites them — avoid |

Many teams set `git config --global pull.rebase true` so routine pulls on `main` don't create noise merges; others prefer `pull.ff only` and integrate explicitly. Pick one and set it, so `git pull` is never ambiguous.

## Commands

### git fetch

**Syntax:** `git fetch [<remote>] [--all] [--prune] [--tags]` · **Safety:** safe anywhere — only updates remote-tracking refs.

### git pull

**Syntax:** `git pull [--rebase | --no-rebase | --ff-only] [<remote> <branch>]` · **Safety:** changes local state; can conflict. Start with a clean working tree (or `--autostash`).

## Step-by-Step Example — Start of the Day

1. `git switch main && git status` — clean?
2. `git fetch` — update `origin/*`.
3. `git log --oneline main..origin/main` — read what arrived.
4. `git pull --ff-only` (or `--rebase` if you have local commits).
5. Update your feature branch from `main` ([Working with Feature Branches](../../branching-and-merging/working-with-feature-branches/content.md)).

## Common Mistakes

- **"`git fetch` didn't update my code."** Correct — it never does. Merge, rebase or pull.
- **Pulling with uncommitted changes** that conflict with incoming changes — Git refuses; commit or stash first.
- **Pulling into the wrong branch.** `git pull` integrates the **current** branch's upstream.
- **Accepting a "Merge branch 'main' of github.com:…" commit on every pull** without realising — configure `pull.rebase` or `pull.ff`.
- **`git pull` after rebasing a pushed branch** — merges the old commits back (see [Rewriting History Safely](../../rebasing-and-rewriting/rewriting-history-safely/content.md)).

## Interview Angle

"Difference between fetch and pull?" — fetch downloads and updates remote-tracking branches only; pull = fetch + merge (or rebase) into the current branch. Follow-up: "Why fetch first?" — inspect before integrating, no surprise conflicts. "`pull --rebase`?" — replays local commits on top of the fetched ones for linear history.

## Recap

- Fetch updates `origin/*`; your branches and files are untouched.
- Pull = fetch + merge/rebase/fast-forward into the current branch.
- Divergence needs a choice; configure `pull.rebase` or `pull.ff`.
- Fetch, inspect, then integrate.

## Related Topics

- [Remotes, origin and Remote-Tracking Branches](../remotes-and-origin/content.md)
- [git push and Upstream Tracking](../git-push-and-upstream/content.md)
- [git rebase](../../rebasing-and-rewriting/git-rebase/content.md)
