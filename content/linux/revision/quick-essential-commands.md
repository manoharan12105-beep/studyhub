# 10 Minutes: Essential Commands

Block 1 of 3 for the last 30 minutes before an interview. One line per command — what it does and the option that matters.

## Navigate and Manage Files

- `pwd` · `cd -` (previous dir) · `cd ~` · `ls -lah` (long, all, human sizes) · `ls -lt` (newest first).
- `mkdir -p a/b/c` — parents too · `touch f` — create / update time.
- `cp -r src dst` · `mv old new` (rename = move) · `rm -i f` · `rm -r dir` — **no undo**.
- `ln -s target link` symlink · `ln target link` hard link.
- `file f` type · `stat f` inode, size, times, mode.

## View and Search

- `cat` all · `less` page (`/` search, `q` quit) · `head -n 5` · `tail -n 20` · `tail -f` follow.
- `grep -rin 'text' dir` — recursive, ignore case, line numbers · `-v` invert · `-c` count lines · `-w` word · `-E 'a|b'`.
- `find . -name '*.log' -mtime -7 -size +1M` — by name, age, size · `-type f/d` · `-exec cmd {} +`.
- `wc -l` lines · `sort -n` / `-r` / `-k2` · `uniq -c` (after `sort`) · `cut -d, -f2` · `tr a-z A-Z`.
- `sed 's/old/new/g'` · `sed -n '5,10p'` · `awk -F, '{print $2}'` · `awk 'NR>1 {s+=$4} END {print s}'`.

## Combine

- `|` pipe stdout → stdin · `>` overwrite · `>>` append · `2>` errors · `> f 2>&1` both · `2>/dev/null` discard.
- `cmd1 && cmd2` if success · `cmd1 || cmd2` if failure · `cmd1 ; cmd2` always.
- `xargs` builds arguments · `tee f` saves and shows · `$(cmd)` substitution.
- Classic: `grep ERROR app.log | sort | uniq -c | sort -rn | head`.

## Processes and Services

- `ps aux | grep [n]ame` · `pgrep -a name` · `top` (`P`, `M`, `k`, `q`).
- `kill PID` (TERM) → `kill -9 PID` (KILL) last · `pkill -f pattern`.
- `cmd &` · `jobs` · `fg` · `bg` · `Ctrl+Z` · `nohup cmd &`.
- `systemctl status|start|stop|restart|reload|enable --now svc` · `journalctl -u svc -f`.

## System, Disk, Network

- `df -h` filesystems · `du -sh *` sizes · `free -h` memory · `uptime` load · `uname -r` kernel.
- `ip -br a` addresses · `ip route` gateway · `ping -c 3` · `dig +short` · `ss -ltnp` ports.
- `curl -I url` headers · `curl -v` debug · `wget url` download.
- `ssh user@host` · `scp f host:dir` · `rsync -avz src/ host:dst/`.
- `tar -czf a.tar.gz dir` · `tar -xzf a.tar.gz` · `tar -tzf` list.
- `sudo apt update && sudo apt install pkg`.

## Help

`man cmd` · `cmd --help` · `type cmd` · `which cmd` · `apropos word`.
