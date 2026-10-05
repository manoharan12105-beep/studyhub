# Managing Users and Groups — Interview Questions

## Beginner

### Q1. How do you create a new user with a home directory and bash as the shell?

<details>
<summary>Answer</summary>

`sudo useradd -m -s /bin/bash username`, then `sudo passwd username` to set a password. On Debian/Ubuntu, `sudo adduser username` does all of this interactively.

</details>

### Q2. How do you add an existing user to a group?

<details>
<summary>Answer</summary>

`sudo usermod -aG groupname username` (or `sudo gpasswd -a username groupname`). The user must log in again for the new group to take effect.

</details>

### Q3. How do you delete a user and their home directory?

<details>
<summary>Answer</summary>

`sudo userdel -r username`. Without `-r` the home directory and mail spool are kept. Back up the home directory first and check for files owned by the user elsewhere.

</details>

### Q4. How do you change another user's password?

<details>
<summary>Answer</summary>

As root: `sudo passwd username`. A normal user can change only their own password with `passwd`, which asks for the current one.

</details>

## Intermediate

### Q5. What is the difference between `useradd` and `adduser`?

<details>
<summary>Answer</summary>

`useradd` is the low-level, non-interactive tool available on all distributions; its behaviour depends on options and `/etc/default/useradd` (on Debian/Ubuntu it does not create a home directory without `-m`). `adduser` on Debian/Ubuntu is a friendly interactive wrapper that creates the home directory, copies `/etc/skel` and prompts for a password. On RHEL-family systems `adduser` is simply a link to `useradd`.

</details>

### Q6. What happens if you run `usermod -G docker alice`?

<details>
<summary>Answer</summary>

Alice's supplementary groups are **replaced** by just `docker`; she is removed from every other supplementary group, possibly including `sudo`/`wheel`. Use `usermod -aG docker alice` to append.

</details>

### Q7. How do you force a user to change their password at next login?

<details>
<summary>Answer</summary>

`sudo passwd -e username` or `sudo chage -d 0 username` — both set the last-change date so the password is considered expired.

</details>

### Q8. How do you create an account for a service that must never log in?

<details>
<summary>Answer</summary>

`sudo useradd -r -s /usr/sbin/nologin -d /opt/app -M appuser`: `-r` gives a system UID, the `nologin` shell refuses interactive logins, and no password is set. Run the service as this user (e.g. `User=appuser` in its systemd unit) and give it ownership only of the files it must write.

</details>

### Q9. How do you lock a user account temporarily?

<details>
<summary>Answer</summary>

`sudo usermod -L username` or `sudo passwd -l username` locks the password (prefixes the hash with `!`). Because SSH keys can bypass password locking, also expire the account (`sudo usermod -e 1 username`) for a complete block; unlock with `usermod -U` and `usermod -e ''`.

</details>

## Advanced

### Q10. Describe a safe offboarding procedure for an employee with server access.

<details>
<summary>Answer</summary>

1. Lock and expire the account (`usermod -L -e 1 user`) so neither password nor keys work.
2. Terminate their sessions and processes (`pkill -KILL -u user`).
3. Remove access paths: `~/.ssh/authorized_keys`, sudoers entries, cron jobs (`crontab -r -u user`), shared credentials they knew (rotate them).
4. Archive the home directory and find their files elsewhere (`find / -xdev -user user`).
5. Delete the account later (`userdel -r`) once ownership of needed files has been transferred.

</details>

### Q11. Why can deleting a user and later creating another cause a security problem?

<details>
<summary>Answer</summary>

Files store numeric UIDs. Files the old user owned outside their home directory remain with that UID. If a new account is created with the same UID, the new person silently becomes the owner of those files (and of any matching mailboxes or crontabs). Find and reassign or delete orphaned files (`find / -xdev -nouser`) and avoid reusing UIDs.

</details>

### Q12. Where do the defaults for `useradd` come from?

<details>
<summary>Answer</summary>

`/etc/login.defs` (UID/GID ranges, password ageing defaults, whether to create a home directory and a private group, the umask for home directories) and `/etc/default/useradd` (default shell, home base, skeleton directory, inactivity). `useradd -D` shows the current defaults. Files in `/etc/skel` are copied into each new home directory.

</details>
