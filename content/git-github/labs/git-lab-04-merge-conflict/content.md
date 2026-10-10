# Lab 04 — Resolve a Deliberately Created Merge Conflict

**Lab:** 04 · **Module:** Branching and Merging · **Difficulty:** Beginner · **Verification:** Tested

## Objective

Create a real conflict, read the markers (with and without the merge base), back out once, then resolve it correctly and record the decision in the merge commit.

## Prerequisites

- Lesson: [Merge Conflicts](../../branching-and-merging/merge-conflicts/content.md).

## Scenario

Arjun wants a stricter B grade (80); Priya already changed it to 78 on `main`. The team agrees in issue #31 to keep 78.

## Steps

### Step 1: Starting state

```bash
bash ~/git-lab/setup-gradebook.sh
cd ~/git-lab/gradebook
printf 'target/\n.idea/\n*.iml\n*.log\n.env\n' > .gitignore
git init -q && git add . && git commit -qm "Create gradebook project"
```

### Step 2: Change the B threshold on a branch

```bash
git switch -c feature/strict-b
```

In `GradeCalculator.java`, change `average >= 75` (the B line) to `average >= 80`.

```bash
git commit -am "Raise the B threshold to 80"
```

**Output:**

```text
Switched to a new branch 'feature/strict-b'
[feature/strict-b f9b2f45] Raise the B threshold to 80
 1 file changed, 1 insertion(+), 1 deletion(-)
```

### Step 3: Change the same line differently on main

```bash
git switch main
```

Change the B line to `average >= 78`.

```bash
git commit -am "Raise the B threshold to 78"
```

**Output:**

```text
Switched to branch 'main'
[main cb791b1] Raise the B threshold to 78
 1 file changed, 1 insertion(+), 1 deletion(-)
```

### Step 4: Merge and read the conflict

```bash
git merge feature/strict-b
git status --short
```

**Output:**

```text
Auto-merging src/main/java/com/example/gradebook/GradeCalculator.java
CONFLICT (content): Merge conflict in src/main/java/com/example/gradebook/GradeCalculator.java
Automatic merge failed; fix conflicts and then commit the result.
UU src/main/java/com/example/gradebook/GradeCalculator.java
```

`UU` = unmerged, modified by both. The file:

```text
    public char letterGrade(double average) {
        if (average >= 90) return 'A';
<<<<<<< HEAD
        if (average >= 78) return 'B';
=======
        if (average >= 80) return 'B';
>>>>>>> feature/strict-b
        if (average >= 60) return 'C';
        return 'F';
```

### Step 5: Back out, then retry showing the base

```bash
git merge --abort
git status --short
git config merge.conflictStyle zdiff3
git merge feature/strict-b
```

**Expected result:** after `--abort`, `git status --short` prints nothing — you're back before the merge. The second merge conflicts again, now with the base:

```text
<<<<<<< HEAD
        if (average >= 78) return 'B';
||||||| 1733eba
        if (average >= 75) return 'B';
=======
        if (average >= 80) return 'B';
>>>>>>> feature/strict-b
```

**Explanation:** the base (75) shows both sides raised the threshold — a policy decision, not a typo.

### Step 6: Resolve, verify, commit

Edit the file so the B line is `if (average >= 78) return 'B';`, remove every marker, and update the Javadoc to "B for 78+".

```bash
git diff --check
git add src/main/java/com/example/gradebook/GradeCalculator.java
git status
```

**Output (`git diff --check` prints nothing; then):**

```text
On branch main
All conflicts fixed but you are still merging.
  (use "git commit" to conclude merge)

Changes to be committed:
	modified:   src/main/java/com/example/gradebook/GradeCalculator.java

```

```bash
git commit -m "Merge feature/strict-b: keep 78 as agreed in issue #31"
git log --oneline --graph -4
```

**Output:**

```text
[main ae600ce] Merge feature/strict-b: keep 78 as agreed in issue #31
*   ae600ce Merge feature/strict-b: keep 78 as agreed in issue #31
|\  
| * f9b2f45 Raise the B threshold to 80
* | cb791b1 Raise the B threshold to 78
|/  
* 1733eba Create gradebook project
```

If you have Maven, run `mvn -B verify` before committing.

## Verification Checklist

- ☐ No `<<<<<<<`, `|||||||`, `=======` or `>>>>>>>` lines remain (`git diff --check` is silent).
- ☐ The merge commit has two parents and a message recording the decision.
- ☐ You can explain what `||||||| 1733eba` showed.

## Common Mistakes

- Keeping both B lines (the second is dead code).
- Leaving the Javadoc saying "75+".
- Committing without building.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `error: Committing is not possible because you have unmerged files` | `git add` the resolved file first |
| Want to start over mid-resolution | `git merge --abort` |
| Editor opened for the merge message | Write the decision, save, close |
