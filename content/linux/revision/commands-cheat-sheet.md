# Essential Commands Cheat Sheet

The commands used every day, grouped by task, with the options worth remembering. Details are in each lesson.

## Navigation and Files

| Command | Purpose | Key options |
|---------|---------|-------------|
| `pwd` | Print the current directory | |
| `cd dir` | Change directory | `cd` / `cd ~` home, `cd -` previous, `cd ..` parent |
| `ls` | List directory contents | `-l` long, `-a` hidden, `-h` human sizes, `-t` by time, `-S` by size, `-r` reverse, `-d` the directory itself |
| `mkdir dir` | Create a directory | `-p` create parents, no error if it exists |
| `touch file` | Create an empty file / update its timestamp | |
| `cp src dst` | Copy | `-r` directories, `-i` ask, `-p`/`-a` keep attributes, `-v` verbose |
| `mv src dst` | Move or rename | `-i` ask, `-n` never overwrite |
| `rm file` | Remove | `-r` recursive, `-f` force, `-i` ask; **no undo** |
| `rmdir dir` | Remove an **empty** directory | |
| `ln -s target name` | Symbolic link | without `-s`: hard link |
| `file f` | Detect the file type | |
| `stat f` | Full metadata (inode, size, times, mode) | |
| `tree` | Directory tree (if installed) | `-L 2` depth |

## Viewing Files

| Command | Purpose | Key options |
|---------|---------|-------------|
| `cat f` | Print a whole file | `-n` number lines, `-A` show hidden characters |
| `less f` | Page through a file | `/text` search, `n` next, `G` end, `q` quit, `F` follow |
| `head f` | First lines | `-n 20` |
| `tail f` | Last lines | `-n 20`, `-f` follow, `-F` follow across rotation |
| `wc f` | Count lines, words, bytes | `-l`, `-w`, `-c` |

## Searching and Text Processing

| Command | Purpose | Key options |
|---------|---------|-------------|
| `grep pat f` | Lines matching a pattern | `-i` ignore case, `-v` invert, `-n` line numbers, `-c` count lines, `-r` recursive, `-l` file names, `-w` whole word, `-E` extended regex, `-o` only match, `-A/-B/-C N` context, `-q` quiet |
| `find dir tests` | Find files | `-name`, `-iname`, `-type f/d/l`, `-size +100M`, `-mtime -7`, `-user`, `-perm`, `-exec … {} +`, `-delete` |
| `sort` | Sort lines | `-n` numeric, `-r` reverse, `-k2` by field, `-t,` separator, `-u` unique, `-h` human sizes |
| `uniq` | Collapse **adjacent** duplicates | `-c` count, `-d` only duplicates, `-u` only unique |
| `cut` | Extract columns | `-d, -f1,3`, `-c1-10` |
| `tr` | Translate/delete characters | `tr a-z A-Z`, `-d`, `-s` squeeze |
| `sed` | Stream editing | `s/old/new/g`, `-n '5,10p'`, `'/re/d'`, `-i` in place, `-E` |
| `awk` | Field processing | `-F,`, `'{print $1}'`, `NR>1`, `$3 > 50`, `END {}` |
| `diff a b` | Compare files | `-u` unified |
| `xargs` | Build commands from input | `-0` with `-print0`, `-n 1`, `-I {}` |
| `tee f` | Write to file **and** stdout | `-a` append |

## Processes and System

| Command | Purpose | Key options |
|---------|---------|-------------|
| `ps aux` / `ps -ef` | All processes | `-o pid,ppid,stat,cmd`, `--sort=-%cpu` |
| `top` / `htop` | Live process view | `P` CPU, `M` memory, `k` kill, `q` quit |
| `pgrep` / `pkill` | Find / signal by name | `-a` show command, `-f` full command line, `-u user` |
| `kill PID` | Send a signal (SIGTERM) | `-9` SIGKILL, `-HUP`, `-l` list |
| `jobs` / `fg` / `bg` | Job control | `Ctrl+Z` suspend, `cmd &` background |
| `nohup cmd &` | Survive logout | |
| `systemctl` | Services | `status`, `start`, `stop`, `restart`, `reload`, `enable --now`, `is-active` |
| `journalctl` | System logs | `-u svc`, `-f`, `-n 50`, `--since`, `-p err`, `-b` |
| `uptime` / `free -h` / `df -h` / `du -sh` | Load / memory / filesystems / directory size | |
| `uname -a` / `hostnamectl` | Kernel / host info | |

## Users and Permissions

| Command | Purpose |
|---------|---------|
| `whoami` / `id` | Current user / UID, GID, groups |
| `chmod 640 f` / `chmod u+x f` | Change permissions |
| `chown user:group f` | Change owner (root) |
| `umask` | Default permission mask |
| `sudo cmd` / `sudo -i` | Run as root / root shell |
| `su - user` | Switch user |
| `useradd -m -s /bin/bash u` / `usermod -aG grp u` / `passwd u` | Manage users |

## Network, Archives, Packages

| Command | Purpose |
|---------|---------|
| `ip -br addr` / `ip route` | Addresses / routes |
| `ping -c 3 host` / `traceroute host` | Reachability / path |
| `dig name +short` / `getent hosts name` | DNS / system resolver |
| `ss -ltnp` | Listening TCP ports with processes |
| `curl -v url` / `curl -I url` / `wget url` | HTTP request / headers / download |
| `ssh user@host` / `scp f host:dir` / `rsync -avz src/ host:dst/` | Remote shell / copy / sync |
| `tar -czf a.tar.gz dir` / `tar -xzf a.tar.gz` / `tar -tzf a.tar.gz` | Create / extract / list |
| `gzip f` / `gunzip f.gz` / `zip -r a.zip dir` / `unzip a.zip` | Compression |
| `sudo apt update` / `sudo apt install pkg` / `apt search` / `apt show` / `dpkg -l` | Packages |

## Help

`man cmd` · `cmd --help` · `help builtin` · `type cmd` · `which cmd` · `apropos keyword`
