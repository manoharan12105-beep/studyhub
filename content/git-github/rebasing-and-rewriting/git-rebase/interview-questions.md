# git rebase and Rebase vs Merge — Interview Questions

## Beginner

### Q1. What does `git rebase` do?

**Style:** What

<details>
<summary>Answer</summary>

It takes the commits on the current branch that aren't on the target base and replays them on top of the base, creating new commits (same changes and messages, new parents and ids). The branch then points to the last new commit, giving a linear history.

</details>

### Q2. What is the difference between merge and rebase?

**Style:** Comparison

<details>
<summary>Answer</summary>

Both integrate changes from one branch into another. Merge creates a merge commit with two parents and leaves existing commits untouched, preserving the real history. Rebase rewrites your commits onto the new base, producing a linear history without a merge commit, but changes commit ids. Merge is safe for shared branches; rebase is for private ones.

</details>

## Intermediate

### Q3. What is the golden rule of rebasing?

**Style:** Why

<details>
<summary>Answer</summary>

Don't rebase commits that exist outside your repository and that others may have built on. Rebasing replaces them with new commits; anyone who has the old ones ends up with duplicated commits and conflicts when they pull, and force-pushing the rebased branch can discard their work.

</details>

### Q4. How do you handle a conflict during a rebase?

**Style:** How

<details>
<summary>Answer</summary>

Resolve the conflicting files, `git add` them, then `git rebase --continue` to create the replayed commit and move on. `git rebase --skip` drops the current commit; `git rebase --abort` restores the branch to its pre-rebase state. Remember that during a rebase "ours" is the base and "theirs" is your commit.

</details>

## Advanced

### Q5. Why might rebasing take more conflict resolution than merging?

**Style:** Trade-off

<details>
<summary>Answer</summary>

A merge resolves the combined difference once. A rebase replays each commit separately, so if several of your commits touch the area that changed on the base, you may resolve similar conflicts several times. `git rerere` (reuse recorded resolution) can help, or squash first, or merge instead.

</details>

### Q6. You rebased and the result is wrong. How do you undo it?

**Style:** Scenario

<details>
<summary>Answer</summary>

Right after the rebase, `git reset --hard ORIG_HEAD` returns the branch to its pre-rebase commit (ORIG_HEAD is set by rebase). Later, find the pre-rebase tip in `git reflog` (the entry before "rebase (start)") and `git reset --hard <hash>`. Check `git status` first so no uncommitted work is lost.

</details>
