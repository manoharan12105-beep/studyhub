# Snapshots, Packfiles and Storage Efficiency — Practice

### P1. Read count-objects

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** loose vs packed

`git count-objects -v` shows `count: 0`, `in-pack: 91`, `packs: 2`. What does that mean?

<details>
<summary>Answer</summary>

There are no loose objects; all 91 objects are stored in two packfiles (typically after `git gc`).

</details>

### P2. Delta or not?

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** verify-pack

In `git verify-pack -v` output, one blob line has five columns and another has seven, the last being another object's id. Which is a delta, and what is the extra information?

<details>
<summary>Answer</summary>

The seven-column line is a delta: the extra columns are the delta chain depth and the base object it is stored against.

</details>

### P3. Snapshot or diff?

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** model vs storage

Which statement is accurate?

- A) Git stores diffs, so old versions must be rebuilt by applying patches you can see
- B) Git's model is snapshots; packfiles may store objects as deltas, invisibly to commands like `git show`
- C) Git stores every version of every file uncompressed
- D) Packfiles only exist on GitHub, not locally

<details>
<summary>Answer</summary>

**Answer:** B) Git's model is snapshots; packfiles may store objects as deltas, invisibly to commands like `git show`

</details>

### P4. Why is recovery time-limited?

**Difficulty:** Hard · **Type:** Conceptual · **Concepts:** gc, reflog expiry

Explain why a commit lost to `git reset --hard` can be recovered today but perhaps not in two months.

<details>
<summary>Answer</summary>

Today the commit is still referenced by the reflog and present in the object database. Reflog entries for unreachable commits expire after 30 days by default; once no reflog entry references it and it is older than the prune expiry (2 weeks), `git gc` deletes it.

</details>
