# Permissions and Users Interview Questions — Interview Questions

## Beginner

### Q1. Explain `-rwxr-x---` and give its octal value.

<details>
<summary>Answer</summary>

`-` regular file; owner `rwx` (4+2+1 = 7), group `r-x` (4+1 = 5), others `---` (0) → `750`. The owner can read, write and execute; group members can read and execute; everyone else has no access.

</details>

### Q2. What do read, write and execute mean on a directory?

<details>
<summary>Answer</summary>

`r` lists the names in it; `w` creates, deletes and renames entries (needs `x` too); `x` enters it (`cd`) and accesses entries by name. A directory with `x` but no `r` lets you open a file whose name you know but not list the contents; `r` without `x` shows names but no details or access.

</details>

### Q3. How do you make a script executable for its owner only?

<details>
<summary>Answer</summary>

`chmod u+x script.sh` adds execute for the owner. `chmod 700 script.sh` sets exactly `rwx------`. Then run it with `./script.sh`.

</details>

### Q4. What is the difference between `chmod` and `chown`?

<details>
<summary>Answer</summary>

`chmod` changes the permission bits (who may read/write/execute). `chown` changes the owner and/or group (`chown alice:dev file`); only root can give a file to another user. `chgrp` changes only the group.

</details>

### Q5. Where are user accounts and passwords stored?

<details>
<summary>Answer</summary>

`/etc/passwd` lists accounts (`name:x:UID:GID:comment:home:shell`) and is world-readable. Password hashes are in `/etc/shadow`, readable only by root (and the `shadow` group), together with password ageing data. Groups are in `/etc/group` (and `/etc/gshadow`). `getent passwd name` also covers LDAP or other sources.

</details>

### Q6. What is the root user, and what is UID 0?

<details>
<summary>Answer</summary>

`root` is the superuser. The kernel grants privileges by UID, and UID 0 bypasses permission checks: it can read or change any file, kill any process, bind low ports and change system configuration. Any account with UID 0 is effectively root, which is why extra UID-0 accounts are a red flag.

</details>

## Intermediate

### Q7. What is `umask`? Which permissions does a new file get with umask `027`?

<details>
<summary>Answer</summary>

`umask` removes permissions from the defaults when files are created: files start from `666`, directories from `777`. With `027`: files `666` minus `027` → `640` (`rw-r-----`); directories `777` minus `027` → `750` (`rwxr-x---`). (Bitwise: default AND NOT umask.)

</details>

### Q8. What are SUID, SGID and the sticky bit?

<details>
<summary>Answer</summary>

**SUID** (`4000`, `s` in the owner's execute slot) on an executable: it runs with the file **owner's** privileges — `passwd` is SUID root so users can update `/etc/shadow`. **SGID** (`2000`) on an executable runs with the file's group; on a directory, new files inherit the directory's group (shared project folders). **Sticky bit** (`1000`, `t`) on a directory: only a file's owner, the directory owner or root can delete or rename it — `/tmp` is `1777`.

</details>

### Q9. What is the difference between `su` and `sudo`?

<details>
<summary>Answer</summary>

`su user` starts a shell as that user (root by default) and needs **their** password. `sudo cmd` runs a single command as root (or another user) with **your** password, if `/etc/sudoers` allows it, and logs it. `sudo` gives auditable, fine-grained privilege and avoids sharing the root password. `su -` / `sudo -i` give a full login environment.

</details>

### Q10. How do you add an existing user to a group? What is the common mistake?

<details>
<summary>Answer</summary>

`sudo usermod -aG docker alice` (or `sudo gpasswd -a alice docker`). The mistake is `usermod -G docker alice` without `-a`, which **replaces** all supplementary groups (possibly removing `sudo`). The change applies to new logins: the user must log out and in, or use `newgrp docker`; check with `id alice`.

</details>

### Q11. A user is in the `dev` group, the file is `-rw-r----- root dev`, yet they get "Permission denied" reading it. Why?

<details>
<summary>Answer</summary>

Possibilities: they were added to the group but have not logged in again (`id` in their session lacks `dev`); a directory on the path lacks `x` for them (`namei -l /path/to/file`); an ACL denies it (`getfacl`); SELinux/AppArmor. The file bits themselves allow group read.

</details>

### Q12. How do you safely edit the sudoers configuration?

<details>
<summary>Answer</summary>

With `sudo visudo` (or `sudo visudo -f /etc/sudoers.d/name`), which locks the file and checks the syntax before saving — a broken sudoers file can lock everyone out of `sudo`. Prefer small files in `/etc/sudoers.d/`, grant specific commands where possible (`deploy ALL=(root) /usr/bin/systemctl restart myapp`), and avoid `NOPASSWD: ALL`.

</details>

## Advanced

### Q13. Why is SUID on a shell script ignored, and why are SUID binaries a security concern?

<details>
<summary>Answer</summary>

Linux ignores SUID on interpreted scripts because the interpreter is started separately, which allows race conditions and environment tricks (`PATH`, `IFS`) to hijack the privileged run. SUID binaries run with the owner's privileges for any user, so a bug in them (or a writable SUID file) becomes privilege escalation. Audit with `find / -perm -4000 -type f 2>/dev/null`, keep the list minimal, and prefer `sudo` rules or capabilities (`setcap`).

</details>

### Q14. Root sets a file to `000`. Can root still read it? Can the owner?

<details>
<summary>Answer</summary>

Root can still read and write it — UID 0 bypasses permission bits (only execute needs at least one `x` bit set). The owner cannot read it, but as owner can `chmod` it back. Root's limits are elsewhere: the immutable attribute, read-only mounts, SELinux, NFS root squash.

</details>

### Q15. Design permissions for a shared directory `/srv/project` where all `dev` members can create and edit files, files keep the `dev` group, and members cannot delete each other's files.

<details>
<summary>Answer</summary>

```bash
# Illustrative: needs root
sudo mkdir -p /srv/project
sudo chown root:dev /srv/project
sudo chmod 3770 /srv/project     # SGID (2000) + sticky (1000) + rwxrwx---
```

SGID makes new files inherit the `dev` group; sticky prevents deleting others' files; `770` keeps outsiders out. Members also need a umask like `002` (or a default ACL: `setfacl -d -m g:dev:rwX /srv/project`) so group members can edit each other's files.

</details>
