# SSH, Keys, scp and rsync — Practice

### P1. Which key goes where?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** public/private keys

To log in to a server with key authentication, what must be placed in the server's `~/.ssh/authorized_keys`?

- A) Your private key `id_ed25519`
- B) Your public key `id_ed25519.pub`
- C) The server's host key
- D) Your password hash

<details>
<summary>Answer</summary>

**Answer:** B) Your public key `id_ed25519.pub`

**Explanation:** The public key verifies signatures made by the private key, which never leaves your machine.

</details>

### P2. Connect on another port

**Difficulty:** Easy · **Type:** Command · **Concepts:** ssh -p, -i

Log in as `deploy` to `203.0.113.10`, whose sshd listens on port 2222, using the key `~/.ssh/deploy_key`.

<details>
<summary>Answer</summary>

```bash
# Illustrative
ssh -p 2222 -i ~/.ssh/deploy_key deploy@203.0.113.10
```

</details>

### P3. Unprotected key

**Difficulty:** Easy · **Type:** Troubleshooting · **Concepts:** key permissions

`ssh` prints `WARNING: UNPROTECTED PRIVATE KEY FILE!` and `Permissions 0644 for '/home/student/.ssh/id_ed25519' are too open`. Fix it.

<details>
<summary>Answer</summary>

```bash
# Illustrative
chmod 600 ~/.ssh/id_ed25519
chmod 700 ~/.ssh
```

The client refuses private keys that other users can read.

</details>

### P4. scp port option

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** scp options

Which command copies `report.pdf` to the home directory of `student` on `server`, where SSH listens on port 2222?

- A) `scp -p 2222 report.pdf student@server:~`
- B) `scp -P 2222 report.pdf student@server:~`
- C) `scp report.pdf student@server:2222:~`
- D) `scp --port 2222 report.pdf student@server`

<details>
<summary>Answer</summary>

**Answer:** B) `scp -P 2222 report.pdf student@server:~`

**Explanation:** `scp` uses capital `-P` for the port; lowercase `-p` preserves modification times. (`ssh` uses lowercase `-p`.)

</details>

### P5. Safe sync

**Difficulty:** Medium · **Type:** Command · **Concepts:** rsync -n, --delete

Mirror the local directory `site/` to `/var/www/site/` on `web01`, deleting remote files that no longer exist locally. Show how to preview the changes first.

<details>
<summary>Answer</summary>

```bash
# Illustrative
rsync -avzn --delete site/ web01:/var/www/site/   # preview
rsync -avz  --delete site/ web01:/var/www/site/   # apply
```

The trailing slash on `site/` copies its contents into `/var/www/site/` instead of creating `/var/www/site/site`.

</details>

### P6. Key refused

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** authorized_keys, StrictModes

You added your public key to `/home/alice/.ssh/authorized_keys` on a server, but login still asks for a password. On the server you see:

```text
drwxrwxr-x 5 alice alice 4096 Jan 15 09:30 /home/alice
drwxrwxr-x 2 alice alice 4096 Jan 15 09:30 /home/alice/.ssh
-rw-rw-r-- 1 alice alice   96 Jan 15 09:30 /home/alice/.ssh/authorized_keys
```

What is wrong and how do you fix it?

<details>
<summary>Answer</summary>

With `StrictModes` (the default), sshd ignores `authorized_keys` when the home directory, `~/.ssh` or the file is writable by the group or others. Fix:

```bash
# Illustrative
chmod 755 /home/alice          # or 750/700 — just not group/other-writable
chmod 700 /home/alice/.ssh
chmod 600 /home/alice/.ssh/authorized_keys
```

The sshd log (`journalctl -u ssh`) shows "Authentication refused: bad ownership or modes".

</details>

### P7. Shortcut config

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** ~/.ssh/config

You often run `ssh -p 2222 -i ~/.ssh/deploy_key deploy@203.0.113.10`. Write a `~/.ssh/config` entry so that `ssh prod` does the same.

<details>
<summary>Answer</summary>

```text
Host prod
    HostName 203.0.113.10
    User deploy
    Port 2222
    IdentityFile ~/.ssh/deploy_key
```

`scp file prod:/tmp/` and `rsync … prod:…` use the same entry.

</details>

### P8. Harden without locking yourself out

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** sshd_config, safe rollout

You must disable root login and password authentication on a remote server you reach only over SSH. List the safe sequence of steps.

<details>
<summary>Answer</summary>

1. Confirm key login works for a non-root user with sudo rights (in a new session).
2. Edit `/etc/ssh/sshd_config` (or a drop-in in `sshd_config.d/`): `PermitRootLogin no`, `PasswordAuthentication no`.
3. Validate the syntax: `sudo sshd -t`.
4. Reload: `sudo systemctl reload ssh` (`sshd` on RHEL) — the existing session stays open.
5. From a **second** terminal, log in again with the key and run `sudo -v`.
6. Only then close the original session. Keep console access (cloud provider serial console) as a fallback.

</details>
