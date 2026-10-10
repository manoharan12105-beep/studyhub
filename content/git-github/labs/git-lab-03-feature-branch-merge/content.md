# Lab 03 — Create a Feature Branch and Merge It

**Lab:** 03 · **Module:** Branching and Merging · **Difficulty:** Beginner · **Verification:** Tested

## Objective

Develop a feature on a branch, merge it as a fast-forward, then produce and read a three-way merge — and clean up merged branches.

## Prerequisites

- Lessons: [Branches](../../branching-and-merging/branches-fundamentals/content.md), [Merging Branches](../../branching-and-merging/merging-branches/content.md).

## Scenario

Priya adds a `ClassReport` class on a branch. Later, while a documentation branch is open, she changes the B threshold on `main`, so the two lines of work diverge.

## Steps

### Step 1: Starting state

```bash
bash ~/git-lab/setup-gradebook.sh
cd ~/git-lab/gradebook
printf 'target/\n.idea/\n*.iml\n*.log\n.env\n' > .gitignore
git init -q && git add . && git commit -qm "Create gradebook project"
```

### Step 2: Feature branch and commit

```bash
git switch -c feature/class-report
```

Create `src/main/java/com/example/gradebook/ClassReport.java`:

```java
package com.example.gradebook;

public class ClassReport {

    private final GradeCalculator calculator = new GradeCalculator();

    public String line(String name, int... marks) {
        double average = calculator.average(marks);
        return name + ": " + calculator.letterGrade(average);
    }
}
```

```bash
git add src/main/java/com/example/gradebook/ClassReport.java
git commit -m "Add ClassReport with one line per student"
```

**Output:**

```text
Switched to a new branch 'feature/class-report'
[feature/class-report c811d3e] Add ClassReport with one line per student
 1 file changed, 11 insertions(+)
 create mode 100644 src/main/java/com/example/gradebook/ClassReport.java
```

### Step 3: Fast-forward merge

```bash
git switch main
git merge feature/class-report
git log --oneline --graph --decorate --all
git branch -d feature/class-report
```

**Output:**

```text
Switched to branch 'main'
Updating 1733eba..c811d3e
Fast-forward
 src/main/java/com/example/gradebook/ClassReport.java | 11 +++++++++++
 1 file changed, 11 insertions(+)
 create mode 100644 src/main/java/com/example/gradebook/ClassReport.java
* c811d3e (HEAD -> main, feature/class-report) Add ClassReport with one line per student
* 1733eba Create gradebook project
Deleted branch feature/class-report (was c811d3e).
```

**Explanation:** `main` had no new commits, so it simply moved forward. No merge commit.

### Step 4: Diverge, then a three-way merge

```bash
git switch -c docs/readme-report
```

Append to `README.md` a "Reports" section, then:

```bash
git commit -am "Document ClassReport in README"
git switch main
```

In `GradeCalculator.java` change `average >= 75` to `average >= 78` for the B grade, then:

```bash
git commit -am "Raise the B threshold to 78"
git log --oneline --graph --decorate --all
```

**Output:**

```text
[docs/readme-report 444d230] Document ClassReport in README
 1 file changed, 4 insertions(+)
Switched to branch 'main'
[main c1c2b26] Raise the B threshold to 78
 1 file changed, 1 insertion(+), 1 deletion(-)
* c1c2b26 (HEAD -> main) Raise the B threshold to 78
| * 444d230 (docs/readme-report) Document ClassReport in README
|/  
* c811d3e Add ClassReport with one line per student
* 1733eba Create gradebook project
```

```bash
git merge --no-edit docs/readme-report
git log --oneline --graph --decorate -5
git branch -d docs/readme-report
git branch
```

**Output:**

```text
Merge made by the 'ort' strategy.
 README.md | 4 ++++
 1 file changed, 4 insertions(+)
*   27d7920 (HEAD -> main) Merge branch 'docs/readme-report'
|\  
| * 444d230 (docs/readme-report) Document ClassReport in README
* | c1c2b26 Raise the B threshold to 78
|/  
* c811d3e Add ClassReport with one line per student
* 1733eba Create gradebook project
Deleted branch docs/readme-report (was 444d230).
* main
```

**Explanation:** both branches had new commits, so Git combined them from their merge base `c811d3e` and recorded merge commit `27d7920` with two parents. Different files changed, so there was no conflict.

## Verification Checklist

- ☐ You can point to the fast-forward (no merge commit) and the three-way merge (`27d7920`).
- ☐ `git cat-file -p HEAD` shows two `parent` lines.
- ☐ `git branch` lists only `main`.

## Common Mistakes

- Merging while on the feature branch (merges `main` into it instead).
- Using `git branch -D` instead of `-d` for cleanup.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| An editor opens during the merge | Save the default message, or use `--no-edit` |
| `not fully merged` when deleting | You haven't merged that branch into the current one — check with `git log main..<branch>` |
