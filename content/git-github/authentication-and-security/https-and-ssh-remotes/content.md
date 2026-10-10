# HTTPS and SSH Remotes

**Module:** GitHub Authentication and Security · **Interview priority:** Frequently asked

## Learning Objectives

- Recognise HTTPS and SSH remote URLs and how each authenticates.
- Choose between them and switch an existing clone with `git remote set-url`.
- Explain why passwords must never be embedded in remote URLs.

## What Is It?

Git talks to GitHub over one of two protocols. The **remote URL's format** decides which:

| Protocol | URL format | You authenticate with |
|----------|-----------|----------------------|
| HTTPS | `https://github.com/your-username/gradebook.git` | A **personal access token** (or a browser sign-in through Git Credential Manager), stored by a credential helper |
| SSH | `git@github.com:your-username/gradebook.git` (or `ssh://git@github.com/your-username/gradebook.git`) | An **SSH key pair**; the public key is registered on GitHub |

Public repositories can be **cloned and fetched** over HTTPS without any authentication; pushing (and anything on a private repository) needs it.

## Why It Matters

Most "Git doesn't work" moments with GitHub are authentication problems: an expired token, a password where a token is required, a key that isn't loaded. Knowing which protocol a repository uses tells you where to look.

> [!IMPORTANT]
> GitHub stopped accepting **account passwords** for Git operations over HTTPS in August 2021. When Git asks for a "password" for github.com, it needs a **personal access token** — or use SSH, or let Git Credential Manager sign you in through the browser.

## How It Works

```text
HTTPS:  git ──TLS──► github.com:443   "Authorization: <token>"   (helper supplies the token)
SSH:    git ──SSH──► github.com:22    proves it holds the private key matching a registered public key
```

Both encrypt the connection; they differ in **what proves your identity** and **how it's stored on your machine**.

## Choosing

| | HTTPS | SSH |
|-|-------|-----|
| Setup | Install Git Credential Manager (bundled with Git for Windows) or create a token | Generate a key, add the public key to GitHub |
| Works through strict corporate proxies/firewalls | Usually (port 443) | Port 22 may be blocked (GitHub also offers SSH over port 443 at `ssh.github.com`) |
| Credential scope | Tokens can be limited to specific repositories and permissions, with expiry | A key gives the access of the account it's added to |
| Day-to-day | Seamless with a credential helper | Seamless with `ssh-agent` |

Either is fine; teams often standardise on one. Many developers use SSH on personal machines and HTTPS with a credential manager elsewhere.

## Switching an Existing Clone

```bash
git remote -v
git remote set-url origin git@github.com:your-username/gradebook.git
git remote -v
```

**Expected result:** both `origin` lines (fetch and push) now show the SSH URL. Nothing else changes — history, branches and tracking stay the same. Test with `git fetch`.

## Never Put Credentials in the URL

```text
https://priya:ghp_EXAMPLE_NOT_A_REAL_TOKEN@github.com/your-username/gradebook.git     ← never
```

A URL like this:

- is saved in **plain text** in `.git/config` (`git remote -v` prints it);
- appears in shell history, CI logs, screenshots and error messages;
- can't be scoped or rotated without editing every clone.

Use a **credential helper** (HTTPS) or **SSH keys** instead — see [Personal Access Tokens and Credential Managers](../tokens-and-credential-managers/content.md) and [SSH Keys for GitHub](../ssh-keys-for-github/content.md). If a token was ever placed in a URL, revoke it.

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git remote -v` | Show URLs (and therefore protocol) | Safe anywhere |
| `git remote set-url origin <url>` | Change protocol or host | Local configuration |
| `git ls-remote origin` | Test access by listing remote refs without fetching | Safe anywhere (contacts the remote) |

## Step-by-Step Example

1. `git remote -v` — HTTPS or SSH?
2. HTTPS: make sure a credential helper is configured (`git config --show-origin credential.helper`).
3. SSH: make sure a key is loaded and registered (`ssh -T git@github.com`).
4. `git ls-remote origin` — if it lists refs, authentication works.

## Common Mistakes

- **Typing the GitHub password** when Git asks for one over HTTPS — use a token or the browser sign-in.
- **Mixing up formats:** `git@github.com:user/repo.git` uses a colon; `https://github.com/user/repo.git` uses slashes.
- **Credentials in URLs** (see above).
- **Assuming SSH is "more secure" by default.** Both are encrypted; what matters is protecting the key or token and limiting its scope.

## Interview Angle

"HTTPS vs SSH for GitHub?" — both encrypted; HTTPS authenticates with tokens via a credential helper and works through most firewalls; SSH uses a key pair, convenient with an agent. Mention the 2021 removal of password authentication and never embedding tokens in URLs.

## Recap

- `https://github.com/...` → token / credential manager; `git@github.com:...` → SSH key.
- Account passwords no longer work for Git over HTTPS on GitHub.
- `git remote set-url` switches protocol in place.
- Never embed credentials in remote URLs.

## Related Topics

- [SSH Keys for GitHub](../ssh-keys-for-github/content.md)
- [Personal Access Tokens and Credential Managers](../tokens-and-credential-managers/content.md)
- [Troubleshooting Remotes and Pushes](../../troubleshooting/troubleshooting-remotes-and-push/content.md)
