# Commits, Hashes and the History Graph — Practice

### P1. Contents of a commit

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** commit object

Which of these is **not** stored inside a commit object?

- A) The id of its tree
- B) The id of its parent(s)
- C) The name of the branch it was created on
- D) The author and committer with timestamps

<details>
<summary>Answer</summary>

**Answer:** C) The name of the branch it was created on

Branches are separate references.

</details>

### P2. Read the graph

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** merge commit, parents

From the graph below, name the merge commit and its first and second parents.

```text
*   10b9974 Merge branch 'feature/class-report'
|\  
| * 8b503ca (feature/class-report) Show each student's average in ClassReport
| * 3e2381d Add ClassReport with one line per student
* | d0e8c67 Round averages to two decimals
|/  
* 4b17431 Document the grading scale in README
```

<details>
<summary>Answer</summary>

`10b9974` is the merge commit. First parent: `d0e8c67` (the `main` line, drawn on the left); second parent: `8b503ca` (the merged feature branch).

</details>

### P3. Ripple effect

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** hash chaining

You change the message of commit `7c8bad0`, which has four descendants. How many commits get new hashes, and why?

<details>
<summary>Answer</summary>

Five: the edited commit (its content changed) plus all four descendants (each one's parent id changed, which changes its own content and hash).

</details>

### P4. Find special commits

**Difficulty:** Medium · **Type:** Command · **Concepts:** root, merges

Give commands that list (a) the root commit(s) and (b) all merge commits on the current branch, one line each.

<details>
<summary>Answer</summary>

(a) `git rev-list --max-parents=0 HEAD` (or `git log --oneline --max-parents=0`) (b) `git log --oneline --merges`.

</details>
