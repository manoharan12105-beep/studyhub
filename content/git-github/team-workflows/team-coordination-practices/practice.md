# Coordinating a Team: Shared Files, Accidental Pushes and Safe Reviews — Practice

### P1. Public undo

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** revert on shared branches

A bad commit is on `main` and others have pulled. Which command undoes it safely?

- A) `git reset --hard HEAD~1` then `git push --force`
- B) `git revert <commit>` then `git push`
- C) `git commit --amend`
- D) `git rebase -i` and drop the commit

<details>
<summary>Answer</summary>

**Answer:** B) `git revert <commit>` then `git push`

</details>

### P2. Test without stashing

**Difficulty:** Medium · **Type:** Command · **Concepts:** worktree

You have uncommitted work. Create a separate folder `../gradebook-review` containing Arjun's `origin/fix/rounding`, run the build there, then remove it.

<details>
<summary>Answer</summary>

```bash
git fetch origin
git worktree add ../gradebook-review origin/fix/rounding
cd ../gradebook-review
mvn -B verify
cd -
git worktree remove ../gradebook-review
```

</details>

### P3. Hot-spot file

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** shared files

Every PR in your team conflicts in `pom.xml` because everyone adds dependencies at the end of the `<dependencies>` block. Suggest two changes to the team's habits.

<details>
<summary>Answer</summary>

Keep dependencies grouped and sorted (so additions land in different places), and land dependency changes in their own small PRs merged quickly. Optionally manage versions in `<properties>` or a BOM so version bumps touch one line.

</details>

### P4. Mixed PR

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** focused changes

A PR reformats 40 files and changes one grading rule. Why is this a coordination problem, not just a review problem?

<details>
<summary>Answer</summary>

The reformat touches lines in 40 files that others are editing, causing conflicts across the team, and buries the real rule change in noise; it also can't be reverted separately. Formatting should be a separate, announced change (or automated), and the rule change its own PR.

</details>
