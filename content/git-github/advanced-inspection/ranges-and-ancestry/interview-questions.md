# Ranges and Ancestry — Interview Questions

## Beginner

### Q1. What does `git log main..feature` show?

**Style:** What

<details>
<summary>Answer</summary>

Commits reachable from `feature` but not from `main` — the commits the feature branch would add to `main`, i.e. what a pull request from `feature` into `main` contains.

</details>

## Intermediate

### Q2. What is the difference between two-dot and three-dot ranges?

**Style:** Comparison

<details>
<summary>Answer</summary>

In `git log`, `A..B` lists commits in B not in A, while `A...B` lists commits in either but not both (add `--left-right` to see which side). In `git diff`, `A..B` compares the two tips, while `A...B` compares the merge base of A and B with B — what B changed since they diverged.

</details>

### Q3. How do you check whether a bug-fix commit is included in a release tag?

**Style:** How

<details>
<summary>Answer</summary>

`git merge-base --is-ancestor <fix> v1.1.0` (exit code 0 means yes), or `git tag --contains <fix>` to list every tag that includes it. If the fix was cherry-picked, the id differs — search with `git log v1.1.0 -S` or the `cherry picked from` line instead.

</details>

## Advanced

### Q4. What is a merge base and how is it used?

**Style:** What happens internally

<details>
<summary>Answer</summary>

The best common ancestor of two commits (`git merge-base A B`). Three-way merges use it as the "base" version, `git diff A...B` diffs from it, and pull requests show changes relative to it. With criss-cross histories there can be several candidates; `--all` lists them, and the `ort` strategy merges them into a virtual base.

</details>
