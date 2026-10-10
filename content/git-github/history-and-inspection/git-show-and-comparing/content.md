# git show and Comparing Commits and Branches

**Module:** Commit History and Inspection · **Interview priority:** Core

## Learning Objectives

- Inspect a single commit, its file list, or one file as it was in any commit.
- Compare two commits or two branches with `git diff`.
- List the commits one branch has that another doesn't.

## What Is It?

- **`git show <object>`** prints one object in a readable form. For a commit: its metadata and the diff it introduced. With `<commit>:<path>`: the file's content at that commit.
- **`git diff <a> <b>`** compares any two snapshots.
- **`git log <a>..<b>`** lists commits reachable from `b` but not from `a` — "what's on `b` that `a` doesn't have".

## Why It Matters

Code review, debugging and release preparation are all comparisons: what did this commit do, what changed between the last release and now, what does my branch add to `main`? Getting the comparison right avoids reviewing the wrong changes.

## How It Works

```text
git show C           →  diff between C's first parent and C, plus C's metadata
git show C:path      →  the file at commit C (no diff)
git diff A B         →  snapshot A vs snapshot B (direct comparison of two trees)
git log A..B         →  commits in B's history that are not in A's history
```

## Inspecting One Commit

```bash
git show 7c8bad0
```

**Output:**

```text
commit 7c8bad0985a32ad2d3f3bf3ff0a9e6a8fe64746e
Author: Arjun Mehta <arjun@example.com>
Date:   Sat Oct 3 10:06:00 2026 +0530

    Add Student record

diff --git a/src/main/java/com/example/gradebook/Student.java b/src/main/java/com/example/gradebook/Student.java
new file mode 100644
index 0000000..e4b3558
--- /dev/null
+++ b/src/main/java/com/example/gradebook/Student.java
@@ -0,0 +1,4 @@
+package com.example.gradebook;
+
+public record Student(String name, int[] marks) {
+}
```

`--- /dev/null` and `new file mode` mean the file did not exist before. Summary forms:

```bash
git show --stat HEAD
```

**Output:**

```text
commit 3a070e0d3d0abb543338e9b1bffc80830d43dd57
Author: Priya Sharma <priya@example.com>
Date:   Wed Oct 7 12:17:00 2026 +0530

    Raise the B threshold to 78

 src/main/java/com/example/gradebook/GradeCalculator.java | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

`git show` with no argument means `git show HEAD`.

> [!NOTE]
> For a **merge commit**, `git show` prints a "combined diff" that is empty when the merge had no conflicts to resolve — the merge itself introduced no new lines. To see what a merge brought into `main`, compare it with its first parent: `git diff 10b9974^1 10b9974 --stat`.

## A File as It Was

```bash
git show 8ddf4ed:README.md
```

**Output:**

```text
# gradebook

Calculates average marks and letter grades for a class.

## Build

    mvn -B verify

## Run

    java -cp target/classes com.example.gradebook.App
```

The path is relative to the repository root. To restore that version into your working directory instead of printing it, use `git restore --source=8ddf4ed README.md` ([git restore](../../undoing-and-recovery/git-restore/content.md)).

## Comparing Two Commits

```bash
git diff d0e8c67 3a070e0 -- src/main/java/com/example/gradebook/GradeCalculator.java
```

**Output:**

```text
diff --git a/src/main/java/com/example/gradebook/GradeCalculator.java b/src/main/java/com/example/gradebook/GradeCalculator.java
index 4853db9..7f31406 100644
--- a/src/main/java/com/example/gradebook/GradeCalculator.java
+++ b/src/main/java/com/example/gradebook/GradeCalculator.java
@@ -18,7 +18,7 @@ public class GradeCalculator {
     /** A for 90+, B for 75+, C for 60+, D for 50+, F below 50. */
     public char letterGrade(double average) {
         if (average >= 90) return 'A';
-        if (average >= 75) return 'B';
+        if (average >= 78) return 'B';
         if (average >= 60) return 'C';
         if (average >= 50) return 'D';
         return 'F';
```

Order matters: `git diff A B` shows how to get **from A to B**. Swapping them flips every `+` and `-`.

```bash
git diff 8ba66e3 d0e8c67 --stat
```

**Output:**

```text
 README.md                                                | 4 ++++
 src/main/java/com/example/gradebook/GradeCalculator.java | 3 ++-
 src/main/java/com/example/gradebook/Student.java         | 4 ++++
 3 files changed, 10 insertions(+), 1 deletion(-)
```

## Comparing Branches

Just before the merge, `main` was at `d0e8c67` and `feature/class-report` at `8b503ca`. Two different questions:

| Question | Command | Result |
|----------|---------|--------|
| Which commits does the feature branch add? | `git log --oneline main..feature/class-report` | `8b503ca`, `3e2381d` |
| What did the feature branch change since it split off? | `git diff main...feature/class-report` | Only `ClassReport.java` |
| How do the two tips differ right now? | `git diff main feature/class-report` | ClassReport added **and** the rounding change shown reversed |

```bash
git diff --stat main...feature/class-report
```

**Output:**

```text
 .../java/com/example/gradebook/ClassReport.java     | 21 +++++++++++++++++++++
 1 file changed, 21 insertions(+)
```

Three dots in `git diff` compare the **merge base** (the commit where the branches diverged) with the second branch — the same view a pull request shows. Details: [Ranges and Ancestry](../../advanced-inspection/ranges-and-ancestry/content.md).

## Commands

### git show

**Syntax:** `git show [<commit>] [--stat | --name-only]`, `git show <commit>:<path>` · **Safety:** safe anywhere.

### git diff between commits

**Syntax:** `git diff <a> <b> [-- <path>]`, `git diff <a>...<b>` · **Safety:** safe anywhere.

### git log ranges

**Syntax:** `git log <a>..<b>` · **Safety:** safe anywhere.

## Step-by-Step Example

Reviewing Arjun's branch before merging:

1. `git fetch` (when working with a remote) so branch names are current.
2. `git log --oneline main..feature/class-report` — the commits to review.
3. `git diff main...feature/class-report` — the combined change.
4. `git show <commit>` for any commit that needs a closer look.

## Common Mistakes

- **Two-dot `git diff main feature` for review.** It mixes in everything `main` gained since the split, shown as removals.
- **`git show` on a merge expecting the feature's diff.** Diff against the first parent instead.
- **Writing the path in `commit:path` relative to the current folder.** It's from the repository root (use `./path` for relative).

## Interview Angle

"How do you see what changed in a specific commit?" — `git show <hash>`. "How do you compare two branches?" — distinguish `log main..feature` (commits), `diff main...feature` (changes since divergence) and `diff main feature` (tip to tip).

## Recap

- `git show` = metadata + diff of one commit; `commit:path` = a file at that commit.
- `git diff A B` goes from A to B; order matters.
- `git log A..B` lists commits on B not on A.
- `git diff A...B` shows what B changed since it diverged from A.

## Related Topics

- [git diff](../../basic-workflow/git-diff/content.md)
- [Ranges and Ancestry](../../advanced-inspection/ranges-and-ancestry/content.md)
- [Reviewing Pull Requests](../../pull-requests-and-review/reviewing-pull-requests/content.md)
