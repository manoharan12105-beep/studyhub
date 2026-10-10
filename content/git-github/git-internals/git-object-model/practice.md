# The Git Object Model: Blobs, Trees, Commits and Tags — Practice

### P1. Which object?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** object types

Which object type stores the name `README.md`?

- A) blob
- B) tree
- C) commit
- D) tag

<details>
<summary>Answer</summary>

**Answer:** B) tree

</details>

### P2. Same content

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** content addressing

`a.txt` and `docs/b.txt` both contain exactly `hello` followed by a newline. How many blobs does committing both create, and what is the id?

<details>
<summary>Answer</summary>

One blob, `ce013625030ba8dba906f756967f9e9ca394464a` (captured with `git hash-object`). Both tree entries point to it.

</details>

### P3. Inspect a commit's snapshot

**Difficulty:** Medium · **Type:** Command · **Concepts:** cat-file, ls-tree

Show (a) the raw contents of the commit `HEAD~1`, (b) every file path and blob id in its snapshot.

<details>
<summary>Answer</summary>

(a) `git cat-file -p HEAD~1` (b) `git ls-tree -r HEAD~1`

</details>

### P4. Read a tree entry

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** modes

Explain each field: `040000 tree 17858bcfb4bc4a05ae804a01ae35ef394e8767db	src`

<details>
<summary>Answer</summary>

`040000` — directory mode; `tree` — object type; the hash — the id of the subtree; `src` — the entry's name in this directory.

</details>

### P5. Rename cost

**Difficulty:** Hard · **Type:** Conceptual · **Concepts:** snapshots, blobs

You rename `App.java` to `GradebookApp.java` without changing its content and commit. Which new objects does the commit create?

<details>
<summary>Answer</summary>

No new blob (the content's blob already exists). New tree objects for the directory containing the file and every parent directory up to the root (their entries changed), and one new commit. Unchanged sibling trees and blobs are reused.

</details>
