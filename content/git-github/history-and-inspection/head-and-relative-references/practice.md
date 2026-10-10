# HEAD and Relative Commit References — Practice

### P1. Contents of HEAD

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** HEAD

On branch `main` (not detached), what does `.git/HEAD` contain?

- A) The full hash of the current commit
- B) `ref: refs/heads/main`
- C) The name of the remote
- D) A list of all branches

<details>
<summary>Answer</summary>

**Answer:** B) `ref: refs/heads/main`

A hash would mean detached HEAD.

</details>

### P2. Same commit?

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** ~ and ^

Are `HEAD~2` and `HEAD^^` always the same commit? Are `HEAD~2` and `HEAD^2`?

<details>
<summary>Answer</summary>

`HEAD~2` and `HEAD^^` are always the same (two first-parent steps). `HEAD~2` and `HEAD^2` are different: `^2` is the second parent of a merge and fails on a non-merge commit.

</details>

### P3. Walk the graph

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** parents of a merge

```text
* 3a070e0 (HEAD -> main) Raise the B threshold to 78
*   10b9974 Merge branch 'feature/class-report'
|\
| * 8b503ca Show each student's average in ClassReport
| * 3e2381d Add ClassReport with one line per student
* | d0e8c67 Round averages to two decimals
|/
* 4b17431 Document the grading scale in README
```

Which commits are `HEAD~1^2` and `HEAD~3`?

<details>
<summary>Answer</summary>

`HEAD~1^2` = `8b503ca` (second parent of the merge). `HEAD~3` = `4b17431` (3a070e0 → 10b9974 → d0e8c67 → 4b17431, following first parents).

</details>

### P4. Script-friendly

**Difficulty:** Medium · **Type:** Command · **Concepts:** rev-parse

In a shell script, store the current branch name and the short hash of HEAD in variables.

<details>
<summary>Answer</summary>

```bash
branch=$(git rev-parse --abbrev-ref HEAD)
commit=$(git rev-parse --short HEAD)
```

(`git branch --show-current` also prints the branch, and prints nothing when HEAD is detached.)

</details>
