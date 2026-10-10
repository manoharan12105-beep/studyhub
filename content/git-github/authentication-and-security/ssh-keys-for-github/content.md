# SSH Keys for GitHub

**Module:** GitHub Authentication and Security · **Interview priority:** Frequently asked

> [!NOTE]
> `ssh-keygen` output below comes from a real run (OpenSSH 10.2) with a throwaway key that was deleted afterwards. Adding a key on github.com and `ssh -T git@github.com` were **not** run; their results are described from GitHub's documented behaviour.

## Learning Objectives

- Explain the public/private key pair and which half goes where.
- Generate an Ed25519 key with a passphrase, load it into `ssh-agent`, and add the public key to GitHub.
- Test authentication and diagnose the common failure.

## What Is It?

An **SSH key pair** is two linked files:

- the **private key** (`~/.ssh/id_ed25519`) — stays on your computer, never shared, ideally protected by a **passphrase**;
- the **public key** (`~/.ssh/id_ed25519.pub`) — safe to share; you paste it into GitHub (**Settings → SSH and GPG keys → New SSH key**).

When you connect, GitHub challenges your SSH client to prove it holds the private key matching a registered public key — without the private key ever being sent.

## Why It Matters

SSH keys give password-less, phishing-resistant authentication for every Git operation. Handled badly — a private key copied to a shared machine, committed to a repository, or without a passphrase on a laptop that gets stolen — they hand your GitHub access to someone else.

## How It Works

```text
your laptop                                   github.com
~/.ssh/id_ed25519      (private, secret)
~/.ssh/id_ed25519.pub  (public) ── pasted once ──► stored on your account

git push ──► SSH handshake: "prove you have the private key for one of these public keys"
         ◄── signed challenge verified with the public key ──► you are priya on GitHub
```

**`ssh-agent`** is a background program that holds your **decrypted** private key in memory, so you type the passphrase once per session instead of on every `git push`.

## Generating a Key

```bash
ssh-keygen -t ed25519 -C "priya@example.com"
```

Without `-f`, it asks where to save (press Enter for `~/.ssh/id_ed25519`) and for a **passphrase** (use one). The output:

**Output (varies):**

```text
Generating public/private ed25519 key pair.
Your identification has been saved in /home/student/.ssh/id_ed25519
Your public key has been saved in /home/student/.ssh/id_ed25519.pub
The key fingerprint is:
SHA256:HthXxPGXbt2ZI6pBihP/KHLmszv8tcw6BPZiBL1Ruu8 priya@example.com
The key's randomart image is:
+--[ED25519 256]--+
|    . ..   .o.   |
|   . o.    ...  .|
|    ..o     . ...|
|     =.o   .  ..=|
|    oo+ S..  . *o|
|     o=+oo  . o .|
|    ooo+.o .     |
|   . Bo.* +      |
|    =+BEo*       |
+----[SHA256]-----+
```

- `-t ed25519` — the modern, recommended key type (short, fast, secure). Use `-t rsa -b 4096` only for systems that don't support Ed25519.
- `-C` — a comment (usually your email) to recognise the key later.
- The **fingerprint** identifies the key; GitHub shows the same fingerprint next to registered keys.

The public key is one line starting with `ssh-ed25519 AAAAC3NzaC1lZDI1NT…` and ending with the comment.

## Loading the Key into ssh-agent

```bash
eval "$(ssh-agent -s)"           # start the agent in this shell (Git Bash, Linux)
ssh-add ~/.ssh/id_ed25519        # asks for the passphrase once
ssh-add -l                       # list loaded keys (fingerprints)
```

On macOS add `--apple-use-keychain` to `ssh-add` to store the passphrase in the keychain; on Windows the OpenSSH Authentication Agent service can be enabled instead of `eval`.

## Adding the Public Key to GitHub

1. Copy the **public** key: `cat ~/.ssh/id_ed25519.pub` (on Windows Git Bash, `clip < ~/.ssh/id_ed25519.pub`).
2. github.com → **Settings → SSH and GPG keys → New SSH key**; title it after the machine ("Priya laptop 2026"), key type *Authentication Key*, paste, save.

## Testing

```bash
ssh -T git@github.com
```

**Expected result:** on first connection SSH asks you to confirm GitHub's host key fingerprint — compare it with the fingerprints GitHub publishes in its documentation before typing `yes`. Then GitHub replies with `Hi your-username! You've successfully authenticated, but GitHub does not provide shell access.` If the key isn't registered or loaded, you get `git@github.com: Permission denied (publickey).`

Diagnose with `ssh -vT git@github.com`: the verbose log shows which key files were offered.

## Security Practices

> [!CAUTION]
> Never share, email, paste into a website, or commit the **private** key (the file **without** `.pub`). If it might be exposed, delete the key from your GitHub account immediately and generate a new one. StudyHub never asks for keys — don't paste them anywhere.

- Use a **passphrase**; the agent makes it painless.
- One key per machine, named by machine, so a lost laptop means revoking one key.
- Private key permissions on Linux/macOS: `chmod 600 ~/.ssh/id_ed25519` (SSH refuses keys that others can read).
- Periodically review **Settings → SSH and GPG keys** and remove keys you don't recognise or no longer use.
- **Deploy keys** (per-repository keys for servers) should be read-only unless a server must push.

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `ssh-keygen -t ed25519 -C "<email>"` | Create a key pair | Creates secret material — keep it private |
| `ssh-add <key>` / `ssh-add -l` | Load / list keys in the agent | Local |
| `ssh -T git@github.com` | Test authentication | Contacts GitHub; read-only |
| `ssh -vT git@github.com` | Debug which keys are offered | Same |

## Step-by-Step Example

1. `ls ~/.ssh` — an existing `id_ed25519.pub`? Reuse it.
2. Otherwise `ssh-keygen -t ed25519 -C "priya@example.com"` with a passphrase.
3. `ssh-add ~/.ssh/id_ed25519`.
4. Add the `.pub` contents on GitHub.
5. `ssh -T git@github.com` — greeting with your username.
6. `git remote set-url origin git@github.com:your-username/gradebook.git` and `git fetch`.

## Common Mistakes

- **Uploading the private key** instead of the `.pub` file.
- **No passphrase** on a laptop key.
- **Key generated but not loaded/offered** — `Permission denied (publickey)`.
- **Using the HTTPS URL** after setting up SSH — the key isn't used until the remote URL is `git@github.com:…`.
- **Blindly typing `yes`** to an unexpected host-key prompt, or deleting `known_hosts` entries when SSH warns that a host key changed.

## Interview Angle

"How does SSH authentication with GitHub work?" — key pair; public key registered on GitHub; the client proves possession of the private key in a challenge; the private key never leaves the machine. Mention Ed25519, passphrases with `ssh-agent`, and per-machine keys.

## Recap

- Private key stays home (with a passphrase); public key goes to GitHub.
- `ssh-keygen -t ed25519`, `ssh-add`, add `.pub` on GitHub, `ssh -T git@github.com`.
- `Permission denied (publickey)` = key not registered, not loaded, or wrong URL.
- One key per machine; revoke immediately if exposed.

## Related Topics

- [HTTPS and SSH Remotes](../https-and-ssh-remotes/content.md)
- [Personal Access Tokens and Credential Managers](../tokens-and-credential-managers/content.md)
- Computer Networks: [SSH Protocol](../../../computer-networks/application-layer/ssh-protocol/content.md)
