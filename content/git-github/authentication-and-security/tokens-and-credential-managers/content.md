# Personal Access Tokens and Credential Managers

**Module:** GitHub Authentication and Security · **Interview priority:** Frequently asked

> [!NOTE]
> Token types and settings describe GitHub as of 2026 (**Instruction only** — no tokens were created for this lesson). The `git config` commands are standard Git.

## Learning Objectives

- Explain what a personal access token (PAT) is and why it replaced passwords for Git over HTTPS.
- Create tokens with the least privilege and an expiry; choose fine-grained over classic tokens.
- Store credentials safely with a credential helper and diagnose authentication failures.

## What Is It?

- A **personal access token** is a generated secret string that acts **on your behalf** with limited permissions, for Git over HTTPS, the GitHub API and the `gh` CLI. GitHub offers **fine-grained** tokens (restricted to chosen repositories and specific permissions, e.g. *Contents: read and write*) and **classic** tokens (broad **scopes** such as `repo`, `workflow`, `read:org` across everything you can access).
- A **credential helper** is the program Git asks for usernames and secrets; it stores them in the operating system's secure storage so you don't type them repeatedly. **Git Credential Manager (GCM)** — bundled with Git for Windows and available for macOS and Linux — can also sign you in to GitHub through the browser and manage tokens itself.

## Why It Matters

Tokens are passwords with superpowers: they don't expire unless you set it, they often bypass two-factor prompts, and a classic `repo` token opens every repository you can reach. Least privilege and safe storage decide whether a leaked token is an inconvenience or a breach.

## How It Works

```text
git push (HTTPS) ──► needs credentials for github.com
                     │
          credential helper (manager / osxkeychain / libsecret / cache)
                     │  stored? → returns it        not stored? → prompts (or browser sign-in)
                     ▼
        username + token sent over TLS ──► GitHub checks the token's permissions
```

## Configuring a Credential Helper

| Platform | Helper | Setting |
|----------|--------|---------|
| Windows (Git for Windows) | Git Credential Manager | `git config --global credential.helper manager` (installer default) |
| macOS | Keychain, or GCM | `git config --global credential.helper osxkeychain` |
| Linux desktop | GCM or libsecret | Install GCM and run `git-credential-manager configure` |
| Temporary (any) | In-memory cache | `git config --global credential.helper "cache --timeout=3600"` |

> [!CAUTION]
> `credential.helper store` writes credentials in **plain text** to `~/.git-credentials`. Avoid it on any machine others can access.

Captured in the lab with a fake value: after Git stored a credential through the `store` helper, the file contained exactly this line:

```text
https://priya:not-a-real-token@github.com
```

Check what's active: `git config --show-origin --get-all credential.helper`.

## Creating a Token (Least Privilege)

On github.com: **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.

1. **Name** it for its purpose ("gradebook laptop push").
2. **Expiration:** short — 30 or 90 days.
3. **Resource owner** and **Repository access:** *Only select repositories* → `gradebook`.
4. **Permissions:** for push/pull, *Contents: Read and write* (and *Metadata: Read*, added automatically). Nothing else.
5. Copy the token **once** — GitHub won't show it again — and paste it at Git's password prompt; the credential helper stores it.

Prefer fine-grained tokens. Use a classic token only when a tool requires it, with the narrowest scopes (`repo` is broad; `workflow` is needed only to change workflow files).

## Authentication Failures

| Message | Likely cause | Fix |
|---------|--------------|-----|
| `remote: Support for password authentication was removed …` | Account password used | Use a token, browser sign-in, or SSH |
| `fatal: Authentication failed for 'https://github.com/…'` | Wrong, expired or revoked token cached | Remove the stored credential (OS keychain / Windows Credential Manager entry for `git:https://github.com`, or `printf 'protocol=https\nhost=github.com\n\n' \| git credential reject`, which asks every configured helper to erase it) and sign in again |
| `remote: Repository not found.` (for a repo you know exists) | Token lacks access to that repository or org; or wrong account cached | Check the token's repository access and owner; check the URL |
| `403` / `Permission to … denied` | Read-only access or missing *Contents: write* | Adjust permissions or ask for access |
| SSO-protected organisation refuses | Token not authorised for the organisation's SSO | Authorise the token for that organisation |

GitHub returns "not found" rather than "forbidden" for private repositories you can't access, so you can't probe which private repositories exist.

## Token Hygiene

- Never commit a token, paste it into chat, issues, StudyHub or screenshots, or embed it in a remote URL.
- One token per purpose and machine; delete tokens you no longer use.
- In CI, use the platform's built-in short-lived credentials (GitHub Actions' `GITHUB_TOKEN`) or secrets — see DevOps: [CI with GitHub Actions](../../../devops/ci-cd/ci-with-github-actions/content.md).
- If a token leaks: **revoke it first**, then investigate (Settings → Security log) — see [Secrets in Git History](../secrets-in-git-history/content.md).

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git config --global credential.helper <helper>` | Choose the helper | Local configuration |
| `git config --show-origin --get-all credential.helper` | Which helpers are active | Safe anywhere |
| `git ls-remote https://github.com/your-username/gradebook.git` | Test HTTPS access | Contacts GitHub; read-only |

## Step-by-Step Example

1. Windows: Git for Windows already uses GCM — `git push` opens a browser sign-in once.
2. Elsewhere: create a fine-grained token for `gradebook` with *Contents: read and write*, 90-day expiry.
3. `git push` → enter your GitHub username and paste the token as the password; the helper stores it.
4. When it expires, Git fails with "Authentication failed": clear the stored credential and repeat with a new token.

## Common Mistakes

- **Classic tokens with every scope ticked** "to make it work".
- **Tokens without expiry** forgotten on old machines.
- **`credential.helper store`** on shared machines.
- **Wrong account cached** — pushing to a work repository with a personal token.

## Interview Angle

"How do you authenticate to GitHub over HTTPS?" — personal access token (fine-grained, least privilege, expiring) or browser sign-in through Git Credential Manager; never the account password; stored by a credential helper, never in URLs or code.

## Recap

- PATs replace passwords for Git over HTTPS; fine-grained tokens limit repositories and permissions.
- Credential helpers store secrets in the OS keychain; avoid plain-text `store`.
- Authentication errors usually mean an expired, wrong or under-privileged cached token.
- Revoke leaked tokens immediately.

## Related Topics

- [HTTPS and SSH Remotes](../https-and-ssh-remotes/content.md)
- [Secrets in Git History](../secrets-in-git-history/content.md)
- [Troubleshooting Remotes and Pushes](../../troubleshooting/troubleshooting-remotes-and-push/content.md)
