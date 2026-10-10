# git stash: Shelving Work in Progress — Interview Questions

## Beginner

### Q1. What is `git stash` used for?

**Style:** What

<details>
<summary>Answer</summary>

To temporarily save uncommitted changes and clean the working directory, so you can switch branches, pull, or handle an urgent fix, then re-apply the changes later with `git stash pop` or `apply`.

</details>

### Q2. What's the difference between `git stash apply` and `git stash pop`?

**Style:** Comparison

<details>
<summary>Answer</summary>

Both re-apply a stash. `apply` keeps it in the stash list; `pop` removes it afterwards — but only if it applied without conflicts. Use `apply` when you may need the same changes again.

</details>

## Intermediate

### Q3. Your stash didn't include a new file. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

By default stash saves only changes to tracked files. Untracked files need `git stash push -u` (or `-a` to include ignored files too). Staged new files are tracked, so they are included.

</details>

### Q4. What happens if `git stash pop` causes a conflict?

**Style:** What happens if

<details>
<summary>Answer</summary>

Git applies what it can, marks the conflicted files (labels "Updated upstream" and "Stashed changes"), and keeps the stash entry. You resolve the files, unstage or stage them as needed, and run `git stash drop` once satisfied — or `git stash branch` to apply it on its original base instead.

</details>

## Advanced

### Q5. When is a WIP commit better than a stash?

**Style:** Trade-off

<details>
<summary>Answer</summary>

When the work will sit for more than a short interruption, needs to move to another machine, or should be backed up: a commit on a feature branch can be pushed, appears in `git log`, and is easy to find; stashes are local, anonymous unless labelled, and easy to forget or drop. You can always squash the WIP commit later.

</details>
