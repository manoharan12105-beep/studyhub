# Personal Access Tokens and Credential Managers — Interview Questions

## Beginner

### Q1. What is a personal access token?

**Style:** What

<details>
<summary>Answer</summary>

A generated secret that authenticates as you with limited permissions, used for Git over HTTPS, the GitHub API and CLI tools. It replaces your account password for Git operations and can be scoped, given an expiry and revoked individually.

</details>

## Intermediate

### Q2. Fine-grained vs classic tokens — which would you choose and why?

**Style:** Comparison

<details>
<summary>Answer</summary>

Fine-grained: restricted to selected repositories (and one owner) with specific permissions and an expiry, so a leak exposes little. Classic tokens use broad scopes like `repo` that cover every repository you can access. Use classic only when a tool doesn't support fine-grained tokens, with minimal scopes.

</details>

### Q3. What is a credential helper?

**Style:** What

<details>
<summary>Answer</summary>

A program Git calls to fetch and save credentials. Helpers like Git Credential Manager, macOS Keychain or libsecret store tokens in the OS's secure storage (GCM can also do browser sign-in), so you authenticate once. The `store` helper saves them in plain text and should be avoided.

</details>

## Advanced

### Q4. After rotating your token, every push fails with "Authentication failed". Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

The credential helper still has the old, revoked token cached and keeps sending it. Remove the stored credential for github.com (OS keychain / Windows Credential Manager entry, or the helper's logout/erase command) and authenticate again with the new token.

</details>

### Q5. Why does GitHub answer "Repository not found" for a private repository that exists?

**Style:** Trap

<details>
<summary>Answer</summary>

To avoid revealing which private repositories exist, GitHub responds as if the repository doesn't exist when the credentials can't access it. Causes: the token lacks access to that repository/organisation, it isn't authorised for the organisation's SSO, or the wrong account's credentials are cached.

</details>
