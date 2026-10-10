# Lab 12 — Diagnose and Repair a Broken Java Repository

**Lab:** 12 · **Module:** Git Troubleshooting Playbook · **Difficulty:** Advanced · **Verification:** Tested

> [!NOTE]
> The break script and every repair step were run in the practice lab with Git 2.52 and Maven 3.9.12.

## Objective

Starting from a deliberately messy repository — an interrupted rebase with a conflict, a forgotten stash and a commit on `main` that breaks the build — diagnose the state with read-only commands, then repair it with the least destructive steps.

## Prerequisites

- Lessons: [Diagnosing Repository State](../../troubleshooting/diagnosing-repository-state/content.md), [git revert](../../undoing-and-recovery/git-revert/content.md), [git rebase](../../rebasing-and-rewriting/git-rebase/content.md), [git stash](../../undoing-and-recovery/git-stash/content.md).
- JDK 17+ and Maven.

## Scenario

Priya comes back from lunch to a terminal she doesn't remember. Something about a rebase, the build is red, and "I think I stashed something?".

## Steps

### Step 1: Break the repository

Save as `~/git-lab/break-gradebook.sh` and run it (it uses the setup script from [The Git Practice Lab](../../vcs-fundamentals/git-practice-lab/content.md)):

```bash
# Creates ~/git-lab/gradebook in a deliberately messy state for Lab 12.
set -e
bash ~/git-lab/setup-gradebook.sh > /dev/null
rm -rf ~/git-lab/remotes ~/git-lab/arjun
cd ~/git-lab/gradebook
printf 'target/\n.idea/\n*.iml\n*.log\n.env\n' > .gitignore
git init -q && git add . && git commit -qm "Create gradebook project"
git init -q --bare ~/git-lab/remotes/gradebook.git
git remote add origin ~/git-lab/remotes/gradebook.git
git push -q -u origin main
F=src/main/java/com/example/gradebook/GradeCalculator.java
# Priya: feature branch with two commits
git switch -q -c feature/strict-grades
sed -i "s/        if (average >= 75) return 'B';/        if (average >= 80) return 'B';/" $F
git commit -qam "Raise the B threshold to 80"
printf '\n## Grading scale\n\nA: 90+, B: 80+, C: 60+, F: below 60\n' >> README.md
git commit -qam "Document the stricter scale"
# Arjun: two commits on main, one breaks compilation
git clone -q ~/git-lab/remotes/gradebook.git ~/git-lab/arjun
cd ~/git-lab/arjun
sed -i "s/        if (average >= 75) return 'B';/        if (average >= 78) return 'B';/" $F
git -c user.name="Arjun Mehta" -c user.email=arjun@example.com commit -qam "Raise the B threshold to 78"
sed -i "s/        if (average >= 60) return 'C';/        if (average >= 60) return \"C\";/" $F
git -c user.name="Arjun Mehta" -c user.email=arjun@example.com commit -qam "Return grade C as text"
git push -q
# Priya: unfinished notes stashed, then a rebase that stops on a conflict
cd ~/git-lab/gradebook
echo "Ask Arjun about the B threshold" > TODO.txt
git stash push -q -u -m "todo note"
git fetch -q
git rebase origin/main > /dev/null 2>&1 || true
echo "gradebook is now in a messy state"
```

```bash
bash ~/git-lab/break-gradebook.sh
cd ~/git-lab/gradebook
```

**Output:**

```text
gradebook is now in a messy state
```

> [!IMPORTANT]
> From here on, **don't fix anything until Step 2 is finished.** Every command in Step 2 is read-only.

### Step 2: Diagnose

```bash
git status
```

**Output:**

```text
interactive rebase in progress; onto 77c9021
Last command done (1 command done):
   pick 490e507 # Raise the B threshold to 80
Next command to do (1 remaining command):
   pick 58c17d1 # Document the stricter scale
  (use "git rebase --edit-todo" to view and edit)
You are currently rebasing branch 'feature/strict-grades' on '77c9021'.
  (fix conflicts and then run "git rebase --continue")
  (use "git rebase --skip" to skip this patch)
  (use "git rebase --abort" to check out the original branch)

Unmerged paths:
  (use "git restore --staged <file>..." to unstage)
  (use "git add <file>..." to mark resolution)
	both modified:   src/main/java/com/example/gradebook/GradeCalculator.java

no changes added to commit (use "git add" and/or "git commit -a")
```

```bash
git stash list
git branch -vv
git log --oneline --graph --decorate --branches --remotes -8
git reflog -4
```

**Output:**

```text
stash@{0}: On feature/strict-grades: todo note
* (no branch, rebasing feature/strict-grades) 77c9021 Return grade C as text
  feature/strict-grades                       58c17d1 Document the stricter scale
  main                                        6e5aa8a [origin/main: behind 2] Create gradebook project
* 58c17d1 (feature/strict-grades) Document the stricter scale
* 490e507 Raise the B threshold to 80
| * 77c9021 (HEAD, origin/main, origin/HEAD) Return grade C as text
| * 2bedf9b Raise the B threshold to 78
|/  
* 6e5aa8a (main) Create gradebook project
77c9021 HEAD@{0}: rebase (start): checkout origin/main
58c17d1 HEAD@{1}: reset: moving to HEAD
58c17d1 HEAD@{2}: commit: Document the stricter scale
490e507 HEAD@{3}: commit: Raise the B threshold to 80
```

