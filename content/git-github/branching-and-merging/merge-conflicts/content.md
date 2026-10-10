# Merge Conflicts: Markers, Resolution and Aborting

**Module:** Branching and Merging · **Interview priority:** Core

## Learning Objectives

- Recognise a merge conflict and read Git's conflict markers.
- Resolve a conflict manually, mark it resolved and complete the merge.
- Abort a merge safely, and use `--ours`/`--theirs` and the `zdiff3` style when they help.

## What Is It?

A **merge conflict** happens when both branches changed the **same lines** (or one changed a file the other deleted) in different ways since the merge base. Git can't decide which version is right, so it stops, writes both versions into the file between **conflict markers**, and waits for you.

## Why It Matters

Conflicts are normal in team work, not a sign that something broke. What matters is resolving them **correctly** — keeping both people's intent — rather than blindly picking one side and silently deleting a colleague's change.

## How It Works

On `main`, Priya raised the B threshold to 78. On `feature/strict-b`, Arjun raised it to 80. Both changed the same line:

```bash
git merge feature/strict-b
```

**Output:**

```text
Auto-merging src/main/java/com/example/gradebook/GradeCalculator.java
CONFLICT (content): Merge conflict in src/main/java/com/example/gradebook/GradeCalculator.java
Automatic merge failed; fix conflicts and then commit the result.
```

```bash
git status
```

**Output:**

```text
On branch main
You have unmerged paths.
  (fix conflicts and run "git commit")
  (use "git merge --abort" to abort the merge)

Unmerged paths:
  (use "git add <file>..." to mark resolution)
	both modified:   src/main/java/com/example/gradebook/GradeCalculator.java

no changes added to commit (use "git add" and/or "git commit -a")
```

## Conflict Markers

The file now contains:

```text
    public char letterGrade(double average) {
        if (average >= 90) return 'A';
<<<<<<< HEAD
        if (average >= 78) return 'B';
=======
        if (average >= 80) return 'B';
>>>>>>> feature/strict-b
        if (average >= 60) return 'C';
        if (average >= 50) return 'D';
        return 'F';
    }
}
```

