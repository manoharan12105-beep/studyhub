# 10 Minutes: Concepts, Permissions and Scripting

Block 2 of 3. The definitions and rules to say confidently.

## Linux Concepts

- **Linux** = kernel; **distribution** = kernel + GNU tools + package manager + init (systemd).
- **Kernel** manages CPU, memory, devices, filesystems; programs use it through **system calls**.
- **Shell** = command interpreter (bash) — a normal user-space program.
- **Everything is a file**: devices `/dev`, kernel info `/proc`, `/sys`.
- **FHS**: `/etc` config · `/var/log` logs · `/home` users · `/tmp` temporary · `/usr/bin` programs · `/opt` third-party.
- **Streams**: 0 stdin, 1 stdout, 2 stderr.
- **Inode** = metadata without the name; directory = name → inode. Hard link = same inode; symlink = path.
- **Process** = running program (PID, PPID, state); `fork` + `exec`; zombie = dead, unreaped; orphan = adopted by PID 1.
- **Signals**: TERM 15 polite, KILL 9 forced, HUP 1 reload, INT 2 Ctrl+C, TSTP Ctrl+Z.

## Permissions

- `rwx` = 4 2 1 for owner / group / others: `755` = `rwxr-xr-x`, `644` = `rw-r--r--`, `600` = `rw-------`, `750` = `rwxr-x---`.
- Directory: `r` list, `w` create/delete (needs `x`), `x` enter.
- Deleting a file depends on the **directory's** permissions.
- `umask 022` → files 644, dirs 755 (files start at 666, dirs at 777).
- **SUID** 4000 runs as owner (`passwd`) · **SGID** 2000 runs as group / dirs inherit group · **Sticky** 1000 only owner deletes (`/tmp` 1777).
- Checked in order owner → group → others; first match wins; root bypasses rw.
- `chmod u+x`, `chmod 640`, `chown user:group`, `chmod -R u=rwX,go=rX` — never `777`.

## Users and Privilege

- `/etc/passwd` accounts · `/etc/shadow` hashes (root only) · `/etc/group` groups · UID 0 = root.
- `id`, `whoami`, `groups` · `useradd -m`, `passwd`, `usermod -aG grp user` (**-a**), `userdel -r`.
- `su -` = become another user with **their** password · `sudo` = one command with **your** password, sudoers, logged · edit with `visudo`.

## Shell and Scripting

- `#!/usr/bin/env bash` · `chmod +x` · `./script.sh` (child) vs `source script.sh` (current shell).
- `var=value` (no spaces) · `export VAR` for children · `"$var"` always quoted.
- `'single'` literal · `"double"` expands `$var` and `$(cmd)`.
- `$1` `$#` `"$@"` `$?` `$$` `$!` · exit 0 = success.
- `if [[ -f "$f" ]]; then …; fi` · `-d` dir · `-z` empty · `-eq` numbers · `==` strings · `=~` regex.
- `for f in *.log; do …; done` · `while IFS= read -r line; do …; done < file`.
- `func() { local x=$1; …; return 0; }`.
- `set -euo pipefail` · `trap 'cleanup' EXIT` · `${var:-default}` · `${f%.log}`.

## Package Management and Archives

- `apt update` (lists) → `apt upgrade` (install newer) · `apt install/remove/purge` · `apt search/show` · `dpkg -l`, `dpkg -L pkg`, `dpkg -S file`.
- `tar -c` create · `-x` extract · `-t` list · `-z` gzip · `-f` file · `-C dir` target.
