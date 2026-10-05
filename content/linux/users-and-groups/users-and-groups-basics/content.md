# Users, Groups and Account Files

**Module:** Users and Groups · **Interview priority:** Core

## What Is It?

Linux is a multi-user system. Every process runs as some **user**, and every file is owned by a user and a **group**. The kernel only knows numbers:

- **UID** (user ID) identifies a user; **GID** (group ID) identifies a group.
- Names such as `student` or `developers` are mapped to these numbers by three text files: `/etc/passwd`, `/etc/shadow` and `/etc/group`.
- Each user has one **primary group** (used for new files) and any number of **supplementary groups** (extra access).

## Why It Matters

- Permissions are evaluated against the UID and GIDs of a process; "Permission denied" problems are solved by knowing who a process runs as and which groups it has.
- Services run as dedicated low-privilege users so a compromised service cannot take over the system.
- Interviews: "what is in `/etc/passwd`?", "where are passwords stored?", "what is UID 0?", "primary vs secondary group".

## Core Concept

### Kinds of accounts

| Account | UID | Purpose | Example |
|---------|-----|---------|---------|
| root | 0 | Superuser; bypasses permission checks | `root` |
| System (service) users | 1–999 (typically) | Run daemons; usually no password and no login shell | `daemon`, `www-data`, `postgres`, `sshd` |
| Regular users | 1000 and up | Humans | `student` |
| nobody | 65534 | Unprivileged placeholder identity | `nobody` |

The ranges come from `/etc/login.defs` (`UID_MIN 1000` on Debian/Ubuntu and RHEL). Being root is about **UID 0**, not the name "root".

### `/etc/passwd` — the account list

World-readable; one line per account, seven colon-separated fields:

```text
student:x:1000:1000:Student User:/home/student:/bin/bash
│       │ │    │    │            │             └─ 7 login shell
│       │ │    │    │            └─ 6 home directory
│       │ │    │    └─ 5 comment (GECOS): full name, etc.
│       │ │    └─ 4 primary GID
│       │ └─ 3 UID
│       └─ 2 password placeholder: x = "the hash is in /etc/shadow"
└─ 1 username
```

```bash
grep '^root:' /etc/passwd
```

**Output:**

```text
root:x:0:0:root:/root:/bin/bash
```

Service accounts have a shell such as `/usr/sbin/nologin` or `/bin/false`, which refuses interactive logins:

```bash
cut -d: -f1,3,7 /etc/passwd | head -n 4
```

**Output (varies):**

```text
root:0:/bin/bash
daemon:1:/usr/sbin/nologin
bin:2:/usr/sbin/nologin
sys:3:/usr/sbin/nologin
```

### `/etc/shadow` — password hashes

Readable only by root (and the `shadow` group on Debian/Ubuntu), so password hashes cannot be copied and cracked offline by ordinary users:

```bash
ls -l /etc/passwd /etc/shadow /etc/group
cat /etc/shadow
```

**Output (varies):**

```text
-rw-r--r-- 1 root root    791 Jan 10 10:15 /etc/group
-rw-r--r-- 1 root root   1386 Jan 10 10:15 /etc/passwd
-rw-r----- 1 root shadow  781 Jan 10 10:15 /etc/shadow
cat: /etc/shadow: Permission denied
```

Nine fields per line (example entry, hash shortened):

```text
student:$y$j9T$Fh3…kQ1:20468:0:99999:7:::
│       │               │     │ │     │ └┴┴─ 7 inactive days · 8 expiry date · 9 reserved
│       │               │     │ │     └─ 6 warn this many days before expiry
│       │               │     │ └─ 5 maximum days between changes
│       │               │     └─ 4 minimum days between changes
│       │               └─ 3 last change (days since 1970-01-01)
│       └─ 2 password hash: $y$ yescrypt, $6$ SHA-512; "!" or "*" = locked / no password login
└─ 1 username
```

The hash is one-way and **salted** (a random value mixed in), so identical passwords produce different hashes and cannot be looked up in precomputed tables.

### `/etc/group` — groups and members

