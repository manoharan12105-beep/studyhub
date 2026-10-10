# git commit: Recording Snapshots

**Module:** The Three Areas and Basic Workflow · **Interview priority:** Core

## Learning Objectives

- Create commits from the staging area with a message, with the editor, and with `-a`.
- Read the output of `git commit` and know what a commit contains.
- Know when `git commit -a` is safe and when it is not.

## What Is It?

`git commit` creates a new **commit**: a permanent snapshot of the staging area, with an author, a committer, timestamps, a message and a pointer to the **parent** commit (the previous commit on this branch). The current branch then moves forward to point at the new commit.

## Why It Matters

Commits are the unit of history: what you can review, revert, cherry-pick, bisect and release. A commit made carelessly — with unrelated changes, a broken build or a message like "fix" — makes every later investigation harder.

## How It Works

```text
before:   A ◄── B            main → B, index = snapshot S
                             git commit -m "Add D grade"
after:    A ◄── B ◄── C      main → C, C = { snapshot S, parent B, author, date, message }
```

The commit is built from the **index**, not the working directory. Anything not staged is not part of it.

## Committing

With a message on the command line:

```bash
git commit -m "Add D grade for averages from 50 to 59"
```

**Output:**

```text
[main 01d355d] Add D grade for averages from 50 to 59
 1 file changed, 2 insertions(+), 1 deletion(-)
```

- `main` — the branch that moved.
- `01d355d` — the abbreviated id (hash) of the new commit.
- The summary line counts changed files and lines.

When a commit adds or deletes files, Git also prints their mode:

**Output:**

```text
[main b0891be] Add Student record and grading scale to README
 2 files changed, 8 insertions(+)
 create mode 100644 src/main/java/com/example/gradebook/Student.java
```

With the editor (no `-m`), Git opens `core.editor` with a template. The first line becomes the **subject**, then a blank line, then the **body**. Lines starting with `#` are removed. Saving an empty message aborts the commit. Use this form whenever the change needs explanation — see [Commit Messages and Atomic Commits](../commit-messages-and-atomic-commits/content.md).

`git commit -v` adds the staged diff to the editor template (as comments) so you can see the change while writing the message.

## git commit -a

`-a` stages **modified and deleted tracked files** and commits them in one step:

```bash
git commit -am "Test the D grade boundary"
```

**Output:**

```text
[main f5bb3a6] Test the D grade boundary
 1 file changed, 2 insertions(+), 1 deletion(-)
```

> [!WARNING]
> `-a` does **not** add untracked (new) files, and it commits **every** modified tracked file — including the debug edit in another file you forgot about. Use it only when `git status` shows exactly the changes you intend.

## Nothing to Commit

**Output (`git commit -m "nothing"` with a clean tree):**

```text
On branch main
nothing to commit, working tree clean
```

If files are modified but none are staged, Git says `no changes added to commit (use "git add" and/or "git commit -a")`.

## Fixing the Last Commit

Forgot a file or mistyped the message? `git commit --amend` replaces the last commit with a new one that includes whatever is now staged and (optionally) a new message:

```bash
git add src/test/java/com/example/gradebook/GradeCalculatorTest.java
git commit --amend -m "Add D grade with boundary tests"
```

The amended commit has a **new id**. That is harmless for commits you haven't pushed, and a problem for commits others already have — see [Rewriting History Safely](../../rebasing-and-rewriting/rewriting-history-safely/content.md).

## Commands

### git commit

**Syntax:** `git commit [-m <msg>] [-a] [-v] [--amend]` · **Safety:** changes local state (adds history; `--amend` replaces the last commit).

| Option | Effect |
|--------|--------|
| `-m "<msg>"` | Message on the command line (repeat `-m` for a body paragraph) |
| `-a` | Stage modified/deleted tracked files first |
| `-v` | Show the diff in the message editor |
| `--amend` | Replace the last commit |
| `--author="Name <email>"` | Record a different author (e.g. committing a colleague's patch) |

## Step-by-Step Example

1. `git status -s` and `git diff --staged` — confirm what is staged.
2. Build and test (`mvn -B verify` for gradebook) so the commit doesn't break the project.
3. `git commit` — write a subject (imperative, ≤ 50 characters) and a body explaining why.
4. `git log --oneline -3` — confirm the new commit is on the right branch.

**Output (`git log --oneline` after the three commits above):**

```text
f5bb3a6 Test the D grade boundary
01d355d Add D grade for averages from 50 to 59
b0891be Add Student record and grading scale to README
8ddf4ed Create gradebook project
```

## Common Mistakes

- **Committing on the wrong branch.** Check the branch name in the commit output, or `git status` first. Fix: [Troubleshooting Commits and Branches](../../troubleshooting/troubleshooting-commits-and-branches/content.md).
- **`git commit -am` with new files.** They're silently left out.
- **Committing a broken build.** Others pulling your commit inherit it; `git bisect` later stumbles on it.
- **Amending a pushed commit** without coordinating with the team.

## Interview Angle

"What does a commit contain?" — a snapshot (tree), parent(s), author and committer with timestamps, and a message, identified by a hash of all of that. "What does `-a` do?" — stages tracked modifications and deletions, not new files.

## Recap

- A commit records the staged snapshot plus metadata and a parent pointer; the branch moves to it.
- `-m` for short messages, the editor for messages with a body, `-v` to see the diff.
- `-a` skips staging for tracked files only — and includes all of them.
- `--amend` replaces the last commit; keep it to unpushed commits.

## Related Topics

- [Commit Messages and Atomic Commits](../commit-messages-and-atomic-commits/content.md)
- [Commits, Hashes and the History Graph](../../history-and-inspection/commits-and-history-graph/content.md)
- [git log](../../history-and-inspection/git-log/content.md)