**Diagnosis:**

1. A rebase of `feature/strict-grades` onto `origin/main` is stopped at its first commit with a conflict.
2. There's a stash ("todo note") with work from the feature branch. (The reflog's `reset: moving to HEAD` is what `git stash` does to clean the tree.)
3. Local `main` is 2 behind `origin/main`, whose newest commit is "Return grade C as text" — suspicious for a red build.
4. Nothing is lost; no destructive step is needed.

**Plan:** abort the rebase (don't build a feature on a broken base), fix `main` first, then redo the rebase, then restore the stash.

### Step 3: Back out of the rebase

```bash
git rebase --abort
git status -sb
```

**Output:**

```text
## feature/strict-grades
```

### Step 4: Find the commit that breaks the build

```bash
git switch main
git pull --ff-only
mvn -B -q compile
git log --oneline -3
```

**Output:**

```text
Switched to branch 'main'
Your branch is behind 'origin/main' by 2 commits, and can be fast-forwarded.
  (use "git pull" to update your local branch)
Updating 6e5aa8a..77c9021
Fast-forward
 src/main/java/com/example/gradebook/GradeCalculator.java | 4 ++--
 1 file changed, 2 insertions(+), 2 deletions(-)
[ERROR] /home/student/git-lab/gradebook/src/main/java/com/example/gradebook/GradeCalculator.java:[21,35] incompatible types: java.lang.String cannot be converted to char
77c9021 Return grade C as text
2bedf9b Raise the B threshold to 78
6e5aa8a Create gradebook project
```

(The Maven line shown is the error line from the compiler output.) The newest commit returns `"C"` from a `char` method.

### Step 5: Repair main without rewriting it

```bash
git revert --no-edit HEAD
mvn -B -q verify; echo "build exit code: $?"
git push
```

**Output:**

```text
[main ce53d1e] Revert "Return grade C as text"
 Date: Thu Oct 1 10:14:00 2026 +0530
 1 file changed, 1 insertion(+), 1 deletion(-)
build exit code: 0
To /home/student/git-lab/remotes/gradebook.git
   77c9021..ce53d1e  main -> main
```

Tell Arjun; his change can return through a PR with a test.

### Step 6: Redo the rebase on the healthy main

```bash
git switch feature/strict-grades
git rebase main
```

**Output (conflict):**

```text
Auto-merging src/main/java/com/example/gradebook/GradeCalculator.java
CONFLICT (content): Merge conflict in src/main/java/com/example/gradebook/GradeCalculator.java
error: could not apply 490e507... Raise the B threshold to 80
```

```text
<<<<<<< HEAD
        if (average >= 78) return 'B';
=======
        if (average >= 80) return 'B';
>>>>>>> 490e507 (Raise the B threshold to 80)
```

In a rebase, `HEAD` is the new base (`main`: 78) and the other side is Priya's commit (80). This branch exists to make B stricter, so keep 80 — and raise the 78-vs-80 question in the pull request.

Edit the line to `if (average >= 80) return 'B';`, then:

```bash
git diff --check
git add src/main/java/com/example/gradebook/GradeCalculator.java
git rebase --continue
git log --oneline --graph --decorate -5
mvn -B -q verify; echo "build exit code: $?"
```

**Output:**

```text
[detached HEAD 8cc2c82] Raise the B threshold to 80
 1 file changed, 1 insertion(+), 1 deletion(-)
Successfully rebased and updated refs/heads/feature/strict-grades.
* 80a972f (HEAD -> feature/strict-grades) Document the stricter scale
* 8cc2c82 Raise the B threshold to 80
* ce53d1e (origin/main, origin/HEAD, main) Revert "Return grade C as text"
* 77c9021 Return grade C as text
* 2bedf9b Raise the B threshold to 78
build exit code: 0
```

(`git rebase --continue` may open your editor for the commit message; save it unchanged.)

### Step 7: Restore the forgotten work

```bash
git stash pop
git status --short
```

**Output (last line of `pop`, then status):**

```text
Dropped refs/stash@{0} (a2fe107b598bcd6df8448d6c65b6c02227145704)
?? TODO.txt
```

## Verification Checklist

- ☐ You wrote the diagnosis before running any state-changing command.
- ☐ `main` builds and was repaired with `git revert`, not reset.
- ☐ `feature/strict-grades` sits on top of the repaired `main` and builds.
- ☐ `TODO.txt` is back; `git stash list` is empty.
- ☐ No `--force` was used anywhere.

## Common Mistakes

- Resolving the rebase conflict first and building a feature on a broken `main`.
- `git reset --hard origin/main` on `main` "to clean up" — the problem is in `origin/main` itself.
- Forgetting the stash.
- Deleting the repository and re-cloning — which would lose the unpushed feature commits and the stash.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Ran `git rebase --continue` with markers left | `git reset --hard ORIG_HEAD` is risky here — prefer fixing the file in a new commit, or `git reflog` to return to the pre-rebase tip |
| `pull --ff-only` refuses | Local `main` has its own commits — inspect with `git log --oneline origin/main..main` |
| `stash pop` conflicts | Resolve, `git restore --staged <file>`, `git stash drop` |
