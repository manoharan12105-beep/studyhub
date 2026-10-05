# Users, Groups and Account Files — Practice

### P1. Field by field

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** /etc/passwd

For the line `postgres:x:115:122:PostgreSQL administrator:/var/lib/postgresql:/bin/bash`, give the UID, primary GID, home directory and shell.

<details>
<summary>Answer</summary>

UID 115, primary GID 122, home `/var/lib/postgresql`, shell `/bin/bash`.

</details>

### P2. Where is the hash?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** /etc/shadow

What does the `x` in the second field of `/etc/passwd` mean?

- A) The account is disabled
- B) The password hash is stored in `/etc/shadow`
- C) The user has no password
- D) The user is an administrator

<details>
<summary>Answer</summary>

**Answer:** B) The password hash is stored in `/etc/shadow`

</details>

### P3. Root's entry

**Difficulty:** Easy · **Type:** Output · **Concepts:** grep on /etc/passwd

What does this print on a typical Linux system?

```bash
grep '^root:' /etc/passwd
```

<details>
<summary>Answer</summary>

**Output:**

```text
root:x:0:0:root:/root:/bin/bash
```

</details>

### P4. Read the shadow file

**Difficulty:** Easy · **Type:** Output · **Concepts:** shadow permissions

What does a normal user see?

```bash
cat /etc/shadow
```

<details>
<summary>Answer</summary>

**Output:**

```text
cat: /etc/shadow: Permission denied
```

</details>

### P5. List login shells

**Difficulty:** Medium · **Type:** Command · **Concepts:** cut, sort, uniq

Show each distinct login shell used in `/etc/passwd` and how many accounts use it.

<details>
<summary>Answer</summary>

```bash
cut -d: -f7 /etc/passwd | sort | uniq -c | sort -rn
```

Most accounts use `/usr/sbin/nologin`; only a few use `/bin/bash`. The exact counts depend on the system.

</details>

### P6. Superuser audit

**Difficulty:** Medium · **Type:** Command · **Concepts:** UID 0

Print the names of all accounts with UID 0.

<details>
<summary>Answer</summary>

```bash
awk -F: '$3 == 0 {print $1}' /etc/passwd
```

**Output:**

```text
root
```

Anything besides `root` deserves investigation.

</details>

### P7. Groups not applied

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** group membership at login

An admin ran `sudo usermod -aG developers asha`. `getent group developers` lists `asha`, but in her open terminal `id` does not show `developers`. Explain and fix.

<details>
<summary>Answer</summary>

Group lists are attached to processes at login; her existing shell was created before the change. She must log out and back in (or open a new login session, e.g. reconnect via SSH). `newgrp developers` starts a subshell with the group immediately.

</details>

### P8. Which is the primary group?

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** primary vs supplementary

`id ravi` prints `uid=1001(ravi) gid=1001(ravi) groups=1001(ravi),27(sudo),998(docker)`. Which group will own files Ravi creates?

- A) sudo
- B) docker
- C) ravi
- D) All three

<details>
<summary>Answer</summary>

**Answer:** C) ravi

**Explanation:** `gid=` is the primary group, used for new files (unless the directory has SGID). `sudo` and `docker` are supplementary.

</details>

### P9. Locked or not?

**Difficulty:** Hard · **Type:** Conceptual · **Concepts:** shadow fields

Two `/etc/shadow` lines (hashes shortened): `alice:!$y$j9T$abc…:20400:0:99999:7:::` and `bob:*:20100:0:99999:7:::`. Can either log in with a password? Can either log in with an SSH key?

<details>
<summary>Answer</summary>

Neither can log in with a password: a leading `!` means Alice's password is locked (the hash is kept so unlocking restores it), and `*` means Bob has never had a usable password. Key-based SSH login does not use the password hash, so on typical distributions (where `sshd` uses PAM) either could still log in with an authorized key — unless the account is expired or has a `nologin` shell. (An `sshd` configured without PAM treats a `!`-locked account as locked and refuses even keys.) To fully disable an account, also expire it (`usermod --expiredate 1`) or set the shell to `nologin`.

</details>
