# Special Permissions — Practice

All items start in `~/linux-lab`.

### P1. Read the listing

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** SUID display

What does the `s` in `-rwsr-xr-x 1 root root … /usr/bin/su` indicate?

- A) The file is a socket
- B) The SUID bit is set: it runs with root's privileges
- C) The file is shared between users
- D) The sticky bit is set

<details>
<summary>Answer</summary>

**Answer:** B) The SUID bit is set: it runs with root's privileges

**Explanation:** An `s` in the owner's execute position is SUID (with execute). A socket would show `s` as the first character instead.

</details>

### P2. Octal with special bits

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** four-digit modes

Write the symbolic form of `1777`, `2775` and `4755`.

<details>
<summary>Answer</summary>

- 1777 → `rwxrwxrwt`
- 2775 → `rwxrwsr-x`
- 4755 → `rwsr-xr-x`

</details>

### P3. Set the sticky bit

**Difficulty:** Easy · **Type:** Output · **Concepts:** chmod +t

What does this print?

```bash
mkdir public
chmod 777 public
chmod +t public
stat -c '%a %A' public
```

<details>
<summary>Answer</summary>

**Output:**

```text
1777 drwxrwxrwt
```

</details>

### P4. Capital letters

**Difficulty:** Medium · **Type:** Output · **Concepts:** S without execute

What does this print?

```bash
touch tool
chmod 4644 tool
stat -c '%A' tool
```

<details>
<summary>Answer</summary>

**Output:**

```text
-rwSr--r--
```

SUID is set but the owner has no execute bit, so the listing shows `S` — the bit is useless here.

</details>

### P5. Group inheritance

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** SGID directory

`/srv/reports` is `drwxrwsr-x root analysts`. Priya (primary group `priya`, also in `analysts`) creates `q1.csv` there. Which group owns `q1.csv`, and why?

<details>
<summary>Answer</summary>

`analysts`. The SGID bit on the directory makes new files inherit the directory's group instead of the creator's primary group.

</details>

### P6. Deleting in /tmp

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** sticky bit

Ravi runs `rm /tmp/meena-report.txt` (owned by meena, mode `666`). What happens and why?

<details>
<summary>Answer</summary>

`rm: cannot remove '/tmp/meena-report.txt': Operation not permitted`. `/tmp` has the sticky bit, so only the file's owner, the directory's owner or root may delete it — even though the file itself is world-writable (Ravi could still change its contents).

</details>

### P7. Audit command

**Difficulty:** Medium · **Type:** Command · **Concepts:** find -perm

Write a command that lists all SUID files on the root filesystem, ignoring errors and other mounted filesystems.

<details>
<summary>Answer</summary>

```bash
# Illustrative: needs root to see everything
sudo find / -xdev -perm -4000 -type f 2>/dev/null
```

</details>

### P8. The bit that would not go away

**Difficulty:** Hard · **Type:** Output · **Concepts:** numeric chmod and directory SGID

What does this print?

```bash
mkdir team
chmod 2775 team
chmod 775 team
stat -c '%a' team
chmod g-s team
stat -c '%a' team
```

<details>
<summary>Answer</summary>

**Output:**

```text
2775
775
```

GNU `chmod` keeps SUID/SGID on directories when a numeric mode does not mention them; `g-s` (or a five-digit mode such as `00775`) clears them.

</details>

### P9. Privilege escalation risk

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** SUID security

During an audit you find `-rwsr-xr-x 1 root root /usr/local/bin/backup-helper`, a custom program that accepts a destination path and copies files there. Why is this dangerous, and what would you recommend?

<details>
<summary>Answer</summary>

Any user can run it as root. If it copies to a user-chosen path, a user can overwrite `/etc/shadow`, `/etc/sudoers` or a root cron file and gain root. Recommendations: remove the SUID bit (`chmod u-s`), run the backup as a root-owned systemd service or cron job, or allow a specific fixed command through a narrow `sudoers` rule; if elevated rights are needed, grant only the required capability.

</details>
