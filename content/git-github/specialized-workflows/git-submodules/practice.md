# Git Submodules — Practice

### P1. What is stored?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** gitlink

What does the parent repository store for a submodule at `libs/rubric`?

- A) A full copy of the rubric files
- B) A `.gitmodules` entry and the pinned commit id
- C) Only the rubric repository's URL
- D) A symbolic link to another folder

<details>
<summary>Answer</summary>

**Answer:** B) A `.gitmodules` entry and the pinned commit id

</details>

### P2. Read the status

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** submodule status

What do these lines mean?

```text
-dfcfc69380bf5fb43817724dc51a798f675edfd7 libs/rubric
+e480e7ebba3a4fc5bd9995cb64525607e5a6711d libs/other
```

<details>
<summary>Answer</summary>

`libs/rubric` is not initialised (nothing checked out). `libs/other` is checked out at a commit different from the one the parent repository pins — update it or commit the new pointer.

</details>

### P3. Clone properly

**Difficulty:** Easy · **Type:** Command · **Concepts:** recurse-submodules

Clone `https://github.com/your-org/gradebook.git` including all submodules in one command.

<details>
<summary>Answer</summary>

`git clone --recurse-submodules https://github.com/your-org/gradebook.git`

</details>

### P4. Unexpected change in a PR

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** pointer changes

Your pull request shows `-Subproject commit dfcfc69…` / `+Subproject commit 1b2c3d4…` for `libs/rubric`, but you never meant to change the library. What happened and how do you undo it?

<details>
<summary>Answer</summary>

Your submodule checkout was at a different commit (e.g. after `update --remote` or a checkout inside it) and `git add -A`/`commit -a` staged the new pointer. Restore it: `git restore --source=main --staged --worktree libs/rubric` (or `git checkout main -- libs/rubric`) and `git submodule update`, then commit.

</details>
