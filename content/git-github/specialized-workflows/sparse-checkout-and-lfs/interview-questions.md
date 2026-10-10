# Sparse Checkout, Partial Clone and Large-File Storage — Interview Questions

## Beginner

### Q1. What is Git LFS?

**Style:** What

<details>
<summary>Answer</summary>

Git Large File Storage: an extension that stores large files' contents on an LFS server and commits small pointer files (version, SHA-256 oid, size) in Git instead. Clones download real content only for the files they check out.

</details>

## Intermediate

### Q2. What's the difference between sparse checkout and partial clone?

**Style:** Comparison

<details>
<summary>Answer</summary>

Sparse checkout limits which paths are written to the working directory; the repository still contains everything. Partial clone (e.g. `--filter=blob:none`) limits which objects are downloaded, fetching missing blobs on demand. They're often combined for very large monorepos.

</details>

### Q3. Partial clone vs shallow clone?

**Style:** Comparison

<details>
<summary>Answer</summary>

A shallow clone (`--depth n`) truncates history, so log, blame and bisect only see recent commits. A blobless partial clone keeps all commits and trees but defers file contents until needed, so history commands work and only some operations need the network.

</details>

## Advanced

### Q4. A repository is 3 GB because someone committed build artifacts years ago. Will adding Git LFS now help?

**Style:** Trap

<details>
<summary>Answer</summary>

Not for the existing size — the old blobs remain in history. LFS only affects new commits of tracked patterns. Shrinking requires rewriting history (`git lfs migrate import` or `git filter-repo` to remove the artifacts), coordinated with everyone re-cloning. And build artifacts shouldn't be in Git at all — publish them to a package registry or release assets.

</details>
