# The Git Object Model: Blobs, Trees, Commits and Tags — Interview Questions

## Beginner

### Q1. What are the four types of Git objects?

**Style:** What

<details>
<summary>Answer</summary>

Blob (file content), tree (a directory listing of names, modes and object ids), commit (a root tree, parent commits, author, committer and message) and annotated tag (tagger, message and a pointer to another object).

</details>

## Intermediate

### Q2. What does "content-addressed storage" mean in Git?

**Style:** What happens internally

<details>
<summary>Answer</summary>

An object's id is the hash of its type, size and content, so the id is determined by the content alone. Identical content always gets the same id and is stored once, and any change to content produces a different id — which also makes corruption or tampering detectable.

</details>

### Q3. Where is a file's name stored in Git?

**Style:** Trap

<details>
<summary>Answer</summary>

In the tree object that contains it, alongside its mode and blob id. The blob only stores the bytes. That's why renaming a file creates a new tree entry but reuses the same blob.

</details>

### Q4. Does Git store snapshots or diffs?

**Style:** Comparison

<details>
<summary>Answer</summary>

Logically, snapshots: each commit points to a tree describing every file. Unchanged files and directories reuse existing blobs and trees, so a snapshot costs little. Physically, packfiles compress similar objects as deltas, but that's a storage optimisation; diffs you see are computed on demand.

</details>

## Advanced

### Q5. Why does changing the message of a commit from last month change the hashes of all later commits?

**Style:** What happens internally

<details>
<summary>Answer</summary>

The edited commit's content changes, so its hash changes. Each later commit stores its parent's hash in its own content, so its hash changes too, and so on up to the branch tip. This hash chaining makes history tamper-evident and is why rewritten history shows up as entirely new commits.

</details>
