# SSH Keys for GitHub — Interview Questions

## Beginner

### Q1. What are the public and private keys in an SSH key pair?

**Style:** What

<details>
<summary>Answer</summary>

Two mathematically linked keys. The private key stays secret on your machine (ideally passphrase-protected); the public key can be shared and is registered on GitHub. Data signed with the private key can be verified with the public key, which is how you prove your identity without sending a secret.

</details>

### Q2. How do you set up SSH access to GitHub?

**Style:** How

<details>
<summary>Answer</summary>

Generate a key (`ssh-keygen -t ed25519 -C "email"`), load it into `ssh-agent` (`ssh-add`), add the `.pub` contents in GitHub's SSH keys settings, test with `ssh -T git@github.com`, and use SSH remote URLs (`git@github.com:user/repo.git`).

</details>

## Intermediate

### Q3. `git push` fails with "Permission denied (publickey)". How do you debug it?

**Style:** Debugging

<details>
<summary>Answer</summary>

Check the remote is an SSH URL (`git remote -v`); check a key is loaded (`ssh-add -l`) or present in `~/.ssh`; check its public key is registered on the right GitHub account (compare fingerprints); run `ssh -vT git@github.com` to see which keys are offered; check private-key file permissions on Linux/macOS.

</details>

### Q4. What is `ssh-agent` for?

**Style:** Why

<details>
<summary>Answer</summary>

It holds decrypted private keys in memory for your session, so you enter the passphrase once and Git can authenticate repeatedly without asking — keeping the security of a passphrase without the inconvenience.

</details>

## Advanced

### Q5. Your laptop was stolen. What do you do about SSH access?

**Style:** Scenario

<details>
<summary>Answer</summary>

Delete that machine's public key from your GitHub account (and from any servers or deploy keys) immediately, review the account's security log for unexpected activity, and generate a new key on the replacement machine. Per-machine keys mean only one key needs revoking; a passphrase buys time but isn't a reason to wait.

</details>
