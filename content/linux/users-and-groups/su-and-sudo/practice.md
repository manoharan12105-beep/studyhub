# su and sudo — Practice

### P1. Whose password?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** su vs sudo

Alice (a member of group `sudo`) runs `sudo apt update`. Which password is she asked for?

- A) root's password
- B) Her own password
- C) No password ever
- D) The password of the `sudo` group

<details>
<summary>Answer</summary>

**Answer:** B) Her own password

**Explanation:** `sudo` authenticates the invoking user (unless the rule says `NOPASSWD`). `su` is the command that asks for the target user's password.

</details>

### P2. Clean root environment

**Difficulty:** Easy · **Type:** Command · **Concepts:** sudo -i

On an Ubuntu server where root has no password, open an interactive root shell with root's full login environment.

<details>
<summary>Answer</summary>

```bash
# Illustrative: needs sudo rights
sudo -i
```

`su -` would fail because the root password is locked.

</details>

### P3. Run as another user

**Difficulty:** Easy · **Type:** Command · **Concepts:** sudo -u

Run `psql` as the `postgres` user.

<details>
<summary>Answer</summary>

```bash
# Illustrative
sudo -u postgres psql
```

</details>

### P4. What am I allowed to do?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** sudo -l

Which command lists the sudo rules that apply to you?

- A) `sudo -i`
- B) `sudo -k`
- C) `sudo -l`
- D) `visudo -c`

<details>
<summary>Answer</summary>

**Answer:** C) `sudo -l`

**Explanation:** `-k` forgets cached credentials, `-i` opens a root shell, `visudo -c` checks the sudoers syntax.

</details>

### P5. Write a rule

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** sudoers syntax

Write a sudoers rule letting members of group `support` run `/usr/bin/journalctl` as root without a password, and say how you would install it safely.

<details>
<summary>Answer</summary>

```text
%support ALL=(root) NOPASSWD: /usr/bin/journalctl
```

Install with `sudo visudo -f /etc/sudoers.d/support`, which checks the syntax. (Note that `journalctl` pages output through `less`, which allows shell escapes; set `SYSTEMD_PAGER=` or allow only `journalctl --no-pager` with specific arguments for a truly restricted rule.)

</details>

### P6. Missing admin commands

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** su vs su -

After `su` (without `-`) on a RHEL server, `useradd` says "command not found", although it exists in `/usr/sbin`. Explain.

<details>
<summary>Answer</summary>

Plain `su` keeps the caller's environment, including a `PATH` that may not contain `/usr/sbin`. `su -` (login shell) loads root's environment and `PATH`. Alternatively use the full path or `sudo`.

</details>

### P7. Shell escape

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** sudo security

An auditor finds `%interns ALL=(root) NOPASSWD: /usr/bin/vim /etc/nginx/nginx.conf`. Why is this effectively full root access, and what should replace it?

<details>
<summary>Answer</summary>

Inside `vim` running as root, `:!bash` (or `:shell`) starts a root shell, and `:e /etc/shadow` opens any file. Replace it with `sudoedit`: `%interns ALL=(root) sudoedit /etc/nginx/nginx.conf`. `sudoedit` copies the file, runs the user's editor **as the user**, and writes the result back as root.

</details>

### P8. Audit trail

**Difficulty:** Medium · **Type:** Command · **Concepts:** sudo logging

Show the most recent sudo commands recorded on an Ubuntu server (two ways).

<details>
<summary>Answer</summary>

```bash
# Illustrative: needs root or adm group membership
sudo grep 'sudo:' /var/log/auth.log | tail -n 20
sudo journalctl -t sudo -n 20 --no-pager
```

</details>
