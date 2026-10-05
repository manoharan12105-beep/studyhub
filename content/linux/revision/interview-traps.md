# Interview Traps

The precise answers to the gotchas interviewers use most. Proofs with runnable examples are in **Linux Interview Traps**.

## Redirection and Pipes

- `sort f > f` empties `f` before `sort` reads it — use `sort -o f f` or a temporary file.
- `cmd 2>&1 > f` leaves errors on the terminal; `cmd > f 2>&1` captures both.
- `sudo echo x > /etc/f` fails — the redirection runs as you; use `echo x | sudo tee /etc/f`.
- `cat f | while read …; done` loses variables (subshell); use `while …; done < f`.
- Without `pipefail`, a pipeline's status is the last command's.

## Text Tools

- `uniq` removes only **adjacent** duplicates — `sort | uniq` or `sort -u`.
- `grep -c` counts **lines**, not occurrences — `grep -o … | wc -l`.
- `wc -l` counts newlines — a last line without `\n` is not counted.
- `find . -name *.log` is expanded by the shell — quote `'*.log'`.
- `sed -i` without testing first rewrites the file irreversibly — run without `-i`, or use `-i.bak`.
- awk's `for (k in arr)` order is unspecified — pipe to `sort`.

## Files and Permissions

- Deleting needs `w`+`x` on the **directory**, not on the file.
- A deleted file still uses space while a process holds it open (`lsof +L1`); `df` ≠ `du`.
- `cp -r src dest` copies **into** `dest` if it exists; `rsync src/` vs `src` differ (trailing slash).
- `x` on a directory means "enter", not "execute"; `r` without `x` is nearly useless.
- `chmod 777` is never the fix; root ignores rw bits; SUID is ignored on scripts.
- `usermod -G grp user` (without `-a`) removes all other groups; group changes need a new login.
- Hard links cannot cross filesystems or point to directories; symlinks break when the target moves.

## Processes

- `kill` sends SIGTERM, which can be ignored; SIGKILL cannot be caught but waits for `D` state.
- Zombies cannot be killed — fix or restart the parent.
- A background job (`&`) dies at logout unless `nohup`, `disown`, `tmux` or a service.
- High load average with idle CPU = I/O wait, not CPU shortage.
- Low `free` memory is normal — look at `available`.
- `systemctl restart` ≠ `reload`; `start` ≠ `enable`.

## Shell and Scripting

- Unquoted variables split and glob: `[ $x = a ]` fails when `x` is empty — quote, or use `[[ ]]`.
- `for f in $(ls)` breaks on spaces — use `for f in *`.
- A script's `cd` or variables do not affect the calling shell — `source` it.
- Only `export`ed variables reach child processes.
- `$?` changes after every command, including `echo`.
- `$((7 / 2))` is `3` — integer arithmetic only.
- No spaces around `=` in assignments: `x = 5` runs a command named `x`.
- `rm -rf "$DIR/"*` with an empty `DIR` targets `/` — use `${DIR:?}` and `set -u`.

## System

- `/etc/resolv.conf` may be generated — change DNS through netplan/NetworkManager/resolved.
- `dig` ignores `/etc/hosts`; applications do not — compare with `getent hosts`.
- `ping` failing does not mean the host is down — ICMP may be blocked.
- Refused = port closed but host reachable; timeout = dropped or unreachable.
- Cron: minimal `PATH`, `/bin/sh`, `%` must be escaped, both day fields → either matches.
- `crontab -r` deletes the whole crontab without asking.
- `apt update` installs nothing.
- An `/etc/fstab` error can break booting — test with `mount -a`, use `nofail`.
