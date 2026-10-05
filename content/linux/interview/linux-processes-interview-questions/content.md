# Processes, Signals and Services Interview Questions

**Module:** Interview · **Interview priority:** Core

## What Is It?

An interview bank on processes and their states, `ps`/`top`, job control, signals, systemd services, logs and cron. These questions test whether you can keep a server's software running and diagnose it when it is not. The [questions](interview-questions.md) range from definitions to production scenarios.

## Why It Matters

- Backend and DevOps interviews always ask how to find, stop and restart processes and services.
- Zombies, orphans, SIGTERM vs SIGKILL and `nohup` are classic favourites.

## Core Concept

### How to answer a process question

1. **Name the mechanism** (fork/exec, signal, parent/child, systemd unit).
2. **Show the command** that observes it (`ps -o pid,ppid,stat`, `systemctl status`).
3. **Prefer the graceful path** (SIGTERM, `systemctl stop`) and explain when to escalate.

### Coverage

| Area | Lessons |
|------|---------|
| Processes | [Linux Processes](../../processes/linux-processes/content.md), [Process Monitoring](../../processes/process-monitoring/content.md), [Job Control](../../processes/job-control/content.md), [Signals](../../processes/linux-signals/content.md) |
| Services and scheduling | [systemd and Services](../../system-management/systemd-and-services/content.md), [Logs and journalctl](../../system-management/logs-and-journalctl/content.md), [Cron](../../system-management/cron-scheduling/content.md) |
| Troubleshooting | [CPU, Memory, Services, Ports and Logs](../../troubleshooting/troubleshooting-processes-and-services/content.md) |

## Key Takeaways

- A process is a running program with a PID, PPID, owner, state and resources; created by `fork()` + `execve()`.
- States: `R` running, `S` sleeping, `D` uninterruptible, `T` stopped, `Z` zombie.
- SIGTERM (15) asks, SIGKILL (9) forces, SIGHUP (1) hangs up / reloads, SIGINT (2) is Ctrl+C, SIGSTOP/SIGTSTP pause.
- `&`, `jobs`, `fg`, `bg`, `Ctrl+Z`, `nohup`, `disown`; services belong under systemd.
- `systemctl start/stop/restart/reload/enable/status`, `journalctl -u`, cron's five fields.
