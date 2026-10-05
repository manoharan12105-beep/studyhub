# Special Permissions — Interview Questions

## Beginner

### Q1. What is the sticky bit?

<details>
<summary>Answer</summary>

A special permission on directories: users can delete or rename only the files they own (the directory owner and root excepted), even if the directory is writable by everyone. `/tmp` has mode `1777` (`drwxrwxrwt`) for this reason.

</details>

### Q2. What is SUID?

<details>
<summary>Answer</summary>

Set User ID: when an executable with this bit runs, the process gets the file owner's privileges instead of the caller's. `/usr/bin/passwd` is SUID root, so any user can update their password in the root-only `/etc/shadow`, while the program itself restricts what they may change.

</details>

### Q3. What does SGID do on a directory?

<details>
<summary>Answer</summary>

Files and subdirectories created in it inherit the directory's group instead of the creator's primary group, and new subdirectories also get SGID. It is the basis of shared team directories.

</details>

### Q4. How do you set these bits?

<details>
<summary>Answer</summary>

Symbolically `chmod u+s file` (SUID), `chmod g+s dir` (SGID), `chmod +t dir` (sticky), or numerically with a leading digit: `4755`, `2775`, `1777` (combinations add up: `6755` = SUID + SGID).

</details>

## Intermediate

### Q5. What is the difference between `s` and `S` in `ls -l` output?

<details>
<summary>Answer</summary>

Lowercase `s` means the SUID/SGID bit **and** the execute bit are set. Uppercase `S` means the special bit is set but execute is not, so it has no effect (the file cannot be executed by that class). The same applies to `t` and `T` for the sticky bit.

</details>

### Q6. Why does Linux ignore SUID on shell scripts?

<details>
<summary>Answer</summary>

Running a script means the kernel starts the interpreter, which then opens the script by name. Between those steps an attacker could swap the file (a race condition), or influence the interpreter through environment variables (`IFS`, `PATH`, `ENV`). Because SUID scripts were reliably exploitable, Linux applies SUID only to binary executables. Use `sudo` with a specific rule instead.

</details>

### Q7. Why is `/tmp` world-writable but still safe?

<details>
<summary>Answer</summary>

Its mode is `1777`: everyone may create files (`rwx` for others), and the sticky bit ensures that only a file's owner (or root) can delete or rename it. Users cannot remove or replace each other's files.

</details>

### Q8. How do you find all SUID files on a system, and why would you?

<details>
<summary>Answer</summary>

`sudo find / -xdev -perm -4000 -type f 2>/dev/null` (`-2000` for SGID). Every SUID-root program is a potential path to root if it has a bug, so audits compare the list with the expected set from installed packages; an unexpected one (e.g. a copy of `bash` with SUID) indicates compromise.

</details>

## Advanced

### Q9. A team shares `/srv/project`, but files created by Alice cannot be edited by Bob. Diagnose and fix.

<details>
<summary>Answer</summary>

Likely causes: new files get Alice's primary group instead of the team group (no SGID on the directory), and/or her umask `022` makes them group read-only. Fix: `chgrp -R devs /srv/project`, `chmod 2775` (or `2770`) the directory (and existing subdirectories), set umask `002` for team members, make sure both are in `devs` (and have logged in again). Fix existing files with `chmod -R g+w`. ACLs with default entries (`setfacl -d -m g:devs:rwx`) are an alternative.

</details>

### Q10. What safer alternatives exist to making a program SUID root?

<details>
<summary>Answer</summary>

Linux capabilities grant a single privilege instead of full root: `sudo setcap cap_net_bind_service=+ep /usr/local/bin/myserver` lets it bind ports below 1024. Other options: a narrow `sudoers` rule, a systemd service that runs with the needed user and capabilities (`AmbientCapabilities=`), or a privileged helper behind a well-defined interface.

</details>

### Q11. What happens to SUID/SGID bits when a file is modified or copied?

<details>
<summary>Answer</summary>

When a non-root user writes to a SUID/SGID file, the kernel clears those bits (so a writable SUID file cannot be turned into a trojan). `cp` does not preserve them unless asked (`cp -p`/`-a` as root), and `chown` clears them as well. Filesystems mounted with `nosuid` ignore them entirely — common for `/tmp`, removable media and home directories on hardened systems.

</details>
