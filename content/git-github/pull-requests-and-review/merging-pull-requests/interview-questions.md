# Merging Pull Requests: Merge Commit, Squash and Rebase — Interview Questions

## Beginner

### Q1. What are GitHub's three ways to merge a pull request?

**Style:** What

<details>
<summary>Answer</summary>

Create a merge commit (all commits plus a two-parent merge commit), squash and merge (the whole PR becomes one new commit on the base branch), and rebase and merge (each commit is re-created on top of the base branch, with no merge commit).

</details>

## Intermediate

### Q2. When would you choose squash and merge?

**Style:** Trade-off

<details>
<summary>Answer</summary>

When PRs are small and their individual commits aren't meaningful ("fix typo", "address review"), so `main` gets one well-described commit per change that's easy to read and revert. The cost: individual commit history is lost from `main`, bisect is coarser, and Git no longer sees the branch as merged.

</details>

### Q3. Why does `git branch -d` fail after a squash merge?

**Style:** What happens internally

<details>
<summary>Answer</summary>

Squashing creates a brand-new commit with the combined change; the branch's original commits are not ancestors of `main`, so Git's "fully merged" check fails. Confirm the PR was merged, then delete with `-D`.

</details>

## Advanced

### Q4. What can a repository require before a PR can be merged?

**Style:** What

<details>
<summary>Answer</summary>

Through branch protection or rulesets: a minimum number of approvals, code-owner approval, passing required status checks, the branch being up to date with the base, resolved conversations, signed commits, linear history, and a merge queue. Admins can also restrict who may merge or push.

</details>

### Q5. A squash-merged feature broke production. How do you undo it, and how would that differ with a merge commit?

**Style:** Scenario

<details>
<summary>Answer</summary>

Squash: `git revert <squash-commit>` — one commit undoes the feature (or GitHub's Revert button). Merge commit: `git revert -m 1 <merge-commit>`, and remember that re-merging the same branch later needs reverting the revert. With rebase merges, you'd revert each re-created commit (or a range).

</details>
