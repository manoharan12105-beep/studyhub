# HTTPS and SSH Remotes — Interview Questions

## Beginner

### Q1. What is the difference between HTTPS and SSH remotes on GitHub?

**Style:** Comparison

<details>
<summary>Answer</summary>

Both encrypt traffic. HTTPS URLs (`https://github.com/user/repo.git`) authenticate with a personal access token or a browser sign-in stored by a credential helper, and use port 443. SSH URLs (`git@github.com:user/repo.git`) authenticate with an SSH key pair whose public key is registered on GitHub, normally over port 22.

</details>

## Intermediate

### Q2. Why does GitHub reject your password when pushing over HTTPS?

**Style:** Debugging

<details>
<summary>Answer</summary>

Since August 2021 GitHub doesn't accept account passwords for Git operations. You need a personal access token (entered where Git asks for a password), Git Credential Manager's browser sign-in, or an SSH remote with a registered key.

</details>

### Q3. How do you switch a clone from HTTPS to SSH?

**Style:** How

<details>
<summary>Answer</summary>

`git remote set-url origin git@github.com:user/repo.git`, verify with `git remote -v`, and test with `ssh -T git@github.com` or `git fetch`. No re-clone needed.

</details>

## Advanced

### Q4. Why should credentials never be embedded in a remote URL?

**Style:** Why

<details>
<summary>Answer</summary>

The URL is stored in plain text in `.git/config`, printed by `git remote -v`, and leaks into shell history, CI logs, error messages and screenshots. It can't be scoped or rotated centrally. Credential helpers store tokens in the OS keychain, and SSH keys stay in `~/.ssh` (ideally passphrase-protected).

</details>
