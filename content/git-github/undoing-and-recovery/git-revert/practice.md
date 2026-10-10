# git revert and Reset vs Revert — Practice

### P1. Pushed bug

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** reset vs revert

Commit `c41d2e9` on `main` was pushed yesterday and broke the build. What is the safest way to undo it?

- A) `git reset --hard c41d2e9~1 && git push --force`
- B) `git revert c41d2e9` and push
- C) `git commit --amend`
- D) Delete the remote branch and push again

<details>
<summary>Answer</summary>

**Answer:** B) `git revert c41d2e9` and push

It adds an undoing commit and keeps shared history intact.

</details>

### P2. Read the history

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** revert commits

After `git revert 3a070e0`, does `3a070e0` still appear in `git log`? What does the newest commit's message say by default?

<details>
<summary>Answer</summary>

Yes, `3a070e0` is still in history. The new commit's message is `Revert "Raise the B threshold to 78"` with the body `This reverts commit 3a070e0d3d0abb543338e9b1bffc80830d43dd57.`

</details>

### P3. Revert a merge

**Difficulty:** Medium · **Type:** Command · **Concepts:** -m

Undo the merge commit `10b9974`, keeping `main`'s side as the mainline.

<details>
<summary>Answer</summary>

`git revert -m 1 10b9974`

</details>

### P4. Several commits, one revert

**Difficulty:** Medium · **Type:** Command · **Concepts:** --no-commit

Undo the last three commits on `main` with a single new commit.

<details>
<summary>Answer</summary>

```bash
git revert --no-commit HEAD~3..HEAD
git commit -m "Revert the grading-policy changes pending review"
```

This works when none of the three is a merge commit; a merge in the range stops the revert with "is a merge but no -m option was given", and such a commit must be reverted on its own with `-m 1`.

</details>

### P5. Bring it back

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** revert the revert

`e255561` reverted the merge of `feature/class-report`. The team now wants the feature back exactly as it was. What do you run?

<details>
<summary>Answer</summary>

`git revert e255561` — reverting the revert re-applies the feature's changes. Merging the old branch again would do nothing, because its commits are already ancestors of `main`.

</details>
