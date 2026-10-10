# Troubleshooting Commits and Branches — Interview Questions

## Beginner

### Q1. You committed to `main` instead of a feature branch and haven't pushed. How do you fix it?

**Style:** Scenario

<details>
<summary>Answer</summary>

`git branch feature/x` (keeps the commit on a new branch), `git reset --hard HEAD~1` (moves `main` back; check `git status` first), `git switch feature/x`. If the feature branch already exists, cherry-pick the commit onto it and then reset `main`.

</details>

### Q2. How do you unstage a file you added by mistake?

**Style:** How

<details>
<summary>Answer</summary>

`git restore --staged <file>` (or `git reset <file>`). The file and its edits stay in the working directory.

</details>

## Intermediate

### Q3. Your last three unpushed commits have the wrong author email. How do you fix them?

**Style:** How

<details>
<summary>Answer</summary>

Fix `user.email` first, then `git rebase -r HEAD~3 --exec "git commit --amend --reset-author --no-edit"` (or amend each commit during an interactive rebase). For a single commit, `git commit --amend --reset-author --no-edit`. Verify with `git log --format='%an <%ae>'`.

</details>

### Q4. You accidentally committed `target/` and already pushed. What now?

**Style:** Scenario

<details>
<summary>Answer</summary>

Add `target/` to `.gitignore`, `git rm -r --cached target/`, commit and push — a normal new commit, no history rewrite. The old commit still contains the files, which is acceptable for build output (not for secrets, which must be rotated).

</details>

## Advanced

### Q5. Why is "pushed or not" the first question in every fix?

**Style:** Why

<details>
<summary>Answer</summary>

Unpushed commits exist only in your clone, so rewriting them (amend, reset, rebase) affects nobody. Pushed commits may be in teammates' clones, CI runs and deployments; rewriting them forces others to reconcile duplicated or vanished commits. For pushed work, fixes should add commits (revert, follow-up) unless the team agrees to a coordinated rewrite.

</details>
