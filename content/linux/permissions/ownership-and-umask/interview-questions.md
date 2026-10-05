# Ownership: chown, chgrp and umask — Interview Questions

## Beginner

### Q1. How do you change the owner of a file?

<details>
<summary>Answer</summary>

`sudo chown newowner file`; owner and group together with `sudo chown user:group file`; recursively with `-R`. Only root can change a file's owner.

</details>

### Q2. What is the difference between `chown` and `chgrp`?

<details>
<summary>Answer</summary>

`chown` changes the owner (and optionally the group, with `user:group` or `:group`). `chgrp` changes only the group. The owner of a file may `chgrp` it to any group they belong to; changing the owner requires root.

</details>

### Q3. What is umask?

<details>
<summary>Answer</summary>

A per-process mask of permission bits that are removed from newly created files and directories. With the common umask `022`, new files get 644 and new directories 755. `umask` shows the current value; `umask 027` sets it for the current shell.

</details>

### Q4. Why are newly created files not executable?

<details>
<summary>Answer</summary>

Programs create regular files with a requested mode of 666 (no execute bits), and the umask can only remove bits, never add them. Execute must be granted explicitly with `chmod +x`. Directories start from 777, so they get `x` unless the umask removes it.

</details>

## Intermediate

### Q5. With umask 027, what permissions do new files and directories get?

<details>
<summary>Answer</summary>

Files: 666 with 027 masked → 640 (`rw-r-----`). Directories: 777 with 027 masked → 750 (`rwxr-x---`). Others get nothing.

</details>

### Q6. Why can't a normal user `chown` their file to someone else?

<details>
<summary>Answer</summary>

Giving files away would let users evade disk quotas, make another user appear responsible for content, or create files owned by a victim in places the victim trusts. On Linux, changing ownership is restricted to root (precisely, processes with the `CAP_CHOWN` capability).

</details>

### Q7. Is umask subtracted from the default mode?

<details>
<summary>Answer</summary>

No, it is a bitwise mask: `mode & ~umask`. The difference shows when the umask has bits that are not in the default. For files, umask `033`: 666 & ~033 = 644, whereas 666 − 033 would be 633.

</details>

### Q8. A web server cannot read files that `ls -l` shows as `-rw-r----- deploy deploy`. What do you check and change?

<details>
<summary>Answer</summary>

The server user (e.g. `www-data`) is neither the owner nor in the `deploy` group, so the "others" bits (`---`) apply. Options: change the group to one the server is in (`chgrp www-data`), add the server user to `deploy`, or grant `o+r` for public content. Also verify every parent directory grants `x` to that user, e.g. with `namei -l /srv/site/index.html`.

</details>

## Advanced

### Q9. How do you make a service create files with restrictive permissions?

<details>
<summary>Answer</summary>

Set the umask in the service's environment, not in your shell: `UMask=0027` in the systemd unit's `[Service]` section, a `umask 027` line in the start script, or the application's own setting. Verify by checking the mode of a file it creates.

</details>

### Q10. Files copied from another server show numbers instead of names in `ls -l`. Why?

<details>
<summary>Answer</summary>

Ownership is stored as numeric UIDs and GIDs. If the archive or disk carries a UID that has no entry in this system's `/etc/passwd`, `ls` can only print the number. Where the number does exist, it may map to a **different** user than on the source machine. Fix with `chown` after copying, or align UIDs across servers (or use `rsync`/`tar` options to map users by name).

</details>

### Q11. What is the security risk of `sudo chown -R $USER:$USER $DIR/` in a script?

<details>
<summary>Answer</summary>

If `DIR` is empty the command becomes `chown -R user:user /`, changing ownership of the whole system — breaking `sudo` (which requires root-owned files), SSH and services. Guard with `${DIR:?}`, validate the path, and avoid recursive ownership changes on system paths.

</details>
