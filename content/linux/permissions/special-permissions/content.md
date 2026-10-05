# Special Permissions: SUID, SGID and the Sticky Bit

**Module:** File Permissions · **Interview priority:** Frequently asked

## What Is It?

Besides the nine `rwx` bits, every file has three **special bits**. They form an optional fourth (leading) octal digit:

| Bit | Value | On an executable file | On a directory | Shown as |
|-----|-------|-----------------------|----------------|----------|
| **SUID** (set user ID) | 4 | Runs with the privileges of the file's **owner** | (no effect on Linux) | `s` in the owner's execute position |
| **SGID** (set group ID) | 2 | Runs with the privileges of the file's **group** | New files inside **inherit the directory's group** | `s` in the group's execute position |
| **Sticky bit** | 1 | (ignored on Linux) | Only a file's owner (or the directory's owner, or root) may delete or rename it | `t` in the others' execute position |

```text
-rwsr-xr-x  /usr/bin/passwd   4755  SUID root: any user can change their own password
drwxrws---  /srv/project      2770  SGID: new files belong to the project's group
drwxrwxrwt  /tmp              1777  sticky: everyone can create, nobody can delete others' files
```

## Why It Matters

- They explain how ordinary users can do privileged things safely (`passwd` writes `/etc/shadow`, which only root can modify).
- SUID-root programs are a classic privilege-escalation target, so security audits list them.
- SGID directories and the sticky bit are the standard tools for shared folders.
- Interview staples: "why is `/tmp` world-writable but safe?", "what does the `s` in `-rwsr-xr-x` mean?".

## Core Concept

### SUID: run as the owner

Normally a program runs with the identity of the user who started it. With SUID set, the kernel sets the process's **effective user ID** to the file's owner.

`passwd` is owned by root and SUID, so when Alice runs it, it can write the root-only `/etc/shadow` — but the program itself only lets Alice change **her own** password. The safety comes from the program's own checks, which is why only small, carefully written programs are SUID root.

```bash
ls -l /usr/bin/passwd
```

**Output (varies):**

```text
-rwsr-xr-x 1 root root 93640 Aug 19 14:23 /usr/bin/passwd
```

Other common SUID-root programs: `su`, `sudo`, `mount`, `umount`, `chsh`, `gpasswd`.

Linux ignores SUID on **interpreted scripts** (`#!/bin/bash`) because of race conditions that made them exploitable; it applies to compiled executables.

### SGID: run as the group, or inherit the group

- On an **executable**, the process runs with the file's group as its effective group. Example: Debian's `crontab` is owned by group `crontab` with SGID, so it can write into the group-restricted spool directory.
- On a **directory** — the common, practical use — files and subdirectories created inside get the **directory's group** instead of the creator's primary group, and new subdirectories inherit the SGID bit too. Combined with a group-writable umask (`002`), this makes team folders work.

### Sticky bit: protect files in shared directories

In a directory everyone can write to (`777`), anyone could delete anyone's files, because deletion depends only on directory permissions. The sticky bit adds a rule: an entry can be deleted or renamed only by the **file's owner**, the **directory's owner** or root. That is why `/tmp` is `1777`.

### Capital `S` and `T`

The special bit replaces the `x` in the listing. Lowercase means the `x` is also set; uppercase means the special bit is set **without** `x` — usually a mistake, because SUID/SGID on a non-executable file does nothing.

| Display | Meaning |
|---------|---------|
| `rws` | SUID (or SGID) + execute |
| `rwS` | SUID (or SGID), **no** execute — ineffective |
| `rwt` (others) | Sticky + execute for others |
| `rwT` (others) | Sticky, no execute for others |

## Commands

### Setting special bits

| Symbolic | Numeric | Sets |
|----------|---------|------|
| `chmod u+s file` | `chmod 4755 file` | SUID |
| `chmod g+s dir` | `chmod 2775 dir` | SGID |
| `chmod +t dir` (or `o+t`) | `chmod 1777 dir` | Sticky |
| `chmod u-s`, `g-s`, `-t` | | Remove |

SUID on an executable you own:

```bash
cp /bin/true myprog
chmod 4755 myprog
stat -c '%a %A' myprog
```

**Output:**

```text
4755 -rwsr-xr-x
```

