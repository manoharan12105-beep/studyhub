# The Index: How the Staging Area Works — Practice

### P1. What changes on git add?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** git add internals

Which two things change when you run `git add README.md` on a modified file?

- A) The branch ref and the reflog
- B) A new blob in the object database and the README entry in the index
- C) A new commit and a new tree
- D) The remote-tracking branch and `FETCH_HEAD`

<details>
<summary>Answer</summary>

**Answer:** B) A new blob in the object database and the README entry in the index

</details>

### P2. Read a stage line

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** ls-files --stage

Explain: `100644 763ffb5ea3ac118aa4015ff390bf527e33f3fa74 0	README.md`

<details>
<summary>Answer</summary>

Regular file mode, the blob id of the staged content, stage 0 (no conflict), and the path.

</details>

### P3. Build a commit with plumbing

**Difficulty:** Hard · **Type:** Command · **Concepts:** write-tree, commit-tree, update-ref

With changes staged, create a commit on `main` with the message "Plumbing commit" without using `git commit`.

<details>
<summary>Answer</summary>

```bash
TREE=$(git write-tree)
NEW=$(echo "Plumbing commit" | git commit-tree $TREE -p HEAD)
git update-ref refs/heads/main $NEW
```

(Assumes you're on `main`.)

</details>

### P4. Conflict entries

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** stages

During a conflict `git ls-files -u` shows three lines for one file with stages 1, 2 and 3. What will `git ls-files --stage <file>` show after you fix the file and run `git add`?

<details>
<summary>Answer</summary>

A single stage-0 line pointing to the blob of your resolved content.

</details>
