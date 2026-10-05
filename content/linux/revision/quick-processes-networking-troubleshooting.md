# 10 Minutes: Processes, Networking and Troubleshooting

Block 3 of 3. The workflows to recite for scenario questions.

## Five Workflows to Know Cold

| Scenario | Workflow |
|----------|----------|
| **Disk full** | `df -h` → `df -i` → `du -xh --max-depth=1 / \| sort -h` (drill down) → `find / -xdev -size +500M` → `lsof +L1` if `df` ≫ `du` → clean safely, truncate active logs → logrotate + alerts |
| **High CPU** | `uptime` vs `nproc` → `top` / `ps --sort=-%cpu` → owner, command, since when → `%wa` = I/O wait → renice / restart / investigate unknown processes |
| **High memory** | `free -h` (`available`) → `ps --sort=-rss` → `journalctl -k \| grep -i oom` → heap dump, restart, `MemoryMax=`, fix the leak |
| **Service won't start** | `systemctl status svc` → `journalctl -u svc -n 50` → config test (`nginx -t`) → port / permissions / paths → `daemon-reload` if unit changed → restart, watch logs |
| **Port in use** | `sudo ss -ltnp 'sport = :8080'` / `lsof -i :8080` → is it a duplicate? → `systemctl stop` or `kill` → or change port |

## Network Troubleshooting Ladder

1. `ip -br addr` — interface up, has an IP?
2. `ip route` — default gateway?
3. `ping -c 3 <gateway>` → `ping -c 3 1.1.1.1` — reachability by IP.
4. `getent hosts name` / `dig name` — DNS (`NXDOMAIN`, `SERVFAIL`, unreachable).
5. `nc -zv host port` / `curl -v` — the port: **refused** = nothing listening; **timeout** = firewall/down.
6. On the server: `ss -ltnp` — listening on `0.0.0.0` or only `127.0.0.1`?
7. Firewall: `ufw status`, security groups.

## Processes and Services in One Breath

- States `R S D T Z`; `D` cannot be killed; `Z` needs its parent fixed.
- SIGTERM first, SIGKILL last; `systemctl stop` does both with a timeout.
- `nohup`/`tmux`/systemd for long-running work; `&` dies at logout.
- `restart` = new process; `reload` = re-read config; `enable` = at boot.
- Logs: `journalctl -u svc --since "15 min ago" -p err -f`; previous boot `-b -1`; kernel `-k`.
- Cron: `m h dom mon dow`; minimal `PATH`; escape `%`; redirect output; `flock` against overlap.

## Common Errors → First Check

| Error | First check |
|-------|-------------|
| `Permission denied` (script) | `ls -l` — missing `x`; `noexec` mount |
| `Permission denied` (file/dir) | `id`, `namei -l path`, owner/group, directory `x` |
| `command not found` | Typo, `type cmd`, `echo $PATH`, installed?, `./` for local scripts |
| `No space left on device` | `df -h`, `df -i` |
| `Address already in use` | `ss -ltnp` |
| `Connection refused` | Service down / wrong port / bound to `127.0.0.1` |
| `Connection timed out` | Firewall / security group / host down |
| `Could not resolve host` | DNS: `resolv.conf`, `dig`, `/etc/hosts` |
| `Permission denied (publickey)` | Key offered (`ssh -v`), `authorized_keys`, `~/.ssh` 700 / 600 |
| Works manually, not in cron | `PATH`, shell, `%`, working directory, redirect output |
| `Operation not permitted` (as root) | `lsattr` immutable, read-only mount |

## Answer Framework

**Clarify** (what, since when, what changed) → **Observe** (state + logs) → **Hypothesise and test** → **Mitigate** (least destructive, keep evidence) → **Fix root cause** → **Prevent** (monitoring, rotation, limits, automation).
