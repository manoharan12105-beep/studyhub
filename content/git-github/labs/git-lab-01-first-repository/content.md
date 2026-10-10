# Lab 01 — Create a Repository and Make Meaningful Commits

**Lab:** 01 · **Module:** The Three Areas and Basic Workflow · **Difficulty:** Beginner · **Verification:** Tested

> [!NOTE]
> Every step was run in the practice lab (Git 2.52, Git Bash). Your commit hashes and dates will differ.

## Objective

Turn the gradebook project into a Git repository with a `.gitignore` and three meaningful, focused commits, using `status`, `diff` and staging deliberately.

## Prerequisites

- Git installed and configured with your name and email ([Git Configuration](../../configuration-and-repositories/git-configuration/content.md)).
- The setup script from [The Git Practice Lab](../../vcs-fundamentals/git-practice-lab/content.md) saved as `~/git-lab/setup-gradebook.sh`.

## Scenario

Priya has written the first version of gradebook without version control. She wants a clean starting history before her teammate joins: the project itself, then the D grade feature, then documentation.

## Steps

### Step 1: Create the project files

```bash
bash ~/git-lab/setup-gradebook.sh
cd ~/git-lab/gradebook
```

**Output:**

```text
gradebook created in /home/student/git-lab/gradebook
```

### Step 2: Initialise the repository

```bash
git init
git status --short
```

**Output:**

```text
Initialized empty Git repository in /home/student/git-lab/gradebook/.git/
?? README.md
?? pom.xml
?? src/
```

**Explanation:** everything is untracked; nothing is in history yet.

### Step 3: Add a .gitignore before the first commit

Create `.gitignore`:

```text
target/
.idea/
*.iml
*.log
.env
```

```bash
git status --short
```

**Output:**

```text
?? .gitignore
?? README.md
?? pom.xml
?? src/
```

### Step 4: First commit

```bash
git add .
git commit -m "Create gradebook project"
```

**Output:**

```text
[main (root-commit) d098dbb] Create gradebook project
 6 files changed, 111 insertions(+)
 create mode 100644 .gitignore
 create mode 100644 README.md
 create mode 100644 pom.xml
 create mode 100644 src/main/java/com/example/gradebook/App.java
 create mode 100644 src/main/java/com/example/gradebook/GradeCalculator.java
 create mode 100644 src/test/java/com/example/gradebook/GradeCalculatorTest.java
```

**Explanation:** `(root-commit)` marks the first commit — it has no parent.

### Step 5: A focused feature commit (code + test)

In `GradeCalculator.java`, add the D grade and update the comment:

```java
    /** A for 90+, B for 75+, C for 60+, D for 50+, F below 50. */
    public char letterGrade(double average) {
        if (average >= 90) return 'A';
        if (average >= 75) return 'B';
        if (average >= 60) return 'C';
        if (average >= 50) return 'D';
        return 'F';
    }
```

In `GradeCalculatorTest.java`, replace the last assertion of `mapsAverageToLetter` with:

```java
        assertEquals('D', calculator.letterGrade(59.9));
        assertEquals('F', calculator.letterGrade(49.9));
```

```bash
git status --short
git diff --stat
git add src/
git diff --staged --stat
git commit -m "Add D grade for averages from 50 to 59"
```

**Output:**

```text
 M src/main/java/com/example/gradebook/GradeCalculator.java
 M src/test/java/com/example/gradebook/GradeCalculatorTest.java
 src/main/java/com/example/gradebook/GradeCalculator.java     | 3 ++-
 src/test/java/com/example/gradebook/GradeCalculatorTest.java | 3 ++-
 2 files changed, 4 insertions(+), 2 deletions(-)
 src/main/java/com/example/gradebook/GradeCalculator.java     | 3 ++-
 src/test/java/com/example/gradebook/GradeCalculatorTest.java | 3 ++-
 2 files changed, 4 insertions(+), 2 deletions(-)
[main 5d042de] Add D grade for averages from 50 to 59
 2 files changed, 4 insertions(+), 2 deletions(-)
```

**Explanation:** the first `--stat` shows unstaged changes; after `git add src/` the same changes appear under `--staged`. If you have Maven, run `mvn -B verify` before committing.

### Step 6: A documentation commit

Append to `README.md`:

```markdown

## Grading scale

A: 90+, B: 75+, C: 60+, D: 50+, F: below 50
```

```bash
git commit -am "Document the grading scale in README"
```

**Output:**

```text
[main 98adee2] Document the grading scale in README
 1 file changed, 4 insertions(+)
```

**Explanation:** `-a` is safe here because `git status` showed only the README change.

### Step 7: Check the result

```bash
git log --oneline
git status
```

**Output:**

```text
98adee2 Document the grading scale in README
5d042de Add D grade for averages from 50 to 59
d098dbb Create gradebook project
On branch main
nothing to commit, working tree clean
```

## Verification Checklist

- ☐ `git log --oneline` shows three commits with imperative, specific messages.
- ☐ `git show --stat HEAD~1` lists exactly the two Java files.
- ☐ `git status` reports a clean working tree.
- ☐ `git ls-files` contains no `target/` or IDE files.

## Common Mistakes

- Running `git init` in the wrong folder — check `pwd` first.
- Committing before writing `.gitignore`, so `target/` (after a build) gets tracked.
- Putting the README change into the feature commit.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Author identity unknown` | Set `user.name` and `user.email` |
| `nothing added to commit` | You forgot `git add` (or used `-a` with only new files) |
| Wrong message in the last commit | `git commit --amend -m "…"` (it isn't pushed yet) |
