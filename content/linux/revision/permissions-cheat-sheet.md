# Permissions and Users Cheat Sheet

Permission bits, octal values, special bits, umask, users, groups and privilege.

## Reading `ls -l`

```text
-rwxr-x---  1  student  dev  63  Jan 15 09:30  build.sh
│└┬┘└┬┘└┬┘     owner    group
│ │  │  └── others: ---
│ │  └───── group:  r-x
│ └──────── owner:  rwx
└────────── type: - file, d directory, l link
```

## Values

| Symbol | Value | On a file | On a directory |
|--------|-------|-----------|----------------|
| `r` | 4 | Read contents | List names |
| `w` | 2 | Modify contents | Create, delete, rename entries (with `x`) |
| `x` | 1 | Execute | Enter / traverse (`cd`, access by name) |

## Common Modes

| Octal | Symbolic | Typical use |
|-------|----------|-------------|
| `755` | `rwxr-xr-x` | Programs, scripts, public directories |
| `750` | `rwxr-x---` | Group-only directories and scripts |
| `700` | `rwx------` | Private directories, `~/.ssh` |
| `644` | `rw-r--r--` | Normal files |
| `640` | `rw-r-----` | Configuration readable by a group |
| `600` | `rw-------` | Secrets, private keys, `authorized_keys` |
| `777` | `rwxrwxrwx` | Almost never correct |
| `1777` | `rwxrwxrwt` | `/tmp` (sticky) |

## chmod, chown, umask

| Command | Effect |
|---------|--------|
| `chmod 640 f` | Set exactly `rw-r-----` |
| `chmod u+x f` / `chmod go-w f` / `chmod a+r f` | Add / remove / for all |
| `chmod u=rw,go=r f` | Set per class |
| `chmod -R u=rwX,go=rX dir` | Recursive; `X` = execute only for directories (and already-executable files) |
| `chown alice f` / `chown alice:dev f` / `chown :dev f` | Owner / owner and group / group |
| `chgrp dev f` | Group only |
| `umask` / `umask 027` | Show / set the mask: files `666 − mask`, dirs `777 − mask` |

umask `022` → files `644`, dirs `755` · `027` → `640`/`750` · `077` → `600`/`700` · `002` → `664`/`775`

> [!WARNING]
> `chmod -R` and `chown -R` on the wrong path (especially `/`, `/etc`, `/usr`) can break the system and are hard to undo. Check the path, avoid `777`, and use `X` instead of `x` for recursive changes.

## Special Bits

| Bit | Octal | Shows as | On a file | On a directory |
|-----|-------|----------|-----------|----------------|
| SUID | `4000` | `s` in owner x (`S` if no x) | Runs as the file's owner (`/usr/bin/passwd`) | — |
| SGID | `2000` | `s` in group x | Runs as the file's group | New files inherit the directory's group |
| Sticky | `1000` | `t` in others x | — | Only owner (or root) may delete/rename files |

`chmod u+s`, `chmod g+s`, `chmod +t`, or `chmod 4755` / `2775` / `1777`. Audit: `find / -perm -4000 -type f 2>/dev/null`.

## Permission Check Order

The kernel checks **owner** first, then **group**, then **others** — the first matching class decides, even if a later class has more rights. Root (UID 0) bypasses read/write checks.

## Users and Groups

| File | Format |
|------|--------|
| `/etc/passwd` | `name:x:UID:GID:comment:home:shell` (world-readable) |
| `/etc/shadow` | `name:hash:lastchange:min:max:warn:…` (root only) |
| `/etc/group` | `group:x:GID:members` |

| Command | Purpose |
|---------|---------|
| `id [user]` / `groups` / `whoami` | Identity |
| `sudo useradd -m -s /bin/bash alice` / `sudo adduser alice` | Create a user (+ home) |
| `sudo passwd alice` | Set a password |
| `sudo usermod -aG dev alice` | Add to a group (**`-a`!**); re-login to apply |
| `sudo userdel -r alice` | Delete user and home |
| `sudo groupadd dev` | Create a group |
| `getent passwd alice` | Look up through NSS (files, LDAP) |

UID 0 = root · 1–999 system accounts · 1000+ regular users (Debian/Ubuntu/RHEL defaults).

## su vs sudo

| | `su - user` | `sudo cmd` |
|---|---|---|
| Password | The target user's | Your own |
| Scope | A whole shell | One command (or `sudo -i` shell) |
| Control | Anyone with the password | `/etc/sudoers` rules (`visudo`) |
| Audit | Minimal | Every command logged |
