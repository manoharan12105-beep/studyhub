# The Three Areas of Git and File States — Interview Questions

## Beginner

### Q1. Explain the working directory, staging area and repository.

**Style:** What

<details>
<summary>Answer</summary>

The working directory holds the files you edit. The staging area (index) holds the snapshot your next commit will contain; `git add` copies changes into it. The repository (`.git`) stores every commit; `git commit` turns the staged snapshot into a new commit.

</details>

### Q2. What are the possible states of a file in Git?

**Style:** What

<details>
<summary>Answer</summary>

Untracked (never added), and for tracked files: unmodified, modified (changed but not staged) and staged (change recorded in the index). Ignored files are untracked files matched by an ignore rule.

</details>

## Intermediate

### Q3. Why does Git have a staging area? Other systems commit the changed files directly.

**Style:** Why

<details>
<summary>Answer</summary>

It separates "what I changed" from "what belongs in this commit". You can split unrelated work into focused commits, stage only part of a file (`git add -p`), review exactly what will be committed (`git diff --staged`) and keep experimental edits out of a commit.

</details>

### Q4. `git status --short` shows `MM Main.java`. What does it mean, and what will `git commit` record?

**Style:** Output/prediction

<details>
<summary>Answer</summary>

The file was modified and staged (left `M`), then modified again (right `M`). The index holds the first version, the working directory a newer one. `git commit` records only the staged version; the later edits stay as an unstaged change.

</details>

## Advanced

### Q5. Is staged content safe if you never commit it?

**Style:** What happens internally

<details>
<summary>Answer</summary>

Partly. `git add` writes the content as a blob object in the object database and records it in the index, so the content exists even if the working file is later deleted — `git fsck --lost-found` can find such dangling blobs. But nothing refers to it by name, and `git gc` eventually prunes unreachable objects. Only a commit (on a branch, pushed) is durable.

</details>
