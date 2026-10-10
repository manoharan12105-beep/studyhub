# git commit: Recording Snapshots — Interview Questions

## Beginner

### Q1. What does `git commit` do?

**Style:** What

<details>
<summary>Answer</summary>

It creates a new commit from the staging area — a snapshot of the project plus author, committer, timestamps, a message and the parent commit — and moves the current branch to point at it.

</details>

### Q2. What does `git commit -a` do, and what doesn't it do?

**Style:** Trap

<details>
<summary>Answer</summary>

It automatically stages modifications and deletions of tracked files, then commits. It does not add untracked (new) files, and it includes every modified tracked file, so unintended edits can slip in.

</details>

## Intermediate

### Q3. How do you add a forgotten file to the last commit?

**Style:** How

<details>
<summary>Answer</summary>

`git add <file>` then `git commit --amend --no-edit`. The amended commit gets a new hash, so do this only before pushing (or coordinate a force-with-lease push if the branch is yours alone).

</details>

### Q4. What is the difference between the author and the committer of a commit?

**Style:** Comparison

<details>
<summary>Answer</summary>

The author wrote the change; the committer applied it to the repository. They differ when someone commits another person's patch, or when a commit is rewritten (rebased, cherry-picked, amended) — the committer and commit date update while the author stays. `git log --format='%an %cn'` shows both.

</details>

## Advanced

### Q5. Why does every commit have a different hash even if two commits contain the same files?

**Style:** What happens internally

<details>
<summary>Answer</summary>

The hash is computed over the whole commit object: tree id, parent id(s), author and committer with timestamps, and message. Any difference — even only the time or the parent — produces a different id. Identical file contents do share the same blob and tree objects.

</details>
