# Lab 05 — Rebase a Feature Branch Safely

**Lab:** 05 · **Module:** Rebasing and History Rewriting · **Difficulty:** Intermediate · **Verification:** Tested

> [!CAUTION]
> This lab rewrites the history of a pushed branch. Do it only in `~/git-lab`, and on real projects only for branches nobody else uses.

## Objective

Rebase a pushed feature branch onto an updated `main` with a safety backup, prove nothing but the base changed, and publish the result with `--force-with-lease`.

## Prerequisites

- Lessons: [git rebase](../../rebasing-and-rewriting/git-rebase/content.md), [Rewriting History Safely](../../rebasing-and-rewriting/rewriting-history-safely/content.md).

## Scenario

Priya's `feature/class-report` (already pushed for early feedback) is behind `main`. She wants a linear history before opening the pull request.

## Steps

### Step 1: Starting state with a remote

```bash
bash ~/git-lab/setup-gradebook.sh
cd ~/git-lab/gradebook
printf 'target/\n.idea/\n*.iml\n*.log\n.env\n' > .gitignore
git init -q && git add . && git commit -qm "Create gradebook project"
git init -q --bare ~/git-lab/remotes/gradebook.git
git remote add origin ~/git-lab/remotes/gradebook.git
git push -q -u origin main
```

### Step 2: Feature commits, pushed

```bash
git switch -c feature/class-report
```

Create `src/main/java/com/example/gradebook/ClassReport.java` containing an empty `public class ClassReport { }` in package `com.example.gradebook`, then:

```bash
git add -A
git commit -m "Add ClassReport skeleton"
```

Append a "Reports" section to `README.md`, then:

```bash
git commit -am "Document ClassReport"
git push -q -u origin feature/class-report
```

### Step 3: main moves on

```bash
git switch main
```

Change the B threshold to 78 in `GradeCalculator.java`.

```bash
git commit -am "Raise the B threshold to 78"
git push -q
git log --oneline --graph --decorate --all
```

**Output (graph):**

```text
* 94c08c3 (HEAD -> main, origin/main) Raise the B threshold to 78
| * 863af5c (origin/feature/class-report, feature/class-report) Document ClassReport
| * fcbe371 Add ClassReport skeleton
|/  
* 1733eba Create gradebook project
```

### Step 4: Back up, then rebase

```bash
git switch feature/class-report
git branch backup/class-report
git rebase main
git log --oneline --graph --decorate --all
```

**Output (final rebase line, then the graph):**

```text
Successfully rebased and updated refs/heads/feature/class-report.
* f68e306 (HEAD -> feature/class-report) Document ClassReport
* 8adff2c Add ClassReport skeleton
* 94c08c3 (origin/main, main) Raise the B threshold to 78
| * 863af5c (origin/feature/class-report, backup/class-report) Document ClassReport
| * fcbe371 Add ClassReport skeleton
|/  
* 1733eba Create gradebook project
```

**Explanation:** two new commits (`8adff2c`, `f68e306`) replace the old ones; the backup and the remote still point at the old commits.

### Step 5: Prove only the base changed

```bash
git diff backup/class-report HEAD --stat
git range-diff backup/class-report~2..backup/class-report HEAD~2..HEAD
```

**Output:**

```text
 src/main/java/com/example/gradebook/GradeCalculator.java | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
1:  fcbe371 = 1:  8adff2c Add ClassReport skeleton
2:  863af5c = 2:  f68e306 Document ClassReport
```

The only content difference is `main`'s threshold change, and `range-diff` shows each rebased commit is identical (`=`) to its original.

### Step 6: Publish safely

```bash
git status -sb
git push
```

**Output:**

```text
## feature/class-report...origin/feature/class-report [ahead 3, behind 2]
To /home/student/git-lab/remotes/gradebook.git
 ! [rejected]        feature/class-report -> feature/class-report (non-fast-forward)
error: failed to push some refs to '/home/student/git-lab/remotes/gradebook.git'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart. If you want to integrate the remote changes,
hint: use 'git pull' before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
```

Don't follow the `git pull` hint — it would merge the old commits back. The branch is Priya's alone:

```bash
git push --force-with-lease
git status -sb
git branch -D backup/class-report
```

**Output:**

```text
To /home/student/git-lab/remotes/gradebook.git
 + 863af5c...f68e306 feature/class-report -> feature/class-report (forced update)
## feature/class-report...origin/feature/class-report
Deleted branch backup/class-report (was 863af5c).
```

## Verification Checklist

- ☐ `git log --oneline main..feature/class-report` lists exactly the two feature commits.
- ☐ `range-diff` showed `=` for both commits.
- ☐ The push used `--force-with-lease`, not `--force`.
- ☐ The backup branch was deleted only after verification.

## Common Mistakes

- Running `git pull` after the rejected push.
- Rebasing a branch a teammate has checked out.
- Deleting the backup before comparing.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Conflict during rebase | Resolve, `git add`, `git rebase --continue` (or `--abort`) |
| Rebase went wrong | `git reset --hard backup/class-report` (or `ORIG_HEAD`) |
| Lease rejected as `stale info` | Someone pushed; fetch and inspect before trying again |
