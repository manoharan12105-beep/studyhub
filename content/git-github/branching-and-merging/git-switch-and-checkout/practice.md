# git switch and git checkout — Practice

### P1. Modern equivalent

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** switch vs checkout

Which command is the modern equivalent of `git checkout -b fix/rounding`?

- A) `git branch fix/rounding`
- B) `git switch fix/rounding`
- C) `git switch -c fix/rounding`
- D) `git restore -b fix/rounding`

<details>
<summary>Answer</summary>

**Answer:** C) `git switch -c fix/rounding`

`git branch` creates without switching; `git switch` without `-c` needs an existing branch.

</details>

### P2. Previous branch

**Difficulty:** Easy · **Type:** Command · **Concepts:** switch -

You switched from `feature/class-report` to `main` to check something. Return to the feature branch with the shortest command.

<details>
<summary>Answer</summary>

`git switch -` (or `git checkout -`).

</details>

### P3. Refused switch

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** uncommitted changes

`git switch main` prints "Your local changes to the following files would be overwritten by checkout: … GradeCalculator.java". Give two safe ways forward.

<details>
<summary>Answer</summary>

Commit the work on the current branch, or stash it (`git stash push -m "wip grade"`), then switch. Re-apply the stash later with `git stash pop`. Don't force the switch unless you want to discard the edits.

</details>

### P4. Branch or file?

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** checkout ambiguity

There is no branch named `pom.xml`. You edited `pom.xml` but didn't stage it, then ran `git checkout pom.xml`. What happened to your edits?

<details>
<summary>Answer</summary>

They were discarded: Git treated `pom.xml` as a path and overwrote it from the index. They can't be recovered from Git because they were never staged or committed (an IDE's local history may still have them).

</details>

### P5. Branch from a tag

**Difficulty:** Medium · **Type:** Command · **Concepts:** start point

Create and switch to `hotfix/1.0.1` starting from tag `v1.0.0`, using `git switch`.

<details>
<summary>Answer</summary>

`git switch -c hotfix/1.0.1 v1.0.0`

</details>
