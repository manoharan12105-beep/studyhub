# SSH, Keys, scp and rsync

**Module:** SSH and Remote Access · **Interview priority:** Core

## What Is It?

**SSH** (Secure Shell) gives you an encrypted, authenticated shell on a remote machine — the standard way to administer Linux servers. The same protocol carries file transfers (`scp`, `sftp`, `rsync` over SSH) and port forwarding (tunnels).

```text
your laptop                                          server
ssh client  ──── encrypted TCP connection, port 22 ──── sshd (SSH daemon)
  ~/.ssh/id_ed25519      (private key, stays here)      ~/.ssh/authorized_keys  (your public key)
  ~/.ssh/known_hosts     (server fingerprints)          /etc/ssh/sshd_config    (server settings)
```

| Tool | Does |
|------|------|
| `ssh user@host` | Open a remote shell, or run one command remotely |
| `ssh-keygen` | Create a key pair |
| `ssh-copy-id` | Install your public key on a server |
| `scp` | Copy files over SSH |
| `rsync` | Synchronise files and directories efficiently (usually over SSH) |
| `sftp` | Interactive file transfer over SSH |

## Why It Matters

- Every cloud VM, CI deploy and production fix starts with SSH.
- Key-based authentication is both more secure and more convenient than passwords; misconfigured key permissions are a common "Permission denied (publickey)" cause.
- Interview questions: how SSH key authentication works, password vs key authentication, `scp` vs `rsync`, hardening `sshd`.

## Core Concept

### Public-key authentication

A **key pair** consists of a **private key** (secret, stays on your machine, ideally protected by a passphrase) and a **public key** (safe to share). Whatever the private key signs, the public key can verify.

1. You put your **public** key into `~/.ssh/authorized_keys` of the account on the server (once).
2. When you connect, the server sends a challenge; your client signs it with the **private** key.
3. The server verifies the signature with the stored public key. If it matches, you are in — no password crosses the network.

The private key never leaves your machine. Leaking it is like leaking a password; that is why it must be readable only by you (`600`) and should have a passphrase, cached for the session by **ssh-agent**.

### Host keys: is this the right server?

The server has its own key pair. On the first connection your client shows the server's fingerprint and asks you to confirm; it then records it in `~/.ssh/known_hosts`. If the key later changes, SSH refuses with **"REMOTE HOST IDENTIFICATION HAS CHANGED"** — either the server was reinstalled, or someone is intercepting the connection (man-in-the-middle). Verify before removing the old entry (`ssh-keygen -R host`).

### Password vs key authentication

| | Password | Public key |
|---|---|---|
| What is sent | The password (inside the encrypted channel) | A signature; the private key never leaves the client |
| Brute-force risk | High — bots try passwords on every public server | Practically none |
| Reuse / leak risk | Passwords get reused and leaked | Keys are unique per machine/user |
| Automation (scripts, CI) | Needs the password stored somewhere | Natural (with care for the key) |
| Revocation | Change the password | Remove one line from `authorized_keys` |
| Best practice | Disable on servers (`PasswordAuthentication no`) | Use, with a passphrase and ssh-agent |

### Permissions SSH insists on

| Path | Mode | Why |
|------|------|-----|
| `~/.ssh/` | `700` | Only you can see or change key files |
| `~/.ssh/id_ed25519` (private key) | `600` | The client refuses an unprotected private key |
| `~/.ssh/authorized_keys` (server) | `600` | sshd ignores it if others can write to it (`StrictModes`) |
| Home directory | Not writable by group/others | Same reason |

## Commands

### ssh

```bash
# Illustrative: needs a reachable server
ssh student@203.0.113.10                     # interactive shell
ssh -p 2222 student@server                   # non-default port
ssh -i ~/.ssh/deploy_key deploy@server       # a specific key
ssh student@server 'df -h /; uptime'         # run commands and return
ssh -v student@server                        # verbose: debug connection/auth problems
ssh -J bastion.example.com student@10.0.1.5  # jump through a bastion host
```

