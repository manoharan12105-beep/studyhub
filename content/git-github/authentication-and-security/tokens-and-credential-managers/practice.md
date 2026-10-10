# Personal Access Tokens and Credential Managers — Practice

### P1. Least privilege

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** token permissions

You need a token only to push to `your-username/gradebook`. Which is the best choice?

- A) Classic token with all scopes, no expiry
- B) Classic token with `repo` scope
- C) Fine-grained token for `gradebook` only, Contents read and write, 90-day expiry
- D) Your account password

<details>
<summary>Answer</summary>

**Answer:** C) Fine-grained token for `gradebook` only, Contents read and write, 90-day expiry

</details>

### P2. Plain-text risk

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** credential helpers

Why is `git config --global credential.helper store` risky on a shared lab computer?

<details>
<summary>Answer</summary>

It saves your username and token in plain text in `~/.git-credentials`, readable by anyone with access to that account or disk. Use a keychain-backed helper (Git Credential Manager) or the in-memory `cache` helper, and remove credentials when you leave.

</details>

### P3. Read the error

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** password removal

`git push` prints `remote: Support for password authentication was removed on August 13, 2021.` What did you do, and what are your options?

<details>
<summary>Answer</summary>

You entered your GitHub account password at the HTTPS prompt. Use a personal access token at that prompt, sign in through Git Credential Manager's browser flow, or switch to an SSH remote with a registered key.

</details>

### P4. Leaked token

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** incident response

You realise you pasted a token into a public issue comment an hour ago. List the steps in order.

<details>
<summary>Answer</summary>

1. Revoke the token on GitHub immediately. 2. Delete or edit the comment (edit history may still show it — the revocation is what matters). 3. Check your account's security log and the affected repositories for unexpected activity. 4. Create a new, narrower token and update the credential helper. 5. Review how it happened (copy-paste habit) to avoid repeats.

</details>