Four fields: name, password placeholder, GID, comma-separated **supplementary** members:

```bash
grep '^sudo:' /etc/group
```

**Output (varies):**

```text
sudo:x:27:student
```

A user's primary group is in field 4 of `/etc/passwd`, and is usually **not** repeated in `/etc/group`'s member list. Group passwords (rarely used) live in `/etc/gshadow`.

### Primary vs supplementary groups

| | Primary group | Supplementary groups |
|---|---|---|
| How many | Exactly one | Zero or more |
| Stored in | `/etc/passwd` field 4 | Member lists in `/etc/group` |
| Used for | Group owner of files the user creates | Extra access (e.g. `sudo`, `docker`, `developers`) |
| Typical default | A private group with the user's own name (`student`) | `sudo`/`wheel` for admins |

Group membership is read **at login**: after being added to a group, a user must log out and back in (or run `newgrp group`) before processes see it.

### `getent`: ask the system, not the file

Accounts can also come from LDAP or Active Directory (via `/etc/nsswitch.conf`). `getent` queries every configured source:

```bash
getent passwd root
```

**Output:**

```text
root:x:0:0:root:/root:/bin/bash
```

## Commands

### id

**Purpose:** show the UID, primary GID and all groups of a user (default: you).

```bash
id
id root
```

**Output (varies):**

```text
uid=1000(student) gid=1000(student) groups=1000(student),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),100(users)
uid=0(root) gid=0(root) groups=0(root)
```

| Option | Prints |
|--------|--------|
| `-u` / `-un` | UID / user name |
| `-g` / `-gn` | Primary GID / group name |
| `-G` / `-Gn` | All group IDs / names |

### whoami and groups

```bash
whoami
id -un
```

**Output:**

```text
student
student
```

`groups [user]` lists group names, like `id -Gn`.

### who and w

**Purpose:** show who is logged in. `w` adds what each user is running and the system load.

```bash
# Illustrative: output depends on current logins
who
w
last -n 5          # recent logins, from /var/log/wtmp (package may need installing)
```

`who` prints user, terminal, login time and origin (IP for SSH sessions) — useful to check whether anyone else is on a server before rebooting it.

## Examples

### List the human users on a machine

```bash
awk -F: '$3 >= 1000 && $3 < 65534 {print $1}' /etc/passwd
```

**Output (varies):**

```text
student
```

### Which groups give administrator rights?

```bash
# Illustrative
getent group sudo        # Debian/Ubuntu
getent group wheel       # RHEL/Fedora
```

Members of these groups may use `sudo` to run commands as root (by the default `sudoers` policy).

## Comparison

### The three account files

| File | Contains | Readable by | Edit with |
|------|----------|-------------|-----------|
| `/etc/passwd` | Usernames, UID, GID, home, shell | Everyone | `useradd`, `usermod`, `chsh`, `vipw` |
| `/etc/shadow` | Password hashes and ageing | root (and group `shadow`) | `passwd`, `chage`, `vipw -s` |
| `/etc/group` | Groups, GID, supplementary members | Everyone | `groupadd`, `usermod -aG`, `gpasswd`, `vigr` |

## Common Mistakes

- Believing passwords are stored in `/etc/passwd`. Modern systems store only an `x` there; hashes are in `/etc/shadow`.
- Editing these files with a normal editor while other tools may be writing them — use `vipw`/`vigr` or the account commands, which lock the files.
- Expecting a new group membership to apply to an already-open session.
- Equating "root" with the name: any account with UID 0 is a superuser — an extra UID-0 account is a red flag in a security audit.
- Giving service accounts a real login shell and password.

## Key Takeaways

- The kernel uses numeric UIDs/GIDs; root is UID 0, regular users start at 1000, system users are below.
- `/etc/passwd`: `name:x:UID:GID:comment:home:shell` (world-readable).
- `/etc/shadow`: salted password hashes and ageing, root-only.
- `/etc/group`: `name:x:GID:members` — supplementary members.
- One primary group (new files), many supplementary groups (access); changes apply at next login.
- `id`, `whoami`, `groups`, `who`, `w`, `getent` show identities.
