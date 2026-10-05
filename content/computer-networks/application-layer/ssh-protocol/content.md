# SSH: Secure Remote Access

**Module:** Application Layer · **Interview priority:** Frequently asked

## What Is It?

**SSH** (Secure Shell) gives you an **encrypted, authenticated** connection to a remote machine over TCP **port 22**. Over it you can run a remote shell, transfer files (**SCP**, **SFTP**), and tunnel other TCP traffic (**port forwarding**). It replaced Telnet, rlogin and FTP for administration.

## Why It Exists

Administering servers over a network means sending passwords and commands across links you do not control. Telnet sent them in clear text — anyone on the path could read them. SSH provides **confidentiality** (encryption), **integrity** (tamper detection), **server authentication** (you are talking to the real server) and **user authentication** (keys or passwords).

## How It Works

### Connection setup

```text
Client                                              Server (sshd :22)
  │── TCP three-way handshake ───────────────────────►│
  │◄── version strings: "SSH-2.0-OpenSSH_9.x" ───────│
  │── key exchange (e.g. Curve25519 Diffie-Hellman) ─►│  → shared session keys
  │◄── server proves its identity with its HOST KEY ──│  client checks known_hosts
  │══ encrypted channel from here on ════════════════│
  │── user authentication (public key or password) ──►│
  │══ channels: shell, exec, SFTP, port forwards ═════│
```

1. **Key exchange:** both sides derive the same symmetric session keys with Diffie-Hellman — an eavesdropper cannot compute them.
2. **Server authentication:** the server signs the exchange with its **host key**. The client compares the key with `~/.ssh/known_hosts`. On first contact you see *"The authenticity of host … can't be established … fingerprint is SHA256:…"* (trust on first use). A **changed** host key triggers a loud warning — possibly a man-in-the-middle, or a reinstalled server.
3. **User authentication:** usually **public-key**: the client proves it holds the private key (`~/.ssh/id_ed25519`) matching a public key in the server's `~/.ssh/authorized_keys` by signing a challenge. The private key never leaves the client. Passwords are possible but weaker.
4. **Channels:** one encrypted connection carries several logical channels — the shell, file transfers, forwarded ports.

### Keys: symmetric and asymmetric together

| Key | Type | Purpose |
|-----|------|---------|
| Host key (server) | Asymmetric key pair | Proves the server's identity |
| User key (client) | Asymmetric key pair | Proves the user's identity without sending a password |
| Session keys | Symmetric (e.g. AES, ChaCha20) | Encrypt the actual traffic — fast |

The same pattern — asymmetric crypto to authenticate and agree on keys, symmetric crypto for bulk data — is used by TLS ([Encryption Fundamentals](../../https-and-tls/encryption-fundamentals/content.md)).

### Common uses

```bash
# Illustrative: needs a reachable server
ssh deploy@203.0.113.20                          # remote shell
ssh -i ~/.ssh/id_ed25519 deploy@203.0.113.20     # choose a key
scp app.jar deploy@203.0.113.20:/opt/app/        # copy a file
sftp deploy@203.0.113.20                         # interactive file transfer
ssh -L 5433:db.internal:5432 deploy@bastion      # local port forward
```

### Port forwarding (tunnelling)

`ssh -L 5433:db.internal:5432 deploy@bastion` opens port 5433 on **your** machine; anything connecting to `localhost:5433` is carried inside the SSH connection to the bastion, which connects to `db.internal:5432`. You can reach a private PostgreSQL through a jump host without exposing it to the Internet.

```text
pgAdmin → localhost:5433 ══ SSH (encrypted, port 22) ══► bastion ──► db.internal:5432
```

`-R` does the reverse (expose a local port on the remote side); `-D` creates a SOCKS proxy.

## Comparison

| | Telnet | SSH |
|---|--------|-----|
| Port | 23 | 22 |
| Encryption | None | Yes |
| Server authentication | None | Host keys |
| User authentication | Password in clear text | Public key or password (encrypted) |
| Extras | — | SCP/SFTP, port forwarding, agent forwarding |

## Real World

- Hardening (covered in the [Linux SSH topic](../../../linux/remote-access/ssh-and-remote-access/content.md)): disable password and root login, use keys, restrict with firewall rules or a bastion host, consider fail2ban.
- CI/CD pipelines deploy over SSH with deploy keys; Git uses SSH for `git@github.com:…` remotes.
- Cloud alternatives (AWS SSM Session Manager) avoid opening port 22 at all.

## Common Traps

- **"SSH encrypts with my private key."** Traffic is encrypted with symmetric session keys from the key exchange; your private key only proves who you are.
- **"Ignore the host key warning."** A changed host key can mean a man-in-the-middle; verify the fingerprint first.
- **"Changing SSH to port 2222 secures it."** It reduces noise from bots; real security comes from keys, no passwords and firewall rules.

## Interview Follow-up

- *"How does SSH key authentication work?"* The server checks a signature made with your private key against the public key in `authorized_keys`.
- *"How would you reach a database in a private subnet from your laptop?"* SSH local port forwarding through a bastion (or a VPN).

## Key Takeaways

- SSH = encrypted, authenticated remote access over TCP 22; replaces Telnet/FTP.
- Key exchange → session keys; host key → server identity (known_hosts); user key → client identity (authorized_keys).
- SCP/SFTP for files; `-L`/`-R`/`-D` for tunnelling.
- Asymmetric keys authenticate; symmetric keys encrypt the traffic.
