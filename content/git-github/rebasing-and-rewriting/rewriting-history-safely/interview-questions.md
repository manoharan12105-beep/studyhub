# Rewriting History Safely — Interview Questions

## Beginner

### Q1. Which Git commands rewrite history?

**Style:** What

<details>
<summary>Answer</summary>

`git commit --amend`, `git rebase` (and `rebase -i`), `git reset` to an earlier commit followed by new commits, and history-filtering tools such as `git filter-repo`. They create new commits and move the branch; the old commits remain until garbage-collected.

</details>

## Intermediate

### Q2. Why is rewriting shared history dangerous?

**Style:** Why

<details>
<summary>Answer</summary>

Others' clones still contain the old commits. After you force-push replacements, their next pull sees diverged histories — producing duplicate commits, repeated conflicts, or, if they force-push their old version, the loss of your rewrite. A careless `--force` can also delete teammates' newer commits from the remote branch.

</details>

### Q3. What's the difference between `--force` and `--force-with-lease`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`--force` overwrites the remote branch unconditionally. `--force-with-lease` overwrites only if the remote branch still points where your remote-tracking ref says it did, so it refuses when someone pushed in the meantime. Because a fetch refreshes that ref, you can pin the expected commit (`--force-with-lease=<branch>:<sha>`) or add `--force-if-includes` for stronger protection.

</details>

### Q4. You amended a commit that you had already pushed to your own PR branch. What now?

**Style:** Scenario

<details>
<summary>Answer</summary>

The local and remote branches have diverged (ahead 1, behind 1). Don't pull — that would merge the old commit back. Since the branch is yours, publish with `git push --force-with-lease`. Reviewers will see the PR updated with the new commit.

</details>

## Advanced

### Q5. A teammate force-pushed `feature/report`, and you have two local commits on the old version. How do you recover cleanly?

**Style:** Debugging

<details>
<summary>Answer</summary>

`git fetch`, then inspect `git log --oneline --graph feature/report origin/feature/report`. Replay only your two commits onto the new remote branch: `git rebase --onto origin/feature/report <old-base> feature/report`, where `<old-base>` is the old remote tip your commits were built on (find it in the reflog of `origin/feature/report` with `git reflog show origin/feature/report`). Alternatively branch, reset to `origin/feature/report`, and cherry-pick the two commits.

</details>
