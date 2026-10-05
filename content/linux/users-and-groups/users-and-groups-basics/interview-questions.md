# Users, Groups and Account Files — Interview Questions

## Beginner

### Q1. What information does `/etc/passwd` contain?

<details>
<summary>Answer</summary>

One line per account with seven colon-separated fields: username, password placeholder (`x`), UID, primary GID, comment (full name), home directory and login shell. It is world-readable because many programs need to map UIDs to names.

</details>

### Q2. Where are user passwords stored?

<details>
<summary>Answer</summary>

As salted one-way hashes in `/etc/shadow`, which only root (and the `shadow` group on Debian/Ubuntu) can read. `/etc/passwd` only contains `x` in the password field. The hash prefix shows the algorithm: `$y$` yescrypt, `$6$` SHA-512; `!` or `*` means password login is disabled.

</details>

### Q3. What is the UID of root?

<details>
<summary>Answer</summary>

0. The kernel grants superuser rights to UID 0, whatever the account is called.

</details>

### Q4. What is the difference between a primary and a supplementary group?

<details>
<summary>Answer</summary>

The primary group (field 4 of `/etc/passwd`) becomes the group owner of files the user creates; every user has exactly one. Supplementary groups (listed in `/etc/group`) grant extra access — for example membership of `sudo` or `docker`. A user can have many.

</details>

### Q5. How do you see which groups a user belongs to?

<details>
<summary>Answer</summary>

`id username` (UID, primary group and all groups with numbers) or `groups username` (names only). For the current session, `id` shows what your processes actually have — which may lag behind `/etc/group` until you log in again.

</details>

## Intermediate

### Q6. What is the difference between system users and regular users?

<details>
<summary>Answer</summary>

System users (UID below 1000 on most distributions) exist to run services — `www-data`, `postgres`, `sshd`. They usually have no password, a `nologin` shell and often no real home directory, so nobody can log in as them. Regular users (UID ≥ 1000) are people. Running each service as its own user limits what a compromised service can access.

</details>

### Q7. Why is `/etc/shadow` separate from `/etc/passwd`?

<details>
<summary>Answer</summary>

`/etc/passwd` must be readable by every user so that tools like `ls` can show owner names. When hashes lived there, anyone could copy them and run offline password cracking. Moving hashes to a root-only file keeps the public information public and the secrets private; it also adds password-ageing fields.

</details>

### Q8. You were added to the `docker` group, but `docker ps` still says permission denied. Why?

<details>
<summary>Answer</summary>

Group membership is assigned to a process at login and inherited by its children. Your current shell started before the change, so it does not have the new group. Log out and in again (or start a new login session, or use `newgrp docker` in that terminal). Verify with `id`.

</details>

### Q9. What does `getent passwd alice` do that `grep alice /etc/passwd` does not?

<details>
<summary>Answer</summary>

`getent` asks the Name Service Switch (`/etc/nsswitch.conf`), so it also finds users from LDAP, Active Directory (SSSD) or other sources, and it matches the exact key rather than any line containing "alice".

</details>

## Advanced

### Q10. During an audit you find a second account with UID 0. Why is that a concern?

<details>
<summary>Answer</summary>

Any UID-0 account is a full superuser, regardless of its name. A hidden UID-0 account (e.g. `toor` or `backup`) is a classic backdoor: it bypasses `sudo` logging and is easy to overlook. Check with `awk -F: '$3 == 0' /etc/passwd`; there should be only `root`.

</details>

### Q11. What does salting a password hash achieve?

<details>
<summary>Answer</summary>

A random salt is stored with each hash and mixed into the computation. Two users with the same password get different hashes, and attackers cannot use precomputed tables (rainbow tables) — they must attack each hash separately. Slow algorithms such as yescrypt or SHA-512-crypt with many rounds further raise the cost of each guess.

</details>

### Q12. How does a process's identity change when a user runs `sudo` or a SUID program?

<details>
<summary>Answer</summary>

Each process has a real UID (who started it) and an effective UID (used for permission checks), plus a saved UID. A SUID-root program keeps the real UID of the caller but gets effective UID 0. `sudo` (itself SUID root) checks the policy and then runs the command with real and effective UID set to the target user (root by default), recording the original user in `SUDO_USER`.

</details>
