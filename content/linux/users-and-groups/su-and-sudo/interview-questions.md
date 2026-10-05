# su and sudo — Interview Questions

## Beginner

### Q1. What is the difference between `su` and `sudo`?

<details>
<summary>Answer</summary>

`su` switches to another user (root by default) and starts a shell; you need **that user's** password. `sudo` runs a single command as another user after checking `/etc/sudoers`; you type **your own** password, and every command is logged. `sudo` allows fine-grained, revocable access without sharing the root password.

</details>

### Q2. What is the difference between `su` and `su -`?

<details>
<summary>Answer</summary>

`su -` starts a login shell: the target user's environment, `PATH`, home directory and login scripts. Plain `su` changes the user but keeps most of the caller's environment and the current directory, which can cause surprises (e.g. root commands in `/usr/sbin` not found, or files written with the wrong `HOME`).

</details>

### Q3. How do you give a user sudo privileges?

<details>
<summary>Answer</summary>

Add them to the admin group: `sudo usermod -aG sudo alice` on Debian/Ubuntu, `sudo usermod -aG wheel alice` on RHEL/Fedora (the default sudoers file grants these groups full access). For restricted access, add a rule with `sudo visudo -f /etc/sudoers.d/alice`. The user must log in again.

</details>

### Q4. What is `visudo` and why use it?

<details>
<summary>Answer</summary>

The safe editor for `/etc/sudoers` and drop-in files. It locks the file against simultaneous edits and validates the syntax before saving. A syntax error saved with a normal editor can break `sudo` for everyone, which may lock you out of administration.

</details>

## Intermediate

### Q5. What does this sudoers line mean: `deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart nginx`?

<details>
<summary>Answer</summary>

User `deploy`, on any host, may run exactly `/usr/bin/systemctl restart nginx` as root, without being asked for a password. Any other command via `sudo` is refused (unless other rules allow it).

</details>

### Q6. Why does `sudo echo "x" > /etc/file` fail with "Permission denied"?

<details>
<summary>Answer</summary>

The redirection is done by your own (non-root) shell before `sudo` runs `echo`. Use `echo "x" | sudo tee /etc/file` (or `tee -a` to append), or `sudo sh -c 'echo x > /etc/file'`.

</details>

### Q7. Where are sudo actions logged?

<details>
<summary>Answer</summary>

To the authentication log — `/var/log/auth.log` on Debian/Ubuntu, `/var/log/secure` on RHEL — and the systemd journal (`journalctl _COMM=sudo` or `journalctl -t sudo`). Each entry records the user, terminal, working directory, target user and command.

</details>

### Q8. What is the difference between `sudo -i`, `sudo -s` and `sudo su -`?

<details>
<summary>Answer</summary>

`sudo -i` starts root's login shell (clean root environment, `HOME=/root`) — like `su -`. `sudo -s` starts a root shell but keeps your environment. `sudo su -` gets the same result as `sudo -i` by running `su` as root; it works but is redundant and its logging is less clear.

</details>

## Advanced

### Q9. Why is granting `sudo vim` or `sudo less` to a restricted user dangerous?

<details>
<summary>Answer</summary>

These programs can start other programs: in `vim`, `:!bash` opens a shell; in `less`, `!sh`; `find -exec`, `awk 'BEGIN{system("sh")}'`, `tar --checkpoint-action`, `python -c` and others behave the same. The spawned shell inherits root privileges, so the restriction is meaningless. Use `sudoedit` for file editing, grant only non-interactive commands with fixed arguments, and use `NOEXEC` where appropriate.

</details>

### Q10. Why should direct root login over SSH be disabled?

<details>
<summary>Answer</summary>

`root` is a known username, so it is the main target of brute-force attacks; logging in as root also hides **who** did something. With `PermitRootLogin no`, attackers must find a valid user and credentials, and admins log in personally and escalate with `sudo`, leaving an audit trail. Key-only authentication (`PasswordAuthentication no`) further reduces risk.

</details>

### Q11. A colleague edited `/etc/sudoers` directly and now every `sudo` command prints a parse error. How do you recover?

<details>
<summary>Answer</summary>

Options, depending on access: if you know the root password, `su -` and fix the file with `visudo`; on systemd systems `pkexec visudo` may work if polkit allows it; otherwise use the cloud provider's or hypervisor's console, boot into recovery/single-user mode (or edit the kernel line with `init=/bin/bash`), remount the root filesystem read-write and fix the file. Prevention: always use `visudo`, keep rules in `/etc/sudoers.d/`, and keep a second session open while changing access rules.

</details>
