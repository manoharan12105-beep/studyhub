# File Permissions and chmod — Interview Questions

## Beginner

### Q1. Explain the permission string `-rwxr-x---`.

<details>
<summary>Answer</summary>

`-` regular file; owner `rwx` (read, write, execute); group `r-x` (read, execute); others `---` (no access). Numerically 750.

</details>

### Q2. What does `chmod 755` mean?

<details>
<summary>Answer</summary>

Owner 7 = rwx, group 5 = r-x, others 5 = r-x → `rwxr-xr-x`. Typical for scripts, programs and directories that everyone may use but only the owner may change.

</details>

### Q3. How do you make a script executable?

<details>
<summary>Answer</summary>

`chmod +x script.sh` (or `chmod u+x` for the owner only, or `chmod 755`). Then run it with `./script.sh`. Without the execute bit you can still run it as `bash script.sh`, which needs only read permission.

</details>

### Q4. What are the numeric values of r, w and x?

<details>
<summary>Answer</summary>

r = 4, w = 2, x = 1. Each digit of an octal mode is their sum for one class: 6 = rw-, 5 = r-x, 4 = r--, 7 = rwx, 0 = ---.

</details>

### Q5. What do 644 and 600 mean, and when do you use each?

<details>
<summary>Answer</summary>

644 = `rw-r--r--`: the owner reads and writes, everyone else reads — normal files and public config. 600 = `rw-------`: only the owner can read or write — private keys, credential files, `~/.ssh/authorized_keys`.

</details>

## Intermediate

### Q6. What do read, write and execute mean on a directory?

<details>
<summary>Answer</summary>

Read: list the names inside. Write: create, delete and rename entries (requires execute as well). Execute: enter the directory (`cd`) and access entries by name — needed to open any file inside or pass through to subdirectories.

</details>

### Q7. Why can a user delete a file they have no write permission on?

<details>
<summary>Answer</summary>

Deleting removes a name from the directory, so it is controlled by write + execute permission on the **directory**, not by the file's own bits. A read-only file in a writable directory can be deleted (`rm` asks for confirmation first). The sticky bit on the directory (as on `/tmp`) restricts deletion to the file's owner.

</details>

### Q8. A user can read a file but cannot execute it. Why?

<details>
<summary>Answer</summary>

Most often the execute bit is missing for their class (`chmod u+x`). Other causes: the filesystem is mounted with `noexec`; a parent directory lacks `x`; for scripts, the shebang interpreter is missing or the file has CRLF line endings ("bad interpreter"); or a security module (SELinux/AppArmor) blocks it.

</details>

### Q9. If the owner has `---` and others have `rwx`, can the owner read the file?

<details>
<summary>Answer</summary>

No. The kernel picks a single class — owner if the user is the owner, else group, else others — and checks only that class's bits. There is no fallback. (The owner can, however, `chmod` the file back, because changing the mode depends on ownership, not on permission bits.)

</details>

### Q10. What is the difference between `chmod 755` and `chmod u+x`?

<details>
<summary>Answer</summary>

`755` sets all bits to exactly `rwxr-xr-x`, whatever they were before. `u+x` only adds execute for the owner and leaves the other eight bits unchanged.

</details>

## Advanced

### Q11. How do you set directories to 755 and files to 644 in a whole tree?

<details>
<summary>Answer</summary>

```bash
# Illustrative
find /srv/site -type d -exec chmod 755 {} +
find /srv/site -type f -exec chmod 644 {} +
```

Or in one command with capital X: `chmod -R u=rwX,go=rX /srv/site` (X adds execute to directories and to files that are already executable).

</details>

### Q12. Why is `chmod -R 777` a bad fix for a web application that cannot write its upload directory?

<details>
<summary>Answer</summary>

It gives every user and every process on the machine full control, including the ability to replace code or plant scripts that the web server executes. The right fix is to give the specific service account what it needs: make the upload directory owned by (or group-writable for) the application's user — e.g. `chown app:app uploads; chmod 750 uploads` — and keep code read-only to it.

</details>

### Q13. Does root ignore all permissions?

<details>
<summary>Answer</summary>

Root bypasses read and write checks and can traverse any directory, but to **execute** a regular file at least one execute bit must be set. Root can also be restricted by other mechanisms: read-only mounts, immutable attributes (`chattr +i`), SELinux/AppArmor policies, and capabilities when processes drop them.

</details>
