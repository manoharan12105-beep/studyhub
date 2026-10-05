# Scenario-Based Linux Interview Questions

**Module:** Interview · **Interview priority:** Core

## What Is It?

Open-ended "what would you do?" questions — a disk is full, a service is down, a port is taken, a user cannot log in, a deployment broke — where the interviewer cares more about **how** you investigate than about one command. The [questions](interview-questions.md) give model answers with a structured workflow, the commands at each step and the fix.

## Why It Matters

- Experienced-hire, DevOps and SRE interviews are dominated by scenarios.
- A calm, systematic answer shows you can be trusted with production systems.

## Core Concept

### A framework for every scenario

1. **Clarify and scope**: what exactly fails, since when, for whom, what changed recently (deployments, configuration, traffic)?
2. **Observe before acting**: state of the system (`df`, `free`, `top`, `systemctl status`, `ss`), logs (`journalctl`, `/var/log`).
3. **Form a hypothesis and test it** with the narrowest command.
4. **Mitigate safely**: the least destructive action that restores service, keeping evidence.
5. **Fix the root cause and prevent recurrence**: configuration, monitoring, rotation, documentation.

Say this structure out loud — interviewers grade the process.

### Coverage

| Area | Lessons |
|------|---------|
| Disk, files, commands | [Troubleshooting: Disk Space, Files and Commands](../../troubleshooting/troubleshooting-disk-and-files/content.md) |
| CPU, memory, services, ports, logs | [Troubleshooting: CPU, Memory, Services, Ports and Logs](../../troubleshooting/troubleshooting-processes-and-services/content.md) |
| Network and DNS | [Troubleshooting: Network Connectivity and DNS](../../troubleshooting/troubleshooting-network/content.md) |
| Access | [SSH](../../remote-access/ssh-and-remote-access/content.md), [su and sudo](../../users-and-groups/su-and-sudo/content.md), [Cron](../../system-management/cron-scheduling/content.md) |

## Key Takeaways

- Clarify → observe → hypothesise → mitigate → fix and prevent.
- Gather evidence (logs, process list, timestamps) before restarting or deleting.
- Prefer reversible actions; never `chmod 777`, `kill -9` first, or `rm -rf` unknown files.
- Finish every answer with prevention: monitoring, rotation, limits, automation.
