# Troubleshooting Remotes and Pushes — Interview Questions

## Beginner

### Q1. A teammate pushed a branch, but `git switch` says "invalid reference". Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

Your clone hasn't fetched it — remote-tracking branches update only on fetch. Run `git fetch`, then `git switch <branch>`, which creates a local branch tracking `origin/<branch>`.

</details>

## Intermediate

### Q2. GitHub rejected your push because of a 150 MB file. You deleted the file and pushed again, but it's still rejected. Why?

**Style:** Trap

<details>
<summary>Answer</summary>

The push includes all new commits, and an earlier one still contains the file. Remove it from the unpushed history (amend, interactive rebase or `git filter-repo`), then push; use `.gitignore` or Git LFS going forward.

</details>

### Q3. How do you diagnose an authentication failure when pushing?

**Style:** How

<details>
<summary>Answer</summary>

`git remote -v` to see HTTPS or SSH. HTTPS: check the credential helper, clear a cached expired or wrong token, verify the token's repository permissions and SSO authorisation. SSH: `ssh -T git@github.com`, `ssh-add -l`, verify the public key is on the right account. `git ls-remote origin` tests access without changing anything.

</details>

## Advanced

### Q4. Someone force-pushed `main` and erased three commits. How do you recover them?

**Style:** Scenario

<details>
<summary>Answer</summary>

On any clone that fetched before the force push, `git reflog show origin/main` (or `origin/main@{1}`) gives the previous tip; the force pusher's own `git reflog` works too. Push it back with a lease, e.g. `git push --force-with-lease=main:<bad-tip> origin <old-tip>:main`, then re-apply any wanted new commits. Afterwards enable branch protection to block force pushes.

</details>
