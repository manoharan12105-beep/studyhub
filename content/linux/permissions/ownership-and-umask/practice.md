# Ownership: chown, chgrp and umask — Practice

All items start in `~/linux-lab`.

### P1. Change owner and group

**Difficulty:** Easy · **Type:** Command · **Concepts:** chown user:group

Write the command that makes `/var/www/uploads` and everything inside it owned by user `www-data` and group `www-data`.

<details>
<summary>Answer</summary>

```bash
# Illustrative: needs root
sudo chown -R www-data:www-data /var/www/uploads
```

</details>

### P2. Who can do it?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** chown permissions

Alice owns `report.txt`. Which can she do without `sudo`?

- A) `chown bob report.txt`
- B) `chmod 600 report.txt`
- C) `chown root:root report.txt`
- D) `chgrp wheel report.txt` while not a member of `wheel`

<details>
<summary>Answer</summary>

**Answer:** B) `chmod 600 report.txt`

**Explanation:** The owner may change the mode. Changing the owner needs root, and changing the group is allowed only to groups she belongs to.

</details>

### P3. Compute the mode

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** umask

With umask `077`, what modes do a new file and a new directory get?

<details>
<summary>Answer</summary>

File: 666 masked by 077 → **600** (`rw-------`). Directory: 777 masked by 077 → **700** (`rwx------`).

</details>

### P4. Predict new files

**Difficulty:** Medium · **Type:** Output · **Concepts:** umask in practice

What does this print?

```bash
umask 002
touch team.txt
mkdir team.d
stat -c '%a %n' team.txt team.d
umask 022
```

<details>
<summary>Answer</summary>

**Output:**

```text
664 team.txt
775 team.d
```

</details>

### P5. Mask, not subtraction

**Difficulty:** Medium · **Type:** Output · **Concepts:** umask bitwise

What does this print?

```bash
umask 033
touch masked.txt
stat -c '%a' masked.txt
umask 022
```

<details>
<summary>Answer</summary>

**Output:**

```text
644
```

666 AND NOT 033 = 644. The execute bits in the mask had nothing to remove.

</details>

### P6. Show the mask symbolically

**Difficulty:** Easy · **Type:** Output · **Concepts:** umask -S

With the default umask of `0022`, what does `umask -S` print?

```bash
umask -S
```

<details>
<summary>Answer</summary>

**Output:**

```text
u=rwx,g=rx,o=rx
```

It lists the permissions that are **allowed** (not masked).

</details>

### P7. Service cannot read

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** ownership vs permission bits

PostgreSQL fails to start: `could not open file "/etc/postgresql/16/main/server.key": Permission denied`. `ls -l` shows `-rw------- 1 root root server.key`. What is wrong and how do you fix it?

<details>
<summary>Answer</summary>

The server runs as user `postgres`, but the key is owned by root with mode 600, so `postgres` falls into "others" and has no access. Give it to the right owner (keeping it private):

```bash
# Illustrative: needs root
sudo chown postgres:postgres /etc/postgresql/16/main/server.key
sudo chmod 600 /etc/postgresql/16/main/server.key
```

</details>

### P8. Error message

**Difficulty:** Medium · **Type:** Output · **Concepts:** chown as normal user

What does a normal user see when running this?

```bash
chown root notes.txt
```

<details>
<summary>Answer</summary>

**Output:**

```text
chown: changing ownership of 'notes.txt': Operation not permitted
```

</details>

### P9. Make it permanent

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** where umask is set

A team wants files created by (a) their interactive shells and (b) the `myapp` systemd service to be unreadable by others. Where do you configure the umask for each?

<details>
<summary>Answer</summary>

(a) `umask 027` in each user's `~/.bashrc` / `~/.profile`, or system-wide through `UMASK` in `/etc/login.defs` (or a file in `/etc/profile.d/`). (b) `UMask=0027` in the `[Service]` section of the unit (`sudo systemctl edit myapp`), then `systemctl daemon-reload` and restart. A service does not read users' shell startup files.

</details>