| Marker | Meaning |
|--------|---------|
| `<<<<<<< HEAD` | Start of **our** version (the branch you're on) |
| `=======` | Separator |
| `>>>>>>> feature/strict-b` | End of **their** version (the branch being merged) |

Lines outside the markers merged cleanly. The file won't compile until you remove the markers.

### Seeing the base too: zdiff3

With `git config --global merge.conflictStyle zdiff3`, Git also shows the base version:

```text
<<<<<<< HEAD
        if (average >= 78) return 'B';
||||||| 5f12141
        if (average >= 75) return 'B';
=======
        if (average >= 80) return 'B';
>>>>>>> feature/strict-b
```

Now it's clear: the original was 75, and each side raised it differently. Many developers enable `zdiff3` permanently because the base explains *what each side intended*.

## Resolving

1. **Understand both changes.** Read the commits: `git log --merge --oneline` lists the commits on both sides that touch the conflicted files; `git show` each one.
2. **Edit the file** to the correct result — here the team agreed on 78, and the Javadoc must say so too. Delete every marker line.
3. **Check no markers remain:** `grep -n '<<<<<<<\|>>>>>>>' <file>` (or `git diff --check`).
4. **Build and test.**
5. **Mark resolved** with `git add <file>`.
6. **Commit** to complete the merge.

```bash
git add src/main/java/com/example/gradebook/GradeCalculator.java
git status
```

**Output:**

```text
On branch main
All conflicts fixed but you are still merging.
  (use "git commit" to conclude merge)

Changes to be committed:
	modified:   src/main/java/com/example/gradebook/GradeCalculator.java

```

```bash
git commit --no-edit
```

**Output:**

```text
[main 2f81d5b] Merge branch 'feature/strict-b'
```

> [!TIP]
> When the resolution was a decision ("kept 78, agreed in #31"), write it in the merge commit message instead of using `--no-edit`. Future readers of `git log` will thank you.

## Taking One Side for a Whole File

For a file where one version should win entirely (a generated file, a lock file):

```bash
git checkout --ours  path/to/file     # keep the current branch's version
git checkout --theirs path/to/file    # keep the merged branch's version
git add path/to/file
```

Captured on a conflict where `HEAD` had 72 and the other branch had 70:

**Output:**

```text
Updated 1 path from the index
        if (average >= 70) return 'B';
Updated 1 path from the index
        if (average >= 72) return 'B';
```

(`--theirs` gave 70, then `--ours` gave 72.) `git restore --ours/--theirs <file>` does the same. Use this only when you're sure the other side's changes to that file are not needed.

> [!WARNING]
> During a **rebase**, "ours" and "theirs" are swapped: "ours" is the branch you're rebasing **onto**, "theirs" is your commit being replayed. See [Rebase](../../rebasing-and-rewriting/git-rebase/content.md).

## Aborting

```bash
git merge --abort
```

Returns the working directory and index to their state before `git merge`. Run it when the conflict is bigger than expected and you want to rethink (rebase first, talk to the other author, or merge a smaller piece). Commit or stash your own changes **before** starting a merge — `--abort` can't always reconstruct uncommitted changes that were present when the merge began.

## Under the Hood: Index Stages

During a conflict the index holds up to three versions of the file:

```bash
git ls-files -u
```

**Output:**

```text
100644 c4a23d748de3f55b10a574644b427b2a6ecaaac4 1	src/main/java/com/example/gradebook/GradeCalculator.java
100644 b9890ae03ba3e115668706b6bafa7fe46dcef5cd 2	src/main/java/com/example/gradebook/GradeCalculator.java
100644 336df8b8da93addee54c7f5b66c6aeb3f15b0cd9 3	src/main/java/com/example/gradebook/GradeCalculator.java
```

Stage 1 = base, 2 = ours, 3 = theirs. `git show :1:<path>` prints the base version. `git add` replaces the three stages with the single resolved version (stage 0) — that is what "mark resolved" means.

## Other Kinds of Conflict

| `git status` says | Situation | Resolution |
|-------------------|-----------|------------|
| `both modified` | Same lines changed | Edit, `git add` |
| `deleted by them` / `deleted by us` | One side deleted the file, the other modified it | Keep (`git add`) or delete (`git rm`) |
| `both added` | Both created a file with the same path | Merge the contents, `git add` |

IDEs (IntelliJ IDEA's merge tool, VS Code's merge editor) show the three versions side by side; `git mergetool` launches a configured tool. They edit the same file — you still decide.

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git merge --abort` | Cancel the merge | Changes local state (restores pre-merge state) |
| `git diff` | During a conflict, shows the combined diff of the conflicted files | Safe anywhere |
| `git log --merge` | Commits involved in the conflict | Safe anywhere |
| `git checkout --ours/--theirs <file>` | Take one side's whole file | **Practice repository first** — discards the other side |
| `git add <file>` | Mark resolved | Changes local state |

## Common Mistakes

- **Committing conflict markers.** Run `git diff --check` or grep before `git add`; CI compilation also catches them in Java.
- **"Accept mine" for everything** — silently deleting a teammate's change.
- **Resolving without building.** The text can be merged and still be wrong.
- **Panicking and deleting the repository.** `git merge --abort` is always available before you commit.

## Interview Angle

"How do you resolve a merge conflict?" — inspect with `git status`, understand both sides (log/show, base via zdiff3), edit to the correct combined result, remove markers, build/test, `git add`, `git commit`; `git merge --abort` to back out. Mention that clean merges can still be semantically wrong.

## Recap

- Conflicts arise when both sides change the same lines differently since the merge base.
- Markers: `<<<<<<< HEAD` ours, `=======`, `>>>>>>> branch` theirs; `|||||||` base with zdiff3.
- Resolve → remove markers → test → `git add` → `git commit`.
- `git merge --abort` returns to the pre-merge state; in rebases, ours/theirs swap.

## Related Topics

- [Merging Branches](../merging-branches/content.md)
- [Resolving Rebase Conflicts](../../rebasing-and-rewriting/git-rebase/content.md)
- [Lab 04 — Resolve a Merge Conflict](../../labs/git-lab-04-merge-conflict/content.md)
