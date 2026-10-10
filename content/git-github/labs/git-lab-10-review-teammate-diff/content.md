# Lab 10 — Review a Teammate's Diff

**Lab:** 10 · **Module:** Pull Requests and Code Review · **Difficulty:** Intermediate · **Verification:** Tested

> [!NOTE]
> Run with two local clones (Priya and Arjun) and a bare stand-in remote; the build used Maven 3.9.12. Posting review comments on GitHub is described, not run.

## Objective

Review a teammate's branch from the command line — commits, test changes, code diff — then build it in a separate worktree without disturbing your own uncommitted work, and write an actionable review.

## Prerequisites

- Lessons: [Reviewing Pull Requests](../../pull-requests-and-review/reviewing-pull-requests/content.md), [Git Worktrees](../../specialized-workflows/git-worktrees/content.md).
- JDK 17+ and Maven for Step 4.

## Scenario

Arjun pushed `feature/simpler-average`, "Simplify average with streams", and asked Priya to review. Priya has an unfinished README edit she doesn't want to stash.

## Steps

### Step 1: Starting state

Priya's repository with a remote (as in [Lab 02](../git-lab-02-push-to-remote/content.md)). Arjun clones it into `~/git-lab/arjun`, creates `feature/simpler-average`, replaces the loop in `average()` with streams and pushes the branch.

### Step 2: Fetch and list the commits

```bash
cd ~/git-lab/gradebook
git fetch
git log --oneline main..origin/feature/simpler-average
git diff --stat main...origin/feature/simpler-average
```

**Output:**

```text
From /home/student/git-lab/remotes/gradebook
 * [new branch]      feature/simpler-average -> origin/feature/simpler-average
3cbce3d Simplify average with streams
 src/main/java/com/example/gradebook/GradeCalculator.java | 7 ++-----
 1 file changed, 2 insertions(+), 5 deletions(-)
```

### Step 3: Tests first, then code

```bash
git diff main...origin/feature/simpler-average -- src/test
```

Prints nothing — **no test changes**. That's a first review point for a change in calculation logic.

```bash
git diff main...origin/feature/simpler-average
```

**Output:**

```text
diff --git a/src/main/java/com/example/gradebook/GradeCalculator.java b/src/main/java/com/example/gradebook/GradeCalculator.java
index ec1a400..3dad311 100644
--- a/src/main/java/com/example/gradebook/GradeCalculator.java
+++ b/src/main/java/com/example/gradebook/GradeCalculator.java
@@ -7,11 +7,8 @@ public class GradeCalculator {
         if (marks.length == 0) {
             throw new IllegalArgumentException("at least one mark is required");
         }
-        int total = 0;
-        for (int mark : marks) {
-            total += mark;
-        }
-        return (double) total / marks.length;
+        int total = java.util.Arrays.stream(marks).sum();
+        return total / marks.length;
     }
 
     /** A for 90+, B for 75+, C for 60+, F below 60. */
```

Spot it before building: the `(double)` cast disappeared, so `total / marks.length` is **integer division**.

### Step 4: Build it in a worktree

Priya's README edit stays untouched:

```bash
git worktree add --detach ../gradebook-review origin/feature/simpler-average
cd ../gradebook-review
mvn -B -q test
```

**Output (relevant lines):**

```text
Preparing worktree (detached HEAD 3cbce3d)
HEAD is now at 3cbce3d Simplify average with streams
[ERROR] Tests run: 3, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 0.053 s <<< FAILURE! -- in com.example.gradebook.GradeCalculatorTest
[ERROR] com.example.gradebook.GradeCalculatorTest.averagesMarks -- Time elapsed: 0.010 s <<< FAILURE!
org.opentest4j.AssertionFailedError: expected: <83.33> but was: <83.0>
[ERROR]   GradeCalculatorTest.averagesMarks:14 expected: <83.33> but was: <83.0>
```

```bash
cd ../gradebook
git worktree remove ../gradebook-review
git status --short
```

**Output (`git status --short`):**

```text
 M README.md
```

Her own work is exactly as she left it.

### Step 5: Write the review (on GitHub — described)

Request changes with a line comment on `return total / marks.length;`:

```text
This is integer division now — average(82, 91, 77) returns 83.0 instead of 83.33
(GradeCalculatorTest.averagesMarks fails locally). Suggest:

    return (double) total / marks.length;

The stream version is nice otherwise. Could you also add a test where the average
isn't a whole number, so this can't regress silently?
```

## Verification Checklist

- ☐ You found the bug from the diff before running the build.
- ☐ The failing test output confirms it.
- ☐ Your working tree still has your uncommitted README edit.
- ☐ The review comment states the problem, the evidence, a fix and a request for a test.

## Common Mistakes

- Reviewing with `git diff main origin/feature/…` (two dots) — includes unrelated `main` changes.
- Checking out the branch in your main working tree and losing track of your own edits.
- Approving because CI "probably" ran.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Branch not found after Arjun pushed | `git fetch` |
| `worktree add` says the branch is already checked out | Use `--detach` or a different path |
| Forgot to remove the worktree | `git worktree list`, then `remove` or `prune` |
