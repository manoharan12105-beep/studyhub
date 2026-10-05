# SSH, Keys, scp and rsync — Interview Questions

## Beginner

### Q1. What is SSH?

<details>
<summary>Answer</summary>

Secure Shell: an encrypted protocol (TCP port 22 by default) for logging in to remote machines, running commands, transferring files (`scp`, `sftp`, `rsync`) and tunnelling ports. The client is `ssh`; the server daemon is `sshd`.

</details>

### Q2. How does SSH key-based authentication work?

<details>
<summary>Answer</summary>

You generate a key pair; the public key is added to `~/.ssh/authorized_keys` on the server. At login the server sends a challenge, the client signs it with the private key, and the server verifies the signature with the public key. The private key never leaves the client and no password is transmitted.

</details>

### Q3. How do you generate a key pair and install it on a server?

<details>
<summary>Answer</summary>

`ssh-keygen -t ed25519 -C "you@host"` (with a passphrase), then `ssh-copy-id user@server`, which appends the public key to the server's `~/.ssh/authorized_keys` with correct permissions.

</details>

### Q4. How do you copy a file to a remote server?

<details>
<summary>Answer</summary>

`scp file.txt user@server:/path/` (directories with `-r`, port with `-P`), or `rsync -avz file.txt user@server:/path/`. From the server back: `scp user@server:/path/file.txt .`.

</details>

## Intermediate

### Q5. Why is key authentication considered more secure than passwords?

<details>
<summary>Answer</summary>

No reusable secret is sent to the server, keys are far too long to brute-force, they cannot be guessed or reused from leaked password lists, and a compromised server cannot capture them. Access is revoked per key by deleting one line. With password authentication disabled, automated password-guessing attacks become pointless.

</details>

### Q6. What is the difference between scp and rsync?

<details>
<summary>Answer</summary>

`scp` copies whole files every time. `rsync` compares source and destination and sends only differences, preserves attributes (`-a`), can delete extraneous destination files (`--delete`), exclude patterns and do dry runs (`-n`). For repeated syncs, backups and large trees, `rsync` is much more efficient.

</details>

### Q7. You see "WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!". What does it mean and what do you do?

<details>
<summary>Answer</summary>

The server presented a different host key from the one recorded in `~/.ssh/known_hosts`. Legitimate reasons: the server was rebuilt or its IP now belongs to another machine. Dangerous reason: a man-in-the-middle. Verify the new fingerprint through a trusted channel (console, cloud provider, the team), then remove the old entry with `ssh-keygen -R host` and reconnect. Never accept it blindly.

</details>

### Q8. SSH refuses your key with "Permission denied (publickey)". What do you check?

<details>
<summary>Answer</summary>

Client side: the right user and host, which key is offered (`ssh -v`, `-i keyfile`), private key permissions (`600`). Server side: the public key is in the correct user's `~/.ssh/authorized_keys`; ownership and permissions of the home directory, `~/.ssh` (`700`) and `authorized_keys` (`600`); `sshd_config` (`PubkeyAuthentication`, `AllowUsers`, `AuthorizedKeysFile`); and the sshd log (`journalctl -u ssh`) for messages like "bad ownership or modes".

</details>

### Q9. How do you run a command on a remote server without opening an interactive shell?

<details>
<summary>Answer</summary>

Put it after the host: `ssh user@server 'systemctl status nginx --no-pager'`. The output returns to your terminal and the exit status is the remote command's. Quote the command so variables and pipes are interpreted remotely, not by your local shell.

</details>

## Advanced

### Q10. How would you harden SSH on an internet-facing server?

<details>
<summary>Answer</summary>

Key authentication only (`PasswordAuthentication no`, `KbdInteractiveAuthentication no`), no root login (`PermitRootLogin no`), restrict users or groups (`AllowUsers`/`AllowGroups`), keep OpenSSH updated, limit access with a firewall or security group (or a bastion/VPN), add brute-force protection (`fail2ban`), and use modern key types. Validate with `sshd -t` and test in a second session before closing the first.

</details>

### Q11. What is SSH local port forwarding and when is it useful?

<details>
<summary>Answer</summary>

`ssh -L 5433:localhost:5432 user@dbserver` opens local port 5433 and forwards connections through the encrypted SSH session to port 5432 as seen from `dbserver`. It reaches a service that listens only on the server's loopback or a private network (a database, an admin UI) without exposing it publicly. `-R` forwards in the reverse direction; `-D` creates a SOCKS proxy.

</details>

### Q12. What does the trailing slash mean in `rsync -av src/ dest/` vs `rsync -av src dest/`?

<details>
<summary>Answer</summary>

With `src/` rsync copies the **contents** of `src` into `dest`; with `src` it copies the directory itself, creating `dest/src`. Combined with `--delete`, getting this wrong can delete files in the destination, so run with `-n` (dry run) first.

</details>
