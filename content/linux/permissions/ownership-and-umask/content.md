# Ownership: chown, chgrp and umask

**Module:** File Permissions · **Interview priority:** Core

## What Is It?

- Every file has exactly one **owner** (a user) and one **group**. Permission bits say what the owner, the group's members and everyone else may do; ownership decides **who** falls into which class.
- **`chown`** changes the owner (and optionally the group). **`chgrp`** changes only the group.
- **`umask`** is a per-process setting that decides the permissions of **newly created** files and directories by masking bits out of the defaults.

## Why It Matters

- Services run as dedicated users (`www-data`, `postgres`, `nginx`, `app`). If a file belongs to the wrong user, the service gets "Permission denied" even though the bits look fine.
- Shared project directories rely on a common group so a team can edit each other's files.
- A wrong umask creates world-readable secrets or files a team cannot edit.

## Core Concept

### Who may change what

| Action | Allowed for |
|--------|-------------|
| Change permission bits (`chmod`) | The file's owner, or root |
| Change the owner (`chown user`) | **Root only** — otherwise users could give away files to dodge quotas or plant files |
| Change the group (`chgrp`) | Root, or the owner **if** they are a member of the target group |

### How new files get their permissions

Programs request a starting mode — normally **666** (`rw-rw-rw-`) for files and **777** (`rwxrwxrwx`) for directories — and the kernel removes every bit that is set in the umask:

```text
final mode = requested mode AND NOT umask

          files        directories
request   666 rw-rw-rw-   777 rwxrwxrwx
umask 022 ----w--w-       ----w--w-
result    644 rw-r--r--   755 rwxr-xr-x
```

| umask | New files | New directories | Use |
|-------|-----------|-----------------|-----|
| `022` | 644 | 755 | Common default: others can read |
| `002` | 664 | 775 | Shared group work (default for users with a private group on many distributions) |
| `027` | 640 | 750 | Servers: nothing for others |
| `077` | 600 | 700 | Private: only the owner |

It is a **mask**, not subtraction: umask `033` on 666 gives 644 (the masked execute bits were not set in the first place), not 633. And because files start from 666, a normal new file is **never executable** — you must `chmod +x` it.

## Commands

### chown

**Purpose:** change the owner and/or group of files. Normally run with `sudo`.

**Syntax:**

```text
chown [options] USER[:GROUP] file ...
chown [options] :GROUP file ...
```

| Form / option | Meaning |
|---------------|---------|
| `chown alice file` | Owner → alice |
| `chown alice:devs file` | Owner → alice, group → devs |
| `chown alice: file` | Owner → alice, group → alice's login group |
| `chown :devs file` | Group only (same as `chgrp devs`) |
| `-R` | Recursive |
| `-v` / `-c` | Report changes |
| `--reference=ref` | Copy owner and group from another file |
| `-h` | Change a symbolic link itself, not its target |

```bash
# Illustrative: needs root
sudo chown www-data:www-data /var/www/uploads
sudo chown -R app:app /opt/myapp
sudo chown postgres: /var/lib/postgresql/backup.sql
```

A normal user cannot give a file away:

```bash
chown root notes.txt
```

**Output:**

```text
chown: changing ownership of 'notes.txt': Operation not permitted
```

> [!CAUTION]
> `chown -R` follows the path you give and changes everything below it. `sudo chown -R user:user /` or a mistyped path (a space in `/ var/www`) changes ownership of system files and can make the system unbootable or break `sudo` itself. Double-check the path, and never run it on `/`, `/usr`, `/etc` or `/var` as a whole.

### chgrp

**Purpose:** change the group of files.

```bash
# Illustrative: the owner may switch to any group they belong to
groups                      # e.g. student developers docker
chgrp developers report.txt
chgrp -R developers shared/
```

Switching to a group you do not belong to fails:

```bash
chgrp root notes.txt
```

**Output:**

```text
chgrp: changing group of 'notes.txt': Operation not permitted
```

### Checking ownership

```bash
ls -l config/app.conf
stat -c '%U:%G %n' config/app.conf
```

**Output:**

```text
-rw-r--r-- 1 student student 119 Jan 15 09:30 config/app.conf
student:student config/app.conf
```

`ls -ln` shows numeric UIDs and GIDs — useful when files come from another system (an archive or a mounted disk) where the same number means a different user.

### umask

**Purpose:** show or set the file-creation mask of the current shell (inherited by programs it starts).

```bash
umask
umask -S
```

**Output:**

```text
0022
u=rwx,g=rx,o=rx
```

`umask -S` shows what is **allowed**, in symbolic form. The leading `0` is for the special bits.

Effect on new files and directories:

```bash
umask 027
touch u.txt
mkdir u.d
stat -c '%a %n' u.txt u.d
umask 077
touch v.txt
mkdir v.d
stat -c '%a %n' v.txt v.d
umask 022
```

**Output:**

```text
640 u.txt
750 u.d
600 v.txt
700 v.d
```

A `umask` command affects only the current shell and its children. To make it permanent, put it in `~/.bashrc` or `~/.profile` (per user), set `UMASK` in `/etc/login.defs` (system default for new logins), or `UMask=0027` in a systemd service unit for a daemon.

## Examples

### A shared team directory

```bash
# Illustrative: needs root
sudo groupadd developers
sudo usermod -aG developers alice
sudo usermod -aG developers bob
sudo mkdir /srv/project
sudo chown root:developers /srv/project
sudo chmod 2775 /srv/project       # 2 = setgid: new files inherit the group
```

Members also need a umask such as `002` so the files they create are group-writable. The setgid bit is explained in [Special Permissions](../special-permissions/content.md).

### "Permission denied" for a service

nginx (running as `www-data`) cannot read `/srv/site/index.html`, mode `640`, owned by `deploy:deploy`. The bits give nothing to "others", and `www-data` is not in the `deploy` group. Fixes, from narrowest to broadest:

1. `sudo chgrp www-data /srv/site/index.html` (group read already allowed by 640), or
2. add `www-data` to the `deploy` group, or
3. `chmod o+r` if the content is public anyway.

Remember that every parent directory also needs `x` for `www-data`.

## Comparison

### chmod vs chown vs chgrp vs umask

| Command | Changes | Who may run it | Affects |
|---------|---------|----------------|---------|
| `chmod` | Permission bits | Owner or root | Existing files |
| `chown` | Owner (and group) | Root | Existing files |
| `chgrp` | Group | Owner (to own groups) or root | Existing files |
| `umask` | Default bits for new files | Any user, for their own processes | Files created afterwards |

## Common Mistakes

- Running `chown` without `sudo` and wondering why it fails — only root can change owners.
- Using `chmod 777` when the real problem is the wrong owner or group.
- Reading umask as subtraction (666 − 033 = 633). It masks bits: the result is 644.
- Setting `umask` in a terminal and expecting a service or cron job to use it — they have their own environment.
- `chown -R` on the wrong path; mistakes are hard to reverse because original owners are not recorded.
- Forgetting to log out and in after being added to a group — group membership is read at login.

## Key Takeaways

- Each file has one owner and one group; they decide which permission class applies.
- `chown user:group file` (root only); `chgrp group file` (owner, to a group they belong to).
- New file mode = requested mode (666 files, 777 dirs) with umask bits removed.
- umask `022` → 644/755, `002` → 664/775, `027` → 640/750, `077` → 600/700.
- New files are never executable by default; `chmod +x` explicitly.
