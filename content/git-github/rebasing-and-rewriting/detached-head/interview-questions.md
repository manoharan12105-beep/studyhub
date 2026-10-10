# Detached HEAD — Interview Questions

## Beginner

### Q1. What is a detached HEAD?

**Style:** What

<details>
<summary>Answer</summary>

A state where `HEAD` points directly at a commit instead of at a branch. It happens when you check out a commit hash, a tag or a remote-tracking branch, and temporarily during rebases and bisects.

</details>

### Q2. How do you get out of detached HEAD?

**Style:** How

<details>
<summary>Answer</summary>

Switch to a branch: `git switch main` (or `git switch -` to go back). If you made commits you want to keep, first create a branch at them: `git switch -c <new-branch>`.

</details>

## Intermediate

### Q3. What happens to commits made in detached HEAD if you switch to another branch?

**Style:** What happens if

<details>
<summary>Answer</summary>

They aren't on any branch, so nothing references them except the reflog. Git warns "you are leaving N commits behind". They can be rescued with `git branch <name> <hash>` (the hash is in the warning and the reflog) until garbage collection prunes them.

</details>

## Advanced

### Q4. Why is CI often in detached HEAD?

**Style:** Why

<details>
<summary>Answer</summary>

CI systems build an exact commit (for a push or a pull request's merge commit), so they check out that commit directly rather than a local branch. This guarantees the build is of that specific snapshot; it's harmless because CI doesn't create commits to keep (and if a job needs the branch name, it reads it from the CI environment).

</details>
