# git rm and git mv: Deleting and Renaming Files

**Module:** The Three Areas and Basic Workflow · **Interview priority:** Frequently asked

## Learning Objectives

- Delete tracked files with `git rm` and understand its safety check.
- Rename or move files with `git mv`, and know that Git detects renames rather than recording them.
- Follow a renamed file's history with `git log --follow`.

## What Is It?

- **`git rm <file>`** deletes a tracked file from the working directory **and** stages the deletion. `git rm --cached <file>` stages the deletion but keeps the file on disk (untracking it).
- **`git mv <old> <new>`** renames or moves a tracked file and stages the change.

Both are conveniences: deleting or moving a file with your file manager and then running `git add -A` produces the same staged result.

## Why It Matters

Deletions and renames are changes like any other: they must be staged and committed, or the deleted file reappears on another clone. Understanding that Git **detects** renames by content similarity explains why heavily edited moved files sometimes show up as "deleted + new" and lose their visible history.

## How It Works

Git stores snapshots, not operations. A commit doesn't contain "rename A to B"; it contains a tree where `A` is gone and `B` exists. When you look at history (`git status`, `git diff`, `git log`), Git compares the two snapshots and reports a **rename** if a deleted file and an added file are similar enough (50 % by default).

```text
snapshot 1: README.md (blob 3f2a…)
snapshot 2: GRADING.md (blob 3f2a…)       → reported as "renamed: README.md -> GRADING.md"
```

## Deleting Files

```bash
git rm src/main/java/com/example/gradebook/Student.java
git status -s
```

**Output:**

```text
rm 'src/main/java/com/example/gradebook/Student.java'
D  src/main/java/com/example/gradebook/Student.java
```

`git rm` refuses to delete a file with **uncommitted changes**, because they would be lost:

**Output (`git rm README.md` after editing it):**

```text
error: the following file has local modifications:
    README.md
(use --cached to keep the file, or -f to force removal)
```

> [!CAUTION]
> `git rm -f` deletes the file **and** its uncommitted changes — they are not in any commit, so Git cannot restore them. Use `--cached` if you want to keep the file, or commit/stash the changes first.

Directories need `-r`: `git rm -r docs/old/`.

## Renaming and Moving Files

```bash
git mv README.md GRADING.md
git status
```

**Output:**

```text
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	renamed:    README.md -> GRADING.md
```

The same result without `git mv`:

```bash
mv README.md GUIDE.md
git status -s
```

**Output:**

```text
 D README.md
?? GUIDE.md
```

Before staging, Git sees an unrelated deletion and a new file. After `git add -A`:

**Output (`git status -s`):**

```text
R  README.md -> GUIDE.md
```

Rename detection happened once both sides were staged.

## Renames in Java Projects

Renaming a Java class means renaming the file **and** editing it (the class name, and its usages elsewhere). If the edits are large, the similarity can drop below 50 % and Git reports delete + add, which hides the file's earlier history in `git log`. Good practice: commit the **pure rename** first (IDE "Rename" refactoring, then commit), then commit behavioural changes separately.

To see a file's history across renames:

```bash
git log --follow --oneline -- src/main/java/com/example/gradebook/GradeService.java
```

## Commands

### git rm

**Syntax:** `git rm [-r] [--cached] [-f] <path>...` · **Safety:** changes local state; `-f` is **Practice repository first** (loses uncommitted edits).

### git mv

**Syntax:** `git mv <source> <destination>` · **Safety:** changes local state (undo with `git mv` back, or `git restore --staged` plus moving the file back).

## Step-by-Step Example

Rename `App.java` to `GradebookApp.java` in gradebook:

1. Use the IDE's rename refactoring (updates the class name and references), or `git mv` and edit the class name.
2. `git status` — expect `renamed:` plus any modified files that referenced the class.
3. Build and test.
4. Commit: "Rename App to GradebookApp".

## Common Mistakes

- **Deleting files in the IDE and forgetting to stage the deletions.** `git add -A` or `git add -u` stages them; `git add .` does too within its folder.
- **`git rm` when you meant "stop tracking".** Use `--cached` to keep the file.
- **Renaming and rewriting a file in one commit.** Git may lose the rename; split the commit.
- **Case-only renames on Windows/macOS** (`app.java` → `App.java`): case-insensitive file systems can hide the change. `git mv app.java App.java` records it correctly.

## Interview Angle

"Does Git track renames?" — Not explicitly; it stores snapshots and **detects** renames by comparing content similarity when showing history. `git log --follow` follows a single file across renames.

## Recap

- `git rm` deletes and stages; `--cached` keeps the file; `-f` discards uncommitted edits.
- `git mv` renames and stages — equivalent to `mv` plus `git add -A`.
- Renames are inferred from similarity (50 % by default), not stored.
- Commit pure renames separately from content changes.

## Related Topics

- [.gitignore and Tracking Files](../../configuration-and-repositories/gitignore-and-tracking/content.md)
- [git log](../../history-and-inspection/git-log/content.md)
- [Snapshots, Packfiles and Storage](../../git-internals/packfiles-and-storage/content.md)
