# git status and git add

**Module:** The Three Areas and Basic Workflow · **Interview priority:** Core

## Learning Objectives

- Read `git status` in long and short form, including branch information.
- Choose between `git add <path>`, `git add .`, `git add -u`, `git add -A` and `git add -p`.
- Preview what `git add` would do before doing it.

## What Is It?

- **`git status`** reports the state of the working directory and staging area compared with the last commit: what is staged, what is modified but not staged, and what is untracked. It also tells you which branch you are on and how it compares with its upstream.
- **`git add`** copies the current content of files into the staging area so the next commit includes it. It stages new files, modifications and (depending on the form) deletions.

## Why It Matters

`git status` is the command you run most, and the one to run **before every potentially destructive command**. `git add` decides what goes into history; staging too much (build output, debug code, unrelated files) is the most common cause of messy commits.

## How It Works

`git status` compares three snapshots:

```text
last commit (HEAD) ──vs──► staging area   →  "Changes to be committed"
staging area       ──vs──► working dir    →  "Changes not staged for commit"
files on disk not in the index (and not ignored)  →  "Untracked files"
```

`git add` takes the **content at the moment you run it**. Editing the file afterwards creates a new unstaged change.

## Reading git status

**Output (one file modified, one new file):**

```text
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   README.md

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	src/main/java/com/example/gradebook/Student.java

no changes added to commit (use "git add" and/or "git commit -a")
```

The hints in brackets are Git telling you the next commands. Note the warning hidden in one of them: `git restore <file>` **discards** your changes.

Short form with branch line (`git status -sb`), after editing `README.md`, deleting `App.java` and creating `notes.txt`:

**Output:**

```text
## main
 M README.md
 D src/main/java/com/example/gradebook/App.java
?? notes.txt
```

With a remote, the first line also shows tracking, for example `## main...origin/main [ahead 1]`.

## Choosing the Right git add

Same starting state (modified `README.md`, deleted `App.java`, new `notes.txt`):

| Command | Stages modifications | Stages deletions | Stages new files | Scope |
|---------|---------------------|------------------|------------------|-------|
| `git add <path>` | yes | yes | yes | Only that path |
| `git add .` | yes | yes | yes | Current directory and below |
| `git add -u` | yes | yes | **no** | Whole repository, tracked files only |
| `git add -A` | yes | yes | yes | Whole repository |
| `git add -p` | chosen hunks | — | no | Interactive, hunk by hunk |

Captured results:

```bash
git add -u && git status -s
```

**Output:**

```text
M  README.md
D  src/main/java/com/example/gradebook/App.java
?? notes.txt
```

```bash
git add -A && git status -s
```

**Output:**

```text
M  README.md
A  notes.txt
D  src/main/java/com/example/gradebook/App.java
```

Running `git add .` from inside `src/` staged only the deletion under `src/`:

**Output:**

```text
 M README.md
D  src/main/java/com/example/gradebook/App.java
?? notes.txt
```

## Previewing: git add -n

`--dry-run` (`-n`) shows what would be staged without staging it:

```bash
git add -n .
```

**Output:**

```text
add 'README.md'
remove 'src/main/java/com/example/gradebook/App.java'
add 'notes.txt'
```

## Staging Part of a File: git add -p

`git add -p <file>` shows each **hunk** (a block of changed lines) and asks what to do:

| Key | Action |
|-----|--------|
| `y` | stage this hunk |
| `n` | skip it |
| `s` | split it into smaller hunks |
| `e` | edit the hunk by hand |
| `q` | quit |
| `?` | help |

Use it when one file contains two unrelated changes — for example a bug fix and a leftover debug `println`. Stage the fix, commit, and deal with the debug line separately.

## Commands

### git status

**Syntax:** `git status [-s] [-b] [--ignored]` · **Safety:** safe anywhere.

### git add

**Syntax:** `git add [-A | -u | -p | -n] [<pathspec>...]` · **Safety:** changes local state (the index only; easy to undo with `git restore --staged`).

## Step-by-Step Example

1. `git status -sb` — read the state.
2. `git add -n .` — preview.
3. Stage only what belongs to this commit: `git add src/main/java/com/example/gradebook/GradeCalculator.java`.
4. `git diff --staged` — check exactly what will be committed.
5. Commit.

## Common Mistakes

- **`git add .` from the root without looking.** It stages everything not ignored, including stray files like `notes.txt` or a forgotten `.env`. Run `git status` first and keep `.gitignore` current.
- **Expecting `git add -u` to stage new files.** It only updates tracked files.
- **Running `git add .` in a subfolder and expecting the whole project.** It is limited to that folder.
- **Ignoring the hint text.** `git status` tells you exactly how to unstage (`git restore --staged`) — use it instead of guessing.

## Interview Angle

"What's the difference between `git add .`, `git add -A` and `git add -u`?" — scope (current directory vs whole repository) and whether new files are included. Mentioning `git add -p` for partial staging signals real-world experience.

## Recap

- `git status` compares HEAD, the index and the working directory; `-sb` is the compact form.
- `git add` stages content as it is right now.
- `-u` = tracked files only; `-A` = everything; `.` = everything under the current folder.
- Preview with `-n`; stage hunks with `-p`.

## Related Topics

- [The Three Areas of Git](../three-areas-of-git/content.md)
- [git diff](../git-diff/content.md)
- [git restore](../../undoing-and-recovery/git-restore/content.md)