`exit` or `Ctrl+D` ends the session. A command after the host runs remotely and its output comes back to your terminal — handy in scripts and loops.

### ssh-keygen: create a key pair

```bash
# Illustrative
ssh-keygen -t ed25519 -C "student@devbox"
```

**Output (varies):**

```text
Generating public/private ed25519 key pair.
Your identification has been saved in /home/student/.ssh/id_ed25519
Your public key has been saved in /home/student/.ssh/id_ed25519.pub
The key fingerprint is:
SHA256:/Bli6o5KDOjhc4maRBsgnRHfGDnuWYftBObDwUHT1hc student@devbox
The key's randomart image is:
+--[ED25519 256]--+
|  o..++o .  E.   |
| . +o+=.o . .    |
|o o.o=.*   .     |
|+   . *.+        |
|o+ . o =S .      |
|+o= +  o.o o     |
| Boo  .   o      |
|ooo  o           |
|o ....o          |
+----[SHA256]-----+
```

Interactively it also asks for a file name and a passphrase — use a passphrase for personal keys. The fingerprint and art are different for every key. The resulting files:

```text
-rw------- 1 student student 411 Jan 15 09:30 id_ed25519
-rw-r--r-- 1 student student  96 Jan 15 09:30 id_ed25519.pub
```

The public key is one line, safe to paste anywhere:

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKno6HDN2RlpeA2XjAwsKpPJllEHxRFSwuxo2KkSGkCv student@devbox
```

`ed25519` is the modern default (small, fast, secure). Use `-t rsa -b 4096` only for old systems without ed25519 support. `ssh-keygen -lf key.pub` prints a key's fingerprint.

### Install your public key on a server

```bash
# Illustrative
ssh-copy-id student@server        # appends ~/.ssh/id_ed25519.pub to the server's authorized_keys
# manual equivalent:
cat ~/.ssh/id_ed25519.pub | ssh student@server 'mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
```

### ssh-agent: type the passphrase once

```bash
# Illustrative
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519      # asks for the passphrase once per session
ssh-add -l                     # list loaded keys
```

### ~/.ssh/config: shortcuts

```text
Host web01
    HostName 203.0.113.10
    User deploy
    Port 2222
    IdentityFile ~/.ssh/deploy_key

Host db-internal
    HostName 10.0.1.5
    User student
    ProxyJump bastion.example.com
```

Now `ssh web01` and `scp app.jar web01:/opt/app/` use those settings automatically.

### scp: copy files

```bash
# Illustrative
scp app.jar student@server:/opt/app/              # local → remote
scp student@server:/var/log/app/app.log .         # remote → local
scp -r config/ student@server:/etc/myapp/         # a directory (-r)
scp -P 2222 file.txt student@server:~             # port (capital -P for scp!)
```

### rsync: synchronise efficiently

`rsync` compares source and destination and transfers only **differences**, so repeated syncs of large trees are fast. Over the network it runs through SSH.

| Option | Meaning |
|--------|---------|
| `-a` | Archive: recursive, keep permissions, times, symlinks (and owners when run as root) |
| `-v` / `-h` / `--progress` | Verbose / human sizes / progress |
| `-z` | Compress during transfer |
| `-n` (`--dry-run`) | Show what would happen, change nothing |
| `--delete` | Delete files in the destination that no longer exist in the source |
| `--exclude='*.log'` | Skip matching paths |
| `-e 'ssh -p 2222'` | SSH options |

```bash
# Illustrative
rsync -avz project/ student@server:/srv/project/             # contents of project → /srv/project
rsync -avzn --delete project/ student@server:/srv/project/   # dry run with deletion — check first!
rsync -av --exclude='node_modules' ./ backup:/backups/app/
```

> [!WARNING]
> A trailing slash on the **source** matters: `rsync -a project/ dest/` copies the *contents* of `project` into `dest`, while `rsync -a project dest/` creates `dest/project`. Combined with `--delete`, a wrong slash or wrong destination can delete data — always run with `-n` first.

### Hardening the SSH server (sshd)

Settings in `/etc/ssh/sshd_config` (or a file in `/etc/ssh/sshd_config.d/`):

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers deploy student
```

