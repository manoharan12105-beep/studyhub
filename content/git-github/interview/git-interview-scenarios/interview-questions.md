# Git Interview Questions: Scenarios and Troubleshooting — Interview Questions

## Intermediate

### Q1. You accidentally ran `git reset --hard HEAD~3`. How do you get your commits back?

**Style:** Scenario

<details>
<summary>Answer</summary>

`git reflog` shows `reset: moving to HEAD~3` at the top; the entry below it is the old tip. `git reset --hard HEAD@{1}` (or `ORIG_HEAD`) restores it — after checking `git status` so no new uncommitted work is overwritten. Uncommitted changes that the original reset discarded can't be recovered.

**Follow-up:** "What if you'd deleted the branch too?" — `git branch <name> <id-from-reflog>`.

</details>

### Q2. You committed on `main` instead of a feature branch. Fix it.

**Style:** Scenario

<details>
<summary>Answer</summary>

Not pushed: `git branch feature/x`, `git reset --hard HEAD~1`, `git switch feature/x`. Pushed: `git revert` the commit on `main` and cherry-pick it onto the feature branch.

**Follow-up:** "How do you prevent it?" — show the branch in the prompt, protect `main`.

</details>

### Q3. You need to undo a commit that's already pushed and pulled by others.

**Style:** Scenario

<details>
<summary>Answer</summary>

`git revert <hash>` on an up-to-date branch, explain why in the message, test, push. No history rewrite, so teammates just pull. For a merge commit: `git revert -m 1 <merge>`.

**Misconception:** reset + force push "cleans" history — it breaks everyone else's clones.

</details>

### Q4. Your push is rejected. What do you do?

**Style:** Troubleshooting

<details>
<summary>Answer</summary>

Read the reason. "fetch first" → someone pushed: `git fetch`, inspect `git log main..origin/main`, `git pull --rebase` (or merge), resolve, test, push. "non-fast-forward" after my own rebase of my own branch → `git push --force-with-lease`. Never `--force` a shared branch.

</details>

### Q5. You were halfway through a feature when an urgent production bug arrived.

**Style:** Scenario

<details>
<summary>Answer</summary>

`git stash push -u -m "feature WIP"` (or commit WIP on the feature branch), `git switch -c hotfix/x <release-tag-or-main>`, fix with a test, push, PR; then switch back and `git stash pop`. Alternatively `git worktree add -b hotfix/x ../hotfix <tag>` so the feature folder isn't touched at all.

</details>

### Q6. You pushed an API key to a public repository.

**Style:** Scenario

<details>
<summary>Answer</summary>

Revoke/rotate the key immediately and update its users; check the provider's logs for misuse; move the value to an environment variable or secret store, untrack and ignore the file, commit an example file; optionally purge history with `git filter-repo` in a coordinated rewrite and ask GitHub to clear cached views; enable push protection.

**Misconception:** Deleting the file or rewriting history makes it safe without rotation.

</details>

### Q7. A merge conflict appears in a file you don't understand.

**Style:** Scenario

<details>
<summary>Answer</summary>

Don't guess. `git log --merge` and `git show` on the conflicting commits to understand both intents; enable `zdiff3` to see the base; ask the authors; or `git merge --abort` and merge later. After resolving, `git diff --check`, build and test before committing.

</details>

### Q8. `git status` says "HEAD detached at 4b17431" and you've made two commits.

**Style:** Troubleshooting

<details>
<summary>Answer</summary>

`git switch -c rescue/work` keeps them on a new branch. If you already switched away, `git reflog` shows the commit ids; `git branch rescue/work <id>`.

</details>

## Advanced

### Q9. Someone force-pushed `main` and three commits disappeared.

**Style:** Scenario

<details>
<summary>Answer</summary>

On a clone that fetched before the force push, `git reflog show origin/main` (or `origin/main@{1}`) gives the old tip; the pusher's own reflog also has it. Push it back with a lease (`git push --force-with-lease=main:<current-bad> origin <old-tip>:main`), re-apply any wanted new commits, inform the team, and enable branch protection blocking force pushes.

</details>

### Q10. A bug appeared somewhere in the last 300 commits.

**Style:** Scenario

<details>
<summary>Answer</summary>

`git bisect start HEAD <last-good-tag>`, then `git bisect run <script>` with a test exiting 0 for good, 1 for bad, 125 to skip — about 9 steps. Inspect the first bad commit with `git show`, `git bisect reset`, then fix forward with a regression test.

</details>

### Q11. Your team argues: merge commits vs squash vs rebase. What do you recommend?

**Style:** Trade-off

<details>
<summary>Answer</summary>

It depends: squash for small PRs with noisy commits (clean `main`, easy revert, PR number in history); merge commits for large, well-structured PRs where individual commits matter; rebase-merge when commits are clean and a linear, bisectable history is valued. Pick one default, document it, enforce through the repository's merge settings.

</details>

### Q12. A teammate's branch has 40 commits and conflicts with `main` everywhere.

**Style:** Scenario

<details>
<summary>Answer</summary>

Merge `main` into the branch once (resolve once) rather than rebasing 40 commits, or squash first and rebase the single commit; consider splitting the remaining work into smaller PRs; for the future, short-lived branches and regular updates from `main`. Enable `rerere` if repeated rebases are unavoidable.

</details>

### Q13. CI passes on the PR, but `main` is broken right after merging.

**Style:** Debugging

<details>
<summary>Answer</summary>

The PR was tested against an older `main`; another change merged in between and the combination fails (a semantic conflict). Revert or fix on `main` now; prevent it with "require branches to be up to date before merging" or a merge queue that tests each PR against the latest `main`.

</details>

### Q14. A repository is 2 GB because of committed build artifacts. What do you propose?

**Style:** Scenario

<details>
<summary>Answer</summary>

Stop the growth: ignore build output and publish artifacts to a registry or release assets. Then decide whether to shrink history: a coordinated `git filter-repo` (or `git lfs migrate` for assets that must stay versioned) rewrites every commit and requires everyone to re-clone. Meanwhile, partial clones (`--filter=blob:none`) help developers and CI.

</details>

### Q15. How would you set up Git for a new 5-person student project?

**Style:** Design

<details>
<summary>Answer</summary>

GitHub repository with README, `.gitignore`, `.gitattributes`, licence; feature-branch workflow; protect `main` (PRs, one approval, required CI build, no force push); branch naming and commit-message conventions; issue templates; squash merges by default; CODEOWNERS for sensitive areas; secrets only in environment variables or Actions secrets; a tag per milestone.

</details>
