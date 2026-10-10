# The Three Areas of Git and File States

**Module:** The Three Areas and Basic Workflow · **Interview priority:** Core

## Learning Objectives

- Name Git's three areas — working directory, staging area (index) and repository — and what each holds.
- Follow a file through the states untracked, modified, staged and committed.
- Predict which command moves a change between which areas.

## What Is It?

Git keeps **three versions** of your project at the same time:

| Area | Also called | Holds | You change it with |
|------|-------------|-------|--------------------|
| **Working directory** | working tree | The files on disk that you edit | Your editor or IDE |
| **Staging area** | index, cache | The exact snapshot your **next** commit will contain | `git add`, `git rm`, `git restore --staged` |
| **Repository** | `.git` directory, local repository | Every commit ever made | `git commit` |

A fourth place appears once you collaborate: the **remote repository** (for example on GitHub), updated with `git push` and read with `git fetch`.

## Why It Matters

Almost every confusing Git moment is a question about areas: "Why isn't my change in the commit?" (not staged), "Why does `git diff` show nothing?" (the change is staged), "Did `git restore` lose my work?" (it overwrote the working directory). Interviewers ask about the staging area to see whether you understand Git or only memorised commands.

## How It Works

```text
  Working directory          Staging area (index)          Repository (.git)
 ┌───────────────────┐      ┌─────────────────────┐       ┌───────────────────┐
 │ files you edit    │ ───► │ snapshot of the     │ ────► │ commits (history) │
 │                   │ git  │ next commit         │  git  │                   │
 │                   │ add  │                     │ commit│                   │
 └───────────────────┘      └─────────────────────┘       └───────────────────┘
          ▲   git restore <file>        ▲  git restore --staged <file>     │
          └─────────────────────────────┴──────────────────────────────────┘
                       (copy back from the index / from the last commit)

  git diff            = working directory vs staging area   (what is NOT staged yet)
  git diff --staged   = staging area vs last commit          (what WILL be committed)
```

After a commit, all three areas hold the same content for every tracked file — the **working tree is clean**.

## Why a Staging Area?

The staging area lets you **choose** what goes into a commit. You might fix a bug and also tidy some formatting in the same file session; staging lets you commit the bug fix alone with a clear message, then the formatting separately. With `git add -p` you can even stage individual parts (hunks) of one file.

## File States

```text
            git add                     git commit
 untracked ─────────► staged ───────────────────────► unmodified (committed)
                        ▲                                    │
                        │ git add               edit the file│
                        └──────────── modified ◄─────────────┘
```

| State | Meaning | `git status --short` |
|-------|---------|----------------------|
| Untracked | New file, never added | `??` |
| Modified | Tracked, changed since the last commit, not staged | ` M` (second column) |
| Staged | Change recorded in the index for the next commit | `M ` or `A ` (first column) |
| Staged and modified again | Staged, then edited again — two different versions | `MM` |
| Unmodified | Same in all three areas | not listed |

The **two columns** of the short format are: left = staging area vs last commit, right = working directory vs staging area.

## The Complete Edit–Stage–Commit Cycle

Starting from a clean gradebook repository, Priya appends a grading scale to `README.md` and creates a new `Student.java`:

```bash
git status --short
```

**Output:**

```text
 M README.md
?? src/main/java/com/example/gradebook/Student.java
```

`README.md` is modified in the working directory only; `Student.java` is untracked. Stage the README:

```bash
git add README.md
git status --short
```

**Output:**

```text
M  README.md
?? src/main/java/com/example/gradebook/Student.java
```

The `M` moved to the left column: the change is now in the staging area. If Priya edits `README.md` again before committing:

**Output (`git status --short`):**

```text
MM README.md
?? src/main/java/com/example/gradebook/Student.java
```

Left `M`: a staged version. Right `M`: a newer, unstaged version. A commit now would contain only the **staged** version. After `git add README.md src/` both are staged:

**Output (`git status --short`):**

```text
M  README.md
A  src/main/java/com/example/gradebook/Student.java
```

```bash
git commit -m "Add Student record and grading scale to README"
```

**Output:**

```text
[main b0891be] Add Student record and grading scale to README
 2 files changed, 8 insertions(+)
 create mode 100644 src/main/java/com/example/gradebook/Student.java
```

```bash
git status
```

**Output:**

```text
On branch main
nothing to commit, working tree clean
```

## Commands

| Command | Moves | Safety |
|---------|-------|--------|
| `git add <file>` | working directory → staging area | Changes local state |
| `git commit` | staging area → repository | Changes local state |
| `git restore --staged <file>` | last commit → staging area (unstage) | Changes local state; working file untouched |
| `git restore <file>` | staging area → working directory (discard edits) | **Practice repository first** — unstaged edits are lost |
| `git diff` / `git diff --staged` | compares areas | Safe anywhere |

## Step-by-Step Example

Try this in `~/git-lab/gradebook` and predict each `git status --short` line before running it:

1. Edit `README.md` → ` M README.md`.
2. `git add README.md` → `M  README.md`.
3. Edit it again → `MM README.md`.
4. `git diff` shows only step 3's change; `git diff --staged` shows only step 1's.
5. `git add README.md && git commit -m "Describe grading scale"` → clean.

In the StudyHub app, the **repository state simulator** in this lesson lets you click through the same actions and watch the areas change.

## Common Mistakes

- **Expecting `git commit` to include unstaged edits.** It commits the index. Use `git add` first (or `git commit -a` for tracked files).
- **Editing after `git add` and assuming the edit is staged.** `MM` means two versions; stage again.
- **Thinking `git add` saves your work permanently.** Staged content is safer than nothing (it is stored as an object) but it is not a commit.

## Interview Angle

"Explain the working directory, staging area and repository" is one of the most common Git questions. Name the three areas, the commands that move changes between them, and *why* the staging area exists: to build focused commits deliberately.

## Recap

- Three areas: working directory (edit), staging area (prepare), repository (record).
- `git add` stages, `git commit` records what is staged, `git restore` copies back.
- Short status: left column = staged, right column = unstaged.
- A clean working tree means all three areas match.

## Related Topics

- [git status and git add](../git-status-and-add/content.md)
- [git diff](../git-diff/content.md)
- [The Index](../../git-internals/index-internals/content.md)
