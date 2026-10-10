# The Index: How the Staging Area Works — Interview Questions

## Beginner

### Q1. What is the Git index?

**Style:** What

<details>
<summary>Answer</summary>

A binary file (`.git/index`) that represents the next commit's snapshot: for every tracked path it stores the mode, the blob id of the staged content and a stage number, plus cached file-system metadata used to detect changes quickly.

</details>

## Intermediate

### Q2. What does `git add` do internally?

**Style:** What happens internally

<details>
<summary>Answer</summary>

It hashes the file's current content, writes it as a blob object into `.git/objects`, and updates (or creates) that path's entry in the index to point to the new blob. Nothing is committed and no ref moves.

</details>

### Q3. How does Git build a commit from the index?

**Style:** What happens internally

<details>
<summary>Answer</summary>

It writes tree objects from the index entries (`git write-tree`), creates a commit object pointing to the root tree with the current HEAD as parent and the message and identities (`git commit-tree`), then updates the current branch ref to the new commit (`git update-ref`), recording a reflog entry.

</details>

## Advanced

### Q4. What are index stages 1, 2 and 3?

**Style:** What

<details>
<summary>Answer</summary>

During a merge conflict, the index holds the base version (stage 1), our version (stage 2) and their version (stage 3) of a path instead of a normal stage-0 entry. Resolving and running `git add` collapses them into one stage-0 entry; Git refuses to commit while unmerged stages exist.

</details>

### Q5. `--assume-unchanged` vs `--skip-worktree`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`--assume-unchanged` is a performance promise that the file won't change, so Git skips checking it — Git may overwrite local changes. `--skip-worktree` tells Git to keep the index version and ignore local modifications deliberately, preserving them where possible. For local configuration, an ignored file plus a committed example is usually better than either.

</details>
