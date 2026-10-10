# Java Feature Branches, Meaningful Commits and Conflicts in Java Code

**Module:** Java Project Git Workflow · **Interview priority:** Core

> [!NOTE]
> The conflict below was produced in the practice lab, and each resolution was checked with a real Maven build (`mvn -B verify`, 4 tests).

## Learning Objectives

- Develop a Java feature on a branch as a series of meaningful, buildable commits.
- Resolve a conflict in Java source so the code compiles and both features survive.
- Use the compiler and tests as part of every merge, not just Git's conflict markers.

## What Is It?

The everyday routine from [Working with Feature Branches](../../branching-and-merging/working-with-feature-branches/content.md), applied to a Java codebase: each change is a branch; each commit compiles and passes the tests; conflicts are resolved by understanding the **code**, then proven with the **build**.

## Why It Matters

Java conflicts are rarely just "pick a side": two developers add methods, imports, enum constants or dependencies in the same place. A resolution that removes the markers can still fail to compile — or compile and break behaviour. The build is the final judge.

## How It Works

### Meaningful commits for a Java feature

Priya adds `highest()` to `GradeCalculator`:

```bash
git switch -c feature/highest-mark main
# edit GradeCalculator.java and GradeCalculatorTest.java
mvn -B verify
git add src/main/java/com/example/gradebook/GradeCalculator.java src/test/java/com/example/gradebook/GradeCalculatorTest.java
git commit -m "Add highest() to GradeCalculator"
```

The method and its test go in **one** commit (atomic and buildable). A good feature history might read:

```text
Add highest() to GradeCalculator
Show the highest mark in ClassReport
Document highest mark in README
```

— each step compiles, has tests and can be reviewed or reverted alone. Refactors (renames, moving classes) go in their own commits **before** the feature commits.

### A conflict in Java code

Meanwhile Arjun added `lowest()` to the end of the same class on `main`. Updating the feature branch:

```bash
git merge main
```

**Output:**

```text
Auto-merging src/main/java/com/example/gradebook/GradeCalculator.java
CONFLICT (content): Merge conflict in src/main/java/com/example/gradebook/GradeCalculator.java
Automatic merge failed; fix conflicts and then commit the result.
```

The end of `GradeCalculator.java`:

```java
<<<<<<< HEAD
    /** Highest mark; an empty list is an error. */
    public int highest(int... marks) {
        if (marks.length == 0) {
            throw new IllegalArgumentException("at least one mark is required");
        }
        int best = marks[0];
        for (int mark : marks) {
            best = Math.max(best, mark);
        }
        return best;
=======
    /** Lowest mark; an empty list is an error. */
    public int lowest(int... marks) {
        if (marks.length == 0) {
            throw new IllegalArgumentException("at least one mark is required");
        }
        int worst = marks[0];
        for (int mark : marks) {
            worst = Math.min(worst, mark);
        }
        return worst;
>>>>>>> main
    }
}
```

Notice the trap: Git aligned the two new methods line by line, so the **closing brace of each method is shared** below the markers. Both sides want their method; the right answer is "keep both".

**Naive resolution** — just delete the three marker lines. The braces no longer balance:

**Output (`mvn -B compile`):**

```text
[ERROR] /home/student/git-lab/gradebook/src/main/java/com/example/gradebook/GradeCalculator.java:[36,5] illegal start of expression
```

**Correct resolution** — two complete methods:

```java
    /** Highest mark; an empty list is an error. */
    public int highest(int... marks) {
        if (marks.length == 0) {
            throw new IllegalArgumentException("at least one mark is required");
        }
        int best = marks[0];
        for (int mark : marks) {
            best = Math.max(best, mark);
        }
        return best;
    }

    /** Lowest mark; an empty list is an error. */
    public int lowest(int... marks) {
        if (marks.length == 0) {
            throw new IllegalArgumentException("at least one mark is required");
        }
        int worst = marks[0];
        for (int mark : marks) {
            worst = Math.min(worst, mark);
        }
        return worst;
    }
}
```

```bash
mvn -B verify
```

**Output (last lines):**

```text
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

```bash
git add src/main/java/com/example/gradebook/GradeCalculator.java
git commit --no-edit
git log --oneline --graph -4
```

**Output:**

```text
*   bc1de0f Merge branch 'main' into feature/highest-mark
|\  
| * b78d474 Add lowest() to GradeCalculator
* | 48430ce Add highest() to GradeCalculator
|/  
* b00b1e8 Make the Maven wrapper executable
```

### Typical Java conflict hot-spots

| Where | Usual resolution |
|-------|------------------|
| Methods appended at the end of a class | Keep both, fix braces, maybe reorder logically |
| `import` blocks | Keep the union; let the IDE "optimize imports" afterwards |
| Enum constants / `switch` cases | Keep both; check commas, semicolons and `default` |
| `pom.xml` dependencies or versions | Keep both dependencies; for version clashes choose deliberately and run the full build |
| Formatting-only differences | Re-run the shared formatter, then compare the logic |

Small duplication like the two empty-mark checks above is a candidate for a follow-up refactor commit — not something to sneak into the merge commit.

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git switch -c feature/<name> main` | Start the feature | Changes local state |
| `mvn -B verify` (or `./mvnw -B verify`) | Prove each commit and each resolution | Builds only |
| `git merge main` / `git rebase main` | Update the feature branch | Changes local state |
| `git diff --check` | Leftover conflict markers | Safe anywhere |

## Step-by-Step Example

1. Branch from an up-to-date `main`.
2. Commit in buildable steps, each with tests; `mvn -B verify` before every commit.
3. Update from `main` regularly; on conflicts, understand both sides, edit, `git diff --check`, `mvn -B verify`.
4. Push and open a PR; CI repeats the build.

## Common Mistakes

- **Deleting markers without reading the code** — unbalanced braces or duplicated statements.
- **"Accept theirs" for a whole Java file** — silently drops the other feature.
- **Committing a resolution without compiling.**
- **Mixing a refactor into the merge commit** — reviewers can't see it.

## Interview Angle

"How do you resolve a merge conflict in Java code?" — understand both changes, combine them so both intents survive, watch shared lines like braces and imports, run `git diff --check`, compile and run the tests, then commit. The phrase "the build is the final judge" lands well.

## Recap

- One feature, one branch, buildable commits with their tests.
- Java conflicts often share braces or imports — keep both sides correctly.
- Compile and test after resolving; markers gone is not enough.
- Separate refactors from features and merges.

## Related Topics

- [Merge Conflicts](../../branching-and-merging/merge-conflicts/content.md)
- [Reviewing Java Pull Requests](../java-pull-request-review/content.md)
- [Coordinating a Team](../../team-workflows/team-coordination-practices/content.md)
