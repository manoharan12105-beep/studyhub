# git diff: Unstaged, Staged and Committed Changes

**Module:** The Three Areas and Basic Workflow · **Interview priority:** Core

## Learning Objectives

- Read unified diff output: file header, hunk header, added, removed and context lines.
- Choose between `git diff`, `git diff --staged` and `git diff HEAD`.
- Summarise changes with `--stat` and `--name-only`, and limit a diff to a path.

## What Is It?

`git diff` shows the line-by-line differences between two snapshots. With no arguments it compares the **working directory with the staging area** — the changes you have **not staged yet**. `git diff --staged` (same as `--cached`) compares the **staging area with the last commit** — what the next commit **will contain**.

## Why It Matters

Reviewing the diff before committing is the habit that catches debug code, accidental edits, secrets and files that don't belong. It is also how you review a teammate's change, find what broke between two versions and write accurate commit messages.

## How It Works

```text
            git diff --staged              git diff
 HEAD ◄──────────────────────► index ◄──────────────────► working directory
   ◄──────────────────────────────────────────────────────►
                         git diff HEAD   (everything since the last commit)
```

## Reading a Diff

Priya adds a D grade to `GradeCalculator.java` and runs `git diff`:

**Output:**

```text
diff --git a/src/main/java/com/example/gradebook/GradeCalculator.java b/src/main/java/com/example/gradebook/GradeCalculator.java
index ec1a400..874385c 100644
--- a/src/main/java/com/example/gradebook/GradeCalculator.java
+++ b/src/main/java/com/example/gradebook/GradeCalculator.java
@@ -14,11 +14,12 @@ public class GradeCalculator {
         return (double) total / marks.length;
     }
 
-    /** A for 90+, B for 75+, C for 60+, F below 60. */
+    /** A for 90+, B for 75+, C for 60+, D for 50+, F below 50. */
     public char letterGrade(double average) {
         if (average >= 90) return 'A';
         if (average >= 75) return 'B';
         if (average >= 60) return 'C';
+        if (average >= 50) return 'D';
         return 'F';
     }
 }
```

| Part | Meaning |
|------|---------|
| `diff --git a/… b/…` | The file being compared (`a/` = old side, `b/` = new side) |
| `index ec1a400..874385c 100644` | Abbreviated ids of the old and new file contents (blobs) and the file mode |
| `---` / `+++` | Old and new file names |
| `@@ -14,11 +14,12 @@` | Hunk header: old version lines 14–24 (11 lines), new version lines 14–25 (12 lines); the text after `@@` is the enclosing code for context |
| line starting with `-` | Removed |
| line starting with `+` | Added |
| line starting with a space | Unchanged context (3 lines by default) |

A changed line appears as a `-` line followed by a `+` line.

After `git add`, the same change moves: `git diff` prints nothing, and `git diff --staged` shows it. A summary:

```bash
git diff --staged --stat
```

**Output:**

```text
 src/main/java/com/example/gradebook/GradeCalculator.java | 3 ++-
 1 file changed, 2 insertions(+), 1 deletion(-)
```

> [!TIP]
> "`git diff` shows nothing but I changed files" almost always means the changes are **staged**. Run `git diff --staged`, or `git status`.

## Comparing Other Things

| Command | Compares |
|---------|----------|
| `git diff` | working directory vs index |
| `git diff --staged` | index vs HEAD |
| `git diff HEAD` | working directory vs HEAD (staged + unstaged) |
| `git diff HEAD~1 HEAD` | the previous commit vs the latest (what the last commit changed) |
| `git diff main feature` | the tips of two branches |
| `git diff main...feature` | what `feature` changed since it branched from `main` — see [Ranges and Ancestry](../../advanced-inspection/ranges-and-ancestry/content.md) |
| `git diff -- src/test` | limit any of the above to a path (`--` separates paths from revisions) |

Useful options:

| Option | Effect |
|--------|--------|
| `--stat` | Files and counts of changed lines |
| `--name-only` / `--name-status` | Changed file names (with A/M/D status) |
| `-w` | Ignore whitespace changes |
| `--word-diff` | Show changed words inline instead of whole lines |
| `-U<n>` | `n` lines of context instead of 3 |

## Commands

### git diff

**Syntax:** `git diff [--staged] [<commit> [<commit>]] [-- <path>...]` · **Safety:** safe anywhere (read-only).

## Step-by-Step Example

The pre-commit review routine:

1. `git status -s` — which files changed?
2. `git diff` — anything unstaged that should be part of this commit?
3. `git add <files>`
4. `git diff --staged` — read every line that will be committed. Look for debug output, commented-out code, credentials, unrelated formatting.
5. `git diff --staged --stat` — does the size match what you intended?
6. Commit.

## Common Mistakes

- **Reviewing with `git diff` after staging** and seeing nothing.
- **Forgetting new files.** Untracked files never appear in `git diff`; they appear in `git diff --staged` once added.
- **Confusing `git diff A B` with "changes made on B".** Two-dot diff compares the two tips directly; use three dots for "what B added since it diverged from A".
- **Huge whitespace-only diffs** from an editor reformatting or line-ending changes — check with `-w`, and fix the cause (`.gitattributes`, editor settings).

## Interview Angle

"How do you see staged changes?" — `git diff --staged` (or `--cached`). Follow-up: "What does `git diff HEAD` show?" — staged and unstaged together. Being able to explain a hunk header shows you actually read diffs.

## Recap

- `git diff` = unstaged; `git diff --staged` = staged; `git diff HEAD` = both.
- Diffs have file headers, hunk headers (`@@ -old +new @@`), `-`, `+` and context lines.
- `--stat` and `--name-only` summarise; `-- <path>` limits.
- Review `git diff --staged` before every commit.

## Related Topics

- [The Three Areas of Git](../three-areas-of-git/content.md)
- [git commit](../git-commit/content.md)
- [git show and Comparing Commits](../../history-and-inspection/git-show-and-comparing/content.md)
