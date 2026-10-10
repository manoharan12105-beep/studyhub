# Pull Requests: Creating and Describing Changes — Practice

### P1. Is it Git?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** platform feature

Which statement about pull requests is correct?

- A) `git pull` creates a pull request
- B) Pull requests are stored in the Git history
- C) A pull request is a hosting-platform feature built around branches
- D) Pull requests can only be opened by repository admins

<details>
<summary>Answer</summary>

**Answer:** C) A pull request is a hosting-platform feature built around branches

</details>

### P2. What will reviewers see?

**Difficulty:** Medium · **Type:** Command · **Concepts:** three-dot diff

Before opening a PR from your current branch into `main`, show the commits it will include and a summary of its diff.

<details>
<summary>Answer</summary>

```bash
git log --oneline main..HEAD
git diff --stat main...HEAD
```

</details>

### P3. Improve the title

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** PR titles

Rewrite these titles: (a) "Update" (b) "Fixed stuff from issue" (c) "WIP class report".

<details>
<summary>Answer</summary>

(a) e.g. "Round class averages to two decimals" (b) "Handle students with no marks in ClassReport" (c) open it as a draft titled "Add ClassReport summary output".

</details>

### P4. Update an outdated PR

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** keeping PRs current

GitHub says your PR branch has conflicts with `main`. The branch is yours alone. Give the commands to update it with a linear history.

<details>
<summary>Answer</summary>

```bash
git fetch origin
git switch fix/12-empty-marks
git rebase origin/main          # resolve conflicts, git add, git rebase --continue
mvn -B verify
git push --force-with-lease
```

(Or `git merge origin/main` and a normal push if you prefer not to rewrite.)

</details>

### P5. Write the description

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** PR description

Your change rounds class averages to two decimals (issue #27) and adds two tests. Draft a short PR description with the essential sections.

<details>
<summary>Answer</summary>

What: averages are rounded to two decimals. Why: report cards showed values like 83.33333 (#27). How: `average()` rounds with `Math.round(x * 100) / 100.0`. Testing: two new tests for rounding up and down; `mvn -B verify` passes. `Fixes #27`.

</details>
