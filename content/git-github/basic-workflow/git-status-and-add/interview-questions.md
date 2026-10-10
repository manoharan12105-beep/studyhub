# git status and git add — Interview Questions

## Beginner

### Q1. What does `git status` tell you?

**Style:** What

<details>
<summary>Answer</summary>

The current branch and how it relates to its upstream (ahead/behind), changes staged for the next commit, changes in tracked files that are not staged, and untracked files. It compares HEAD with the index and the index with the working directory.

</details>

### Q2. What is the difference between `git add .`, `git add -A` and `git add -u`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`git add -A` stages new, modified and deleted files in the whole repository. `git add .` does the same but only under the current directory. `git add -u` stages modifications and deletions of **tracked** files in the whole repository and ignores new files.

</details>

## Intermediate

### Q3. When would you use `git add -p`?

**Style:** Scenario

<details>
<summary>Answer</summary>

When one file contains changes that belong in different commits — a bug fix and an unrelated rename, or a fix plus a debug statement you don't want committed. `-p` walks through each hunk so you stage only the relevant ones, keeping commits focused.

</details>

### Q4. You staged a file and then edited it again. What does `git status` show, and what will be committed?

**Style:** Output/prediction

<details>
<summary>Answer</summary>

The file appears under both "Changes to be committed" and "Changes not staged for commit" (`MM` in short form). Only the staged version is committed; stage again to include the new edit.

</details>
