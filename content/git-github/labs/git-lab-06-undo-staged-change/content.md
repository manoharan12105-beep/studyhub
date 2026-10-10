# Lab 06 — Undo Staged and Unstaged Changes

**Lab:** 06 · **Module:** Undoing Changes and Recovering Work · **Difficulty:** Beginner · **Verification:** Tested

> [!CAUTION]
> Step 4 discards an unstaged edit with `git restore` — that can't be undone. It's deliberate here because the edit is a debug line.

## Objective

After an overly broad `git add .`, unstage what doesn't belong, discard a debug edit, commit only the intended change, and restore a broken file from history.

## Prerequisites

- Lessons: [git restore](../../undoing-and-recovery/git-restore/content.md), [git status and git add](../../basic-workflow/git-status-and-add/content.md).

## Scenario

Priya added a README note, a temporary `DEBUG` print in `App.java`, and personal `notes.txt`, then ran `git add .`. Only the README change should be committed.

## Steps

### Step 1: Starting state

```bash
bash ~/git-lab/setup-gradebook.sh
cd ~/git-lab/gradebook
printf 'target/\n.idea/\n*.iml\n*.log\n.env\n' > .gitignore
git init -q && git add . && git commit -qm "Create gradebook project"
```

### Step 2: Make the mess

Append "Gradebook is maintained by the assessment team." to `README.md`; add `System.out.println("DEBUG " + average);` after the `average` line in `App.java`; create `notes.txt`. Then:

```bash
git add .
git status --short
```

**Output:**

```text
M  README.md
A  notes.txt
M  src/main/java/com/example/gradebook/App.java
```

### Step 3: Unstage the personal file and ignore it locally

```bash
git restore --staged notes.txt
echo "notes.txt" >> .git/info/exclude
git status --short
```

**Output:**

```text
M  README.md
M  src/main/java/com/example/gradebook/App.java
```

**Explanation:** `.git/info/exclude` ignores files for this clone only — right for personal files.

### Step 4: Unstage and discard the debug line

```bash
git diff --staged src/main/java/com/example/gradebook/App.java
```

**Output:**

```text
diff --git a/src/main/java/com/example/gradebook/App.java b/src/main/java/com/example/gradebook/App.java
index 49c1f6d..8ce6e55 100644
--- a/src/main/java/com/example/gradebook/App.java
+++ b/src/main/java/com/example/gradebook/App.java
@@ -4,6 +4,7 @@ public class App {
     public static void main(String[] args) {
         GradeCalculator calculator = new GradeCalculator();
         double average = calculator.average(82, 91, 77);
+        System.out.println("DEBUG " + average);
         System.out.printf("Average: %.2f, grade: %c%n", average, calculator.letterGrade(average));
     }
 }
```

```bash
git restore --staged src/main/java/com/example/gradebook/App.java
git status --short
git restore src/main/java/com/example/gradebook/App.java
git status --short
```

**Output:**

```text
M  README.md
 M src/main/java/com/example/gradebook/App.java
M  README.md
```

**Explanation:** first unstaged (right column), then discarded entirely.

### Step 5: Commit only the intended change

```bash
git commit -m "Name the maintaining team in README"
```

**Output:**

```text
[main e9672aa] Name the maintaining team in README
 1 file changed, 2 insertions(+)
```

### Step 6: Restore a broken file from history

Overwrite `pom.xml` with garbage (`echo "broken" > pom.xml`), then:

```bash
git status --short
git restore --source=HEAD~1 pom.xml
git status --short
```

**Output:**

```text
 M pom.xml
```

The second `git status --short` prints nothing: `pom.xml` is back exactly as in the previous commit.

## Verification Checklist

- ☐ The commit contains only `README.md`.
- ☐ `notes.txt` still exists on disk but doesn't appear in `git status`.
- ☐ `App.java` has no debug line.
- ☐ `pom.xml` is restored and the tree is clean.

## Common Mistakes

- `git restore App.java` while the debug edit is staged — it restores from the index, so the staged debug line survives. Unstage first, or use `git restore --staged --worktree`.
- `git reset --hard` to clean up — it would also discard the README change.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Committed the debug line anyway (not pushed) | Remove it, `git commit --amend --no-edit` |
| `git restore` isn't a command | Git older than 2.23 — use `git reset HEAD <file>` and `git checkout -- <file>` |