```bash
# Illustrative: needs root — keep your current session open while testing
sudo sshd -t                       # syntax check
sudo systemctl reload ssh          # the unit is sshd on RHEL
# from a SECOND terminal: ssh student@server   — confirm you can still log in
```

> [!CAUTION]
> Disabling password login before your key works, or a broken `sshd_config`, can lock you out of a remote server. Test the new configuration in a second session before closing the first, and make sure console access exists as a fallback.

Additional measures: `fail2ban` to block brute-force sources, firewall rules limiting port 22 to known networks, a bastion host, and short-lived SSH certificates in larger organisations.

## Examples

### Debug "Permission denied (publickey)"

```bash
# Illustrative
ssh -v student@server 2>&1 | grep -E 'Offering|Authentications|denied'
# on the server (as root):
ls -ld /home/student /home/student/.ssh /home/student/.ssh/authorized_keys
sudo journalctl -u ssh -n 20          # e.g. "Authentication refused: bad ownership or modes"
```

Usual causes: wrong user, key not in `authorized_keys`, wrong permissions or ownership on `~/.ssh` or the home directory, the client offering a different key (fix with `-i`), or `PubkeyAuthentication`/`AllowUsers` restrictions.

### Tunnel to a database that only listens locally on the server

```bash
# Illustrative
ssh -L 5433:localhost:5432 student@dbserver
# now connect a local client to localhost:5433 → forwarded to the server's port 5432
```

## Comparison

### scp vs rsync vs sftp

| | `scp` | `rsync` | `sftp` |
|---|---|---|---|
| Transfers | Whole files every time | Only changes (delta) | Whole files |
| Repeat syncs / resume | No | Yes (efficient) | Partial (`reget`) |
| Delete extra files at destination | No | `--delete` | Manual |
| Dry run | No | `-n` | No |
| Interactive browsing | No | No | Yes (`ls`, `cd`, `get`, `put`) |
| Best for | Quick one-off copies | Backups, deployments, large trees | Ad-hoc browsing and transfers |

### ssh vs telnet

| | SSH | Telnet |
|---|---|---|
| Encryption | Yes | No — passwords travel in clear text |
| Authentication | Passwords, keys, certificates | Passwords |
| Use today | Everything | Never for logins |

## Common Mistakes

- Sharing or copying the **private** key; only the `.pub` file goes to servers.
- Private key or `~/.ssh` readable by others → "UNPROTECTED PRIVATE KEY FILE" (client) or a silently refused key (server).
- Removing a `known_hosts` entry after a "host identification has changed" warning without checking why the key changed.
- Disabling password authentication before testing key login, then closing the only session.
- `scp -p 2222` — in scp lowercase `-p` preserves times; the port is `-P`.
- A wrong trailing slash with `rsync --delete`.
- Leaving `PermitRootLogin yes` and `PasswordAuthentication yes` on internet-facing servers.

## Key Takeaways

- `ssh user@host [command]`; `-p` port, `-i` key, `-v` debug, `-J` jump host; `~/.ssh/config` for shortcuts.
- Key auth: `ssh-keygen -t ed25519`, `ssh-copy-id user@host`; the private key stays private (`600`), the public key goes into `authorized_keys` (`600`, inside a `700` `~/.ssh`).
- Keys beat passwords: no secret sent, no brute force, easy revocation; protect keys with a passphrase and ssh-agent.
- `known_hosts` protects against impostor servers — investigate "host identification has changed".
- `scp` for simple copies (`-r`, `-P`); `rsync -avz` for efficient syncs (`-n` dry run, careful with `--delete` and trailing slashes).
- Harden sshd: no root login, no passwords, test in a second session.
