# Managing Users and Groups — Practice

These items describe commands that need root. Try them only in a VM or container.

### P1. Create a user

**Difficulty:** Easy · **Type:** Command · **Concepts:** useradd options

Create user `karan` with a home directory, bash as the login shell and the comment "Karan S".

<details>
<summary>Answer</summary>

```bash
# Illustrative: needs root
sudo useradd -m -s /bin/bash -c "Karan S" karan
sudo passwd karan
```

</details>

### P2. The dangerous option

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** usermod -aG

Fatima is in `sudo` and `developers`. Which command adds her to `docker` without removing her from the others?

- A) `usermod -G docker fatima`
- B) `usermod -aG docker fatima`
- C) `usermod -g docker fatima`
- D) `groupadd docker fatima`

<details>
<summary>Answer</summary>

**Answer:** B) `usermod -aG docker fatima`

**Explanation:** A replaces all supplementary groups with `docker`. C changes her **primary** group. D is not valid syntax for adding members.

</details>

### P3. Remove completely

**Difficulty:** Easy · **Type:** Command · **Concepts:** userdel -r

Delete user `temp01` together with their home directory.

<details>
<summary>Answer</summary>

```bash
# Illustrative: needs root
sudo userdel -r temp01
```

</details>

### P4. Service account

**Difficulty:** Medium · **Type:** Command · **Concepts:** system users, nologin

Create a system user `reports` for a background service: system UID, no login shell, home `/var/lib/reports` (do not create it).

<details>
<summary>Answer</summary>

```bash
# Illustrative: needs root
sudo useradd -r -s /usr/sbin/nologin -d /var/lib/reports -M reports
```

</details>

### P5. Force a password change

**Difficulty:** Medium · **Type:** Command · **Concepts:** passwd -e, chage

After giving new user `divya` a temporary password, make sure she must choose a new one when she first logs in.

<details>
<summary>Answer</summary>

```bash
# Illustrative: needs root
sudo passwd -e divya
# or
sudo chage -d 0 divya
```

</details>

### P6. Lost sudo

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** usermod -G replacement

After someone ran `sudo usermod -G docker john`, John can no longer use `sudo`. What happened and how do you repair it (you still have another admin account)?

<details>
<summary>Answer</summary>

`-G` without `-a` replaced John's supplementary groups with only `docker`, removing him from `sudo`. From another admin account: `sudo usermod -aG sudo john` (and re-add any other groups he had — check old membership in backups of `/etc/group` or `/etc/group-`, which the tools keep as a backup copy). John must log in again.

</details>

### P7. Rename a group

**Difficulty:** Medium · **Type:** Command · **Concepts:** groupmod -n

Rename group `qa` to `quality`.

<details>
<summary>Answer</summary>

```bash
# Illustrative: needs root
sudo groupmod -n quality qa
```

Files keep working because they store the GID, which does not change.

</details>

### P8. Complete lockout

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** locking vs expiring

A contractor's engagement ended an hour ago. They use an SSH key. Your colleague ran `sudo passwd -l contractor`. Is the contractor locked out? What would you do?

<details>
<summary>Answer</summary>

Not necessarily: `passwd -l` only invalidates the password hash; with PAM-based `sshd` (the default) key authentication still works. Also expire the account (`sudo usermod -e 1 contractor`), remove or rename `~contractor/.ssh/authorized_keys`, kill existing sessions (`sudo pkill -KILL -u contractor`), and rotate any shared secrets they had access to.

</details>
