# Snapshots, Packfiles and Storage Efficiency — Interview Questions

## Beginner

### Q1. If every commit stores a full snapshot, why doesn't the repository grow huge?

**Style:** Why

<details>
<summary>Answer</summary>

Unchanged files and directories are the same objects (same content → same id), so a commit only adds objects for what changed. All objects are zlib-compressed, and packfiles store similar objects as small deltas against each other.

</details>

## Intermediate

### Q2. What is the difference between loose objects and packfiles?

**Style:** Comparison

<details>
<summary>Answer</summary>

Loose objects are individual compressed files under `.git/objects/xx/`, created as you work. Packfiles bundle many objects into one file with an index, using delta compression between similar objects. `git gc` (often triggered automatically) moves loose objects into packs; fetch and push transfer packs.

</details>

### Q3. What does `git gc` do?

**Style:** What

<details>
<summary>Answer</summary>

Packs loose objects into packfiles (with deltas), packs refs into `packed-refs`, expires old reflog entries, and prunes unreachable objects older than the expiry (two weeks by default), keeping recent unreachable objects in a cruft pack until then.

</details>

## Advanced

### Q4. Why do large binary files cause problems in Git?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Binaries (images, archives, JARs) are often already compressed and change wholesale, so zlib and deltas save little; every version stays in history and every clone downloads all of them. Repositories become slow to clone and fetch. Solutions: keep build artifacts out of Git, use Git LFS for necessary large assets, or partial clone.

</details>