(It would run with *your* privileges — SUID means "the owner's", and you are the owner. Only root can create SUID-**root** files.)

Remove execute and the `s` turns into `S`:

```bash
chmod u-x myprog
stat -c '%a %A' myprog
```

**Output:**

```text
4655 -rwSr-xr-x
```

SGID on a directory:

```bash
mkdir shared
chmod 2770 shared
ls -ld shared
```

**Output:**

```text
drwxrws--- 2 student student 4096 Jan 15 09:30 shared
```

Sticky bit:

```bash
mkdir drop
chmod 1777 drop
ls -ld drop
chmod o-x drop
ls -ld drop
```

**Output:**

```text
drwxrwxrwt 2 student student 4096 Jan 15 09:30 drop
drwxrwxrwT 2 student student 4096 Jan 15 09:30 drop
```

### A numeric-mode surprise on directories

GNU `chmod` keeps a directory's SUID/SGID bits when you give a three- or four-digit mode that does not mention them; you must clear them explicitly:

```bash
chmod 770 shared
stat -c '%a' shared
chmod g-s shared
stat -c '%a' shared
```

**Output:**

```text
2770
770
```

(`chmod 00770 shared` — five digits — also clears them.) The sticky bit, by contrast, is cleared by a plain numeric mode.

### Finding special-permission files

Security audits list SUID and SGID files, because an unexpected SUID-root program is a backdoor:

```bash
# Illustrative: run with sudo to search everywhere
sudo find / -xdev -perm -4000 -type f 2>/dev/null      # SUID
sudo find / -xdev -perm -2000 -type f 2>/dev/null      # SGID
find / -xdev -type d -perm -1000 2>/dev/null           # sticky directories
```

`-perm -4000` means "at least these bits set". `-xdev` stays on one filesystem.

## Examples

### A team folder that just works

```bash
# Illustrative: needs root
sudo groupadd devs
sudo usermod -aG devs alice
sudo usermod -aG devs bob
sudo mkdir /srv/team
sudo chgrp devs /srv/team
sudo chmod 2770 /srv/team
```

- `2` (SGID): every file created in `/srv/team` belongs to group `devs`, whoever creates it.
- `770`: only members of `devs` (and the owner) can enter.
- Users need umask `002` so their new files are group-writable. Add `1` for sticky (`3770`) if members must not delete each other's files.

### Why `/tmp` is safe

```bash
stat -c '%a %A %n' /tmp
```

**Output:**

```text
1777 drwxrwxrwt /tmp
```

`777` lets every user create files; `t` stops them deleting or renaming files they do not own.

## Comparison

### SUID vs SGID vs sticky

| | SUID | SGID | Sticky |
|---|---|---|---|
| Octal | 4000 | 2000 | 1000 |
| Symbolic | `u+s` | `g+s` | `+t` |
| Files | Run as file owner | Run as file group | — |
| Directories | — | New entries inherit group | Only owners delete/rename entries |
| Classic example | `/usr/bin/passwd` | Shared project directory | `/tmp` |
| Security concern | SUID-root bugs → root shell | Group escalation | Low |

### SUID vs sudo

| | SUID program | `sudo` |
|---|---|---|
| Who decides access | Whoever can execute the file | Rules in `/etc/sudoers` per user/group/command |
| Scope | One program, always elevated | Any permitted command, on demand |
| Logging | None by default | Every command logged |
| Password | None | User's password (usually) |

## Common Mistakes

- Setting SUID on a shell script and expecting it to run as root — Linux ignores it.
- Leaving `S` or `T` (special bit without execute), which has no useful effect.
- Making a custom program SUID root to "fix" a permission problem — use `sudo` rules or capabilities (`setcap`) instead.
- `chmod 777` on a shared directory without the sticky bit — anyone can delete everyone's files.
- Assuming `chmod 770 dir` cleared an SGID bit; check with `stat` and use `g-s`.

## Key Takeaways

- Special bits: SUID 4, SGID 2, sticky 1 — the leading digit of a four-digit mode.
- SUID: run as the file's owner (`passwd`); ignored on scripts.
- SGID: run as the file's group; on directories, new files inherit the group.
- Sticky on directories: only the owner can delete or rename their files (`/tmp` = 1777).
- `s`/`t` = with execute; `S`/`T` = without execute.
- Audit SUID files with `find / -perm -4000`.
