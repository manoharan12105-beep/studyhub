# Lab 07 — Recover Commits with the Reflog

**Lab:** 07 · **Module:** Undoing Changes and Recovering Work · **Difficulty:** Intermediate · **Verification:** Tested

> [!CAUTION]
> This lab runs `git reset --hard` and `git branch -D` on purpose. Only in `~/git-lab`.

## Objective

"Lose" two commits with a hard reset and a branch with a forced delete, then recover both from the reflog.

## Prerequisites

- Lessons: [git reset](../../undoing-and-recovery/git-reset/content.md), [git reflog](../../undoing-and-recovery/git-reflog/content.md).

## Scenario

Late in the day Priya meant to type `git reset --soft HEAD~1` but typed `git reset --hard HEAD~2`. Then, cleaning up, she force-deleted an unmerged spike branch.

## Steps

### Step 1: Starting state with two extra commits

```bash
bash ~/git-lab/setup-gradebook.sh
cd ~/git-lab/gradebook
printf 'target/\n.idea/\n*.iml\n*.log\n.env\n' > .gitignore
git init -q && git add . && git commit -qm "Create gradebook project"
```

Change the B threshold to 78 and commit "Raise the B threshold to 78"; add a grading-scale section to `README.md` and commit "Document the grading scale".

```bash
git log --oneline
```

**Output:**

```text
58f760d Document the grading scale
85bf3f4 Raise the B threshold to 78
1733eba Create gradebook project
```

### Step 2: The mistake

```bash
git reset --hard HEAD~2
git log --oneline
```

**Output:**

```text
HEAD is now at 1733eba Create gradebook project
1733eba Create gradebook project
```

### Step 3: Read the reflog

```bash
git reflog -4
```

**Output:**

```text
1733eba HEAD@{0}: reset: moving to HEAD~2
58f760d HEAD@{1}: commit: Document the grading scale
85bf3f4 HEAD@{2}: commit: Raise the B threshold to 78
1733eba HEAD@{3}: commit (initial): Create gradebook project
```

**Explanation:** `HEAD@{1}` is where HEAD was just before the reset.

### Step 4: Recover

First run `git status` and make sure nothing uncommitted would be overwritten (here it reports a clean tree). Then:

```bash
git reset --hard HEAD@{1}
git log --oneline
```

**Output:**

```text
HEAD is now at 58f760d Document the grading scale
58f760d Document the grading scale
85bf3f4 Raise the B threshold to 78
1733eba Create gradebook project
```

### Step 5: Lose and recover a branch

```bash
git switch -c spike/csv-export
echo "name,average,grade" > export-sample.csv
git add export-sample.csv
git commit -m "Sketch CSV export format"
git switch main
git branch -d spike/csv-export
```

**Output (last command):**

```text
error: the branch 'spike/csv-export' is not fully merged
hint: If you are sure you want to delete it, run 'git branch -D spike/csv-export'
hint: Disable this message with "git config set advice.forceDeleteBranch false"
```

Ignore the warning (on purpose):

```bash
git branch -D spike/csv-export
git reflog -3
```

**Output:**

```text
Deleted branch spike/csv-export (was 7478474).
58f760d HEAD@{0}: checkout: moving from spike/csv-export to main
7478474 HEAD@{1}: commit: Sketch CSV export format
58f760d HEAD@{2}: checkout: moving from main to spike/csv-export
```

```bash
git branch spike/csv-export HEAD@{1}
git log --oneline -1 spike/csv-export
```

**Output:**

```text
7478474 Sketch CSV export format
```

## Verification Checklist

- ☐ `main` again has three commits.
- ☐ `spike/csv-export` exists and contains "Sketch CSV export format".
- ☐ You can explain why an uncommitted edit lost to `reset --hard` would **not** be recoverable.

## Common Mistakes

- Recovering with `reset --hard` while having new uncommitted work — check `git status` first, or recover into a new branch (`git branch rescue HEAD@{1}`).
- Reading `HEAD@{n}` numbers from an old reflog listing — they shift with every move; use the hash.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Can't find the commit in `git reflog` | Try `git reflog show <branch>` or `git fsck --unreachable --no-reflogs` |
| Recovered to the wrong entry | Run `git reflog` again — the bad recovery is itself logged; reset to the right hash |
