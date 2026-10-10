# git show and Comparing Commits and Branches — Practice

### P1. Old version of pom.xml

**Difficulty:** Easy · **Type:** Command · **Concepts:** show commit:path

Print `pom.xml` as it was in commit `8ddf4ed`.

<details>
<summary>Answer</summary>

`git show 8ddf4ed:pom.xml`

</details>

### P2. Direction of a diff

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** diff order

`git diff 3a070e0 d0e8c67` shows the B threshold line as:

- A) `-75` / `+78`
- B) `-78` / `+75`
- C) Nothing, the order doesn't matter
- D) An error, because the newer commit must come second

<details>
<summary>Answer</summary>

**Answer:** B) `-78` / `+75`

The diff goes from the first argument (newer, 78) to the second (older, 75). Git doesn't require any order.

</details>

### P3. What will I merge?

**Difficulty:** Medium · **Type:** Command · **Concepts:** ranges

Before merging `feature/class-report` into `main`, list its commits not yet on `main`, then show the combined change since the branches diverged as a file summary.

<details>
<summary>Answer</summary>

```bash
git log --oneline main..feature/class-report
git diff --stat main...feature/class-report
```

</details>

### P4. Files in a commit

**Difficulty:** Medium · **Type:** Command · **Concepts:** show --name-status

List only the names and A/M/D status of the files changed by `HEAD~2`.

<details>
<summary>Answer</summary>

`git show --name-status --format= HEAD~2` (the empty `--format=` hides the commit header). `git diff --name-status HEAD~3 HEAD~2` gives the same for a non-merge commit.

</details>
