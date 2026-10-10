# Branches: Movable Pointers to Commits — Interview Questions

## Beginner

### Q1. What is a branch in Git?

**Style:** What

<details>
<summary>Answer</summary>

A lightweight, movable pointer to a commit, stored as a ref (a file under `.git/refs/heads/` containing a commit id). When you commit on the branch, Git moves the pointer to the new commit. It is not a copy of the files.

</details>

### Q2. Why should you create a branch for each task?

**Style:** Why

<details>
<summary>Answer</summary>

It isolates the work: `main` stays stable, several tasks can proceed in parallel, a branch can be reviewed as a pull request, and an abandoned idea can be deleted without affecting anything else. Branches cost almost nothing to create.

</details>

## Intermediate

### Q3. What's the difference between `git branch -d` and `git branch -D`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`-d` deletes a branch only if its commits are already merged into the current branch (or its upstream); otherwise it refuses with "not fully merged". `-D` deletes regardless, which can leave unique commits unreachable — recoverable only through the reflog until garbage collection.

</details>

### Q4. Why are Git branches cheaper than SVN branches?

**Style:** Comparison

<details>
<summary>Answer</summary>

A Git branch is a single ref containing a commit id, created locally and instantly. An SVN branch is a server-side copy of a directory tree (cheap copy on the server, but still a server operation and a new path in the repository), and switching requires talking to the server.

</details>

## Advanced

### Q5. You deleted a branch with `-D` and need it back. How?

**Style:** Scenario

<details>
<summary>Answer</summary>

The deletion message prints the tip (`Deleted branch x (was 1a2b3c4).`). Recreate it with `git branch x 1a2b3c4`. If you lost that output, find the commit in `git reflog` (the entry where you last were on the branch or committed on it) and create the branch at that hash. This works until the unreachable commits are pruned.

</details>
