# Lab 08 — Stash Work and Switch Branches for a Hotfix

**Lab:** 08 · **Module:** Undoing Changes and Recovering Work · **Difficulty:** Beginner · **Verification:** Tested

## Objective

Shelve unfinished work (including a new file), fix an urgent issue on `main`, then return and restore the work exactly as it was.

## Prerequisites

- Lessons: [git stash](../../undoing-and-recovery/git-stash/content.md), [git switch and git checkout](../../branching-and-merging/git-switch-and-checkout/content.md).

## Scenario

Priya is half-way through `ClassReport` (a new file plus a README draft) when a teacher reports a confusing error message that must be fixed now.

## Steps

### Step 1: Starting state with work in progress

```bash
bash ~/git-lab/setup-gradebook.sh
cd ~/git-lab/gradebook
printf 'target/\n.idea/\n*.iml\n*.log\n.env\n' > .gitignore
git init -q && git add . && git commit -qm "Create gradebook project"
git switch -c feature/class-report
```

Create `ClassReport.java` (a class with a `// TODO` comment) and append "## Reports (draft)" to `README.md`.

```bash
git status --short
```

**Output:**

```text
 M README.md
?? src/main/java/com/example/gradebook/ClassReport.java
```

> [!WARNING]
> Switching branches now would **not** protect this work: in a test run, `git switch main` succeeded and carried the uncommitted changes onto `main` (`M	README.md` / `Switched to branch 'main'`) — where they could end up in the hotfix commit. Shelve them first.

### Step 2: Stash everything, including the new file

```bash
git stash push -u -m "class report WIP"
git status --short
git stash list
```

**Output:**

```text
Saved working directory and index state On feature/class-report: class report WIP
stash@{0}: On feature/class-report: class report WIP
```

`git status --short` printed nothing: the working tree is clean. Without `-u`, the new `ClassReport.java` would have stayed behind.

### Step 3: Hotfix on its own branch

```bash
git switch main
git switch -c fix/empty-marks-message
```

In `GradeCalculator.java`, change the message to `"at least one mark is required to compute an average"`.

```bash
git commit -am "Explain why an empty marks list is rejected"
git switch main
git merge --ff-only fix/empty-marks-message
```

**Output:**

```text
Switched to branch 'main'
Switched to a new branch 'fix/empty-marks-message'
[fix/empty-marks-message 257b7e6] Explain why an empty marks list is rejected
 1 file changed, 1 insertion(+), 1 deletion(-)
Switched to branch 'main'
Updating 1733eba..257b7e6
Fast-forward
 src/main/java/com/example/gradebook/GradeCalculator.java | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

(In a team you'd push the fix branch and open a PR instead of merging locally.)

### Step 4: Return and restore the work

```bash
git switch feature/class-report
git stash pop
git status --short
git stash list
```

**Output (`git stash pop`, last line, then status):**

```text
Dropped refs/stash@{0} (f6928e722351951222cb6eec10133d5aa10fc890)
 M README.md
?? src/main/java/com/example/gradebook/ClassReport.java
```

`git stash list` is empty again — everything is back exactly as before.

## Verification Checklist

- ☐ The hotfix commit on `main` touches only `GradeCalculator.java`.
- ☐ `ClassReport.java` and the README draft are back on `feature/class-report`, uncommitted.
- ☐ `git stash list` is empty.

## Common Mistakes

- Forgetting `-u`, so the new file stays in the working tree.
- Stashing without `-m` and later not knowing which stash is which.
- Using `git stash pop` on the wrong branch.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `stash pop` reports a conflict | Resolve, `git restore --staged <file>`, then `git stash drop` |
| Popped on the wrong branch | Stash again (`git stash push -u`), switch, pop |
| Accidentally dropped the stash | `git stash apply <id>` using the id printed by `Dropped …` |
