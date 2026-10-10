# Commit Messages and Atomic Commits — Interview Questions

## Beginner

### Q1. What makes a good commit message?

**Style:** What

<details>
<summary>Answer</summary>

A short, specific subject in the imperative mood (about 50 characters, no trailing period), a blank line, then a body that explains why the change was made and any trade-offs — the diff already shows what changed. Reference the issue it fixes.

</details>

### Q2. What is an atomic commit?

**Style:** What

<details>
<summary>Answer</summary>

A commit containing one logical change that is complete: the project builds and the tests pass at that commit. Code and its tests go together; unrelated refactors, formatting or dependency bumps go in separate commits.

</details>

## Intermediate

### Q3. Why do atomic commits matter beyond readability?

**Style:** Why

<details>
<summary>Answer</summary>

Git's tools work on whole commits: `git revert` undoes a commit, `git cherry-pick` copies one, `git bisect` tests commits one by one, and `git blame` points at one. Mixed commits make it impossible to undo or port one change alone, and a non-building commit derails bisect.

</details>

### Q4. Why write the subject in the imperative mood?

**Style:** Why

<details>
<summary>Answer</summary>

It reads as an instruction for what applying the commit does ("Add D grade"), matching Git's own generated messages ("Merge branch…", "Revert…"), so the log reads consistently. It's a convention, not a rule Git enforces — the team's convention wins.

</details>

## Advanced

### Q5. Your branch has commits "WIP", "fix", "fix again", "review comments". What do you do before merging?

**Style:** Scenario

<details>
<summary>Answer</summary>

If the branch is only yours (or the team agrees), clean it up with `git rebase -i` — squash or fixup the noise into meaningful commits with proper messages — then `git push --force-with-lease`. Alternatively the team may use squash merging in the pull request so `main` gets one well-described commit. Never rewrite a branch others are building on without coordinating.

</details>
