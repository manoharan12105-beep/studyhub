# git switch and git checkout — Interview Questions

## Beginner

### Q1. How do you create a new branch and switch to it in one command?

**Style:** How

<details>
<summary>Answer</summary>

`git switch -c <name>` (Git 2.23+), or the older `git checkout -b <name>`. Both create the branch at the current commit unless you give a start point.

</details>

## Intermediate

### Q2. What's the difference between `git switch` and `git checkout`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`git checkout` has two jobs: switching branches and restoring files (`git checkout -- file`). Git 2.23 split them into `git switch` (branches only) and `git restore` (files only). `switch` also refuses to detach HEAD unless you pass `--detach`, avoiding accidental detached states.

</details>

### Q3. What happens to uncommitted changes when you switch branches?

**Style:** What happens if

<details>
<summary>Answer</summary>

They aren't attached to any branch. If the files you changed are the same on both branches, the changes carry over to the new branch. If the target branch has a different version of a changed file, Git refuses ("would be overwritten by checkout") and changes nothing — commit or stash first.

</details>

## Advanced

### Q4. Why is `git checkout README.md` dangerous?

**Style:** Trap

<details>
<summary>Answer</summary>

If there's no branch called `README.md`, Git treats it as a path and overwrites the file with the index version, discarding unstaged edits without confirmation — and those edits were never committed, so Git can't recover them. `git restore README.md` does the same thing but at least states the intent; looking at a file should use `git show`.

</details>
