# systemd and Services: systemctl

**Module:** Services, Logs and Scheduling · **Interview priority:** Core

## What Is It?

**systemd** is the init system and service manager on almost all modern distributions (Ubuntu, Debian, RHEL, Fedora, Arch). It runs as **PID 1**, starts everything at boot in dependency order, supervises services (restarting them when they crash), collects their logs in the **journal**, and stops them cleanly at shutdown.

systemd manages **units**, each described by a unit file:

| Unit type | Manages | Example |
|-----------|---------|---------|
| `.service` | A daemon or one-off task | `nginx.service`, `ssh.service`, `inventory.service` |
| `.timer` | Scheduled activation (cron alternative) | `apt-daily.timer` |
| `.socket` | Socket activation | `ssh.socket` |
| `.target` | A group of units / a system state | `multi-user.target`, `graphical.target` |
| `.mount` | A mount point | `home.mount` |

`systemctl` is the command to control units; `journalctl` reads their logs (next topic).

## Why It Matters

- Starting, stopping, restarting and enabling services is daily backend and DevOps work.
- Running your own application (a Spring Boot JAR, a Node app) as a proper service gives automatic start at boot, restart on failure, logging and resource limits — far better than `nohup java -jar &`.
- Interview questions: `start` vs `enable`, `restart` vs `reload`, how to see why a service failed, how to write a unit file.

## Core Concept

### Service lifecycle

```text
            systemctl start            process running
inactive ───────────────► activating ─────────────────► active (running)
   ▲                                                       │
   │      systemctl stop (SIGTERM, then SIGKILL after       │
   └────── TimeoutStopSec)  ◄──────── deactivating ◄────────┘
                                                            │ crashes / exits non-zero
failed ◄────────────────────────────────────────────────────┘
   │  Restart=on-failure → systemd starts it again (with limits)
   └─ systemctl reset-failed clears the state
```

### start/stop vs enable/disable

These are independent:

| Command | Affects | Meaning |
|---------|---------|---------|
| `start` / `stop` | **Now** | Run or stop the service immediately |
| `enable` / `disable` | **Boot** | Start (or not) automatically at boot (creates/removes a symlink in a `.wants` directory) |
| `enable --now` | Both | Enable and start in one step |
| `mask` / `unmask` | Both | Make it impossible to start at all (link to `/dev/null`) |

A service can be enabled but stopped, or running but disabled (it will not come back after a reboot).

### restart vs reload

| | `restart` | `reload` |
|---|---|---|
| Process | Stopped and started (new PID) | Keeps running, re-reads configuration (usually via `SIGHUP`) |
| Connections | Dropped | Usually kept |
| Supported by | Every service | Only services that define `ExecReload` (nginx, sshd, Apache…) |
| `reload-or-restart` | Reload if possible, otherwise restart | |

### Where unit files live

| Path | Use |
|------|-----|
| `/usr/lib/systemd/system/` (or `/lib/systemd/system/`) | Units installed by packages — do not edit |
| `/etc/systemd/system/` | Your own units and overrides — take precedence |
| `/etc/systemd/system/name.service.d/override.conf` | Drop-in changes, created with `systemctl edit name` |

After creating or changing unit files, run `sudo systemctl daemon-reload` so systemd reads them.

### Targets: system states

| Target | Roughly | Old runlevel |
|--------|---------|--------------|
| `multi-user.target` | Normal server: networking, services, text logins | 3 |
| `graphical.target` | Multi-user plus a desktop | 5 |
| `rescue.target` | Single-user maintenance | 1 |
| `emergency.target` | Minimal shell, root filesystem read-only | — |

`systemctl get-default` shows the boot target. Services declare `WantedBy=multi-user.target` so `enable` hooks them into the normal boot.

## Commands

### Status

```bash
# Illustrative: output depends on the system
systemctl status cron --no-pager
```

**Output (varies):**

```text
● cron.service - Regular background program processing daemon
     Loaded: loaded (/usr/lib/systemd/system/cron.service; enabled; preset: enabled)
     Active: active (running) since Thu 2026-01-15 09:16:26 UTC; 20s ago
       Docs: man:cron(8)
   Main PID: 150 (cron)
      Tasks: 1 (limit: 9333)
     Memory: 512K (peak: 2M)
        CPU: 12ms
     CGroup: /system.slice/cron.service
             └─150 /usr/sbin/cron -f -P

Jan 15 09:16:26 devbox systemd[1]: Started cron.service - Regular background program processing daemon.
```

| Line | Tells you |
|------|-----------|
| `Loaded` | Unit file path; `enabled` = starts at boot |
| `Active` | State (`active (running)`, `inactive (dead)`, `failed`) and since when |
| `Main PID` | The main process |
| `Memory`, `CPU`, `Tasks` | Resource usage of the whole service (its cgroup) |
| `CGroup` | Every process belonging to the service |
| Last lines | The most recent journal entries — often the error message |

Quick checks for scripts:

```bash
# Illustrative
systemctl is-active cron      # active
systemctl is-enabled cron     # enabled
systemctl is-active nginx     # inactive (exit status non-zero)
```

### Control

```bash
# Illustrative: needs root
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx            # re-read config without dropping connections
sudo systemctl enable nginx            # start at boot
sudo systemctl enable --now nginx      # enable and start now
sudo systemctl disable nginx
```

### Listing

```bash
# Illustrative
systemctl list-units --type=service --state=running --no-pager
```

**Output (varies):**

```text
  UNIT                        LOAD   ACTIVE SUB     DESCRIPTION
  atd.service                 loaded active running Deferred execution scheduler
  chrony.service              loaded active running chrony, an NTP client/server
  cron.service                loaded active running Regular background program processing daemon
  dbus.service                loaded active running D-Bus System Message Bus
  rsyslog.service             loaded active running System Logging Service
```

| Command | Lists |
|---------|-------|
| `systemctl --failed` | Units in the failed state |
| `systemctl list-unit-files --type=service` | Installed services and whether they are enabled |
| `systemctl list-timers` | Scheduled timers and when they run next |
| `systemctl cat name` | The unit file (plus drop-ins) as systemd sees it |
| `systemctl show name -p MainPID -p ActiveState` | Specific properties |

### Reading a unit file

```bash
# Illustrative
systemctl cat cron --no-pager
```

**Output (varies):**

```text
# /usr/lib/systemd/system/cron.service
[Unit]
Description=Regular background program processing daemon
Documentation=man:cron(8)
After=remote-fs.target nss-user-lookup.target

[Service]
EnvironmentFile=-/etc/default/cron
ExecStart=/usr/sbin/cron -f -P $EXTRA_OPTS
IgnoreSIGPIPE=false
KillMode=process
Restart=on-failure
SyslogFacility=cron

[Install]
WantedBy=multi-user.target
```

## Examples

### Run a Spring Boot application as a service

```text
# /etc/systemd/system/inventory.service
[Unit]
Description=Inventory service (Spring Boot)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=inventory
Group=inventory
WorkingDirectory=/opt/inventory
EnvironmentFile=/etc/inventory/env
ExecStart=/usr/bin/java -Xmx512m -jar /opt/inventory/inventory.jar
SuccessExitStatus=143
Restart=on-failure
RestartSec=5
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
```

| Directive | Why |
|-----------|-----|
| `After=`/`Wants=network-online.target` | Start after the network is up |
| `User=`/`Group=` | Run as an unprivileged account, never root |
| `EnvironmentFile=` | Configuration (profiles, DB URL) outside the unit; services do not read shell profiles |
| `ExecStart=` | The command, with absolute paths, in the **foreground** (no `&`, no `nohup`) |
| `SuccessExitStatus=143` | A JVM stopped by SIGTERM exits with 143 (128 + 15); treat it as a clean stop |
| `Restart=on-failure`, `RestartSec=5` | Restart automatically after crashes, waiting 5 s |
| `TimeoutStopSec=30` | Wait up to 30 s for graceful shutdown after SIGTERM before SIGKILL |
| `WantedBy=multi-user.target` | What `enable` hooks the service into |

Install and run it:

```bash
# Illustrative: needs root
sudo systemctl daemon-reload
sudo systemctl enable --now inventory
systemctl status inventory --no-pager
journalctl -u inventory -f                  # follow its logs
```

### Change a packaged service safely

```bash
# Illustrative: needs root
sudo systemctl edit nginx        # opens an override file; add for example:
#   [Service]
#   LimitNOFILE=65536
sudo systemctl daemon-reload
sudo systemctl restart nginx
```

Overrides in `/etc/systemd/system/nginx.service.d/` survive package upgrades; editing the file under `/usr/lib/systemd/system/` does not.

### A service will not start

```bash
# Illustrative
systemctl status inventory --no-pager -l     # state, exit code, last log lines
journalctl -u inventory -n 50 --no-pager     # more context
journalctl -u inventory -b -p err            # errors since boot
```

Typical causes: wrong path in `ExecStart`, missing permissions for `User=`, port already in use, missing environment or config file, the program forking into the background with `Type=simple`. See [Troubleshooting Processes and Services](../../troubleshooting/troubleshooting-processes-and-services/content.md).

## Comparison

### systemctl start vs enable

| | `start` | `enable` |
|---|---|---|
| When it acts | Immediately | At the next boot (and later boots) |
| Survives reboot | No | Yes |
| Starts it now | Yes | No (unless `--now`) |

### systemd service vs nohup/cron

| | `nohup cmd &` | cron `@reboot` | systemd service |
|---|---|---|---|
| Starts at boot | No | Yes | Yes |
| Restarts on crash | No | No | `Restart=` |
| Logging | Manual redirect | Manual redirect | Journal (`journalctl -u`) |
| Clean stop | Find the PID | Find the PID | `systemctl stop` (SIGTERM, timeout, SIGKILL) |
| Runs as user, resource limits, dependencies | Manual | Limited | Built in |

### service (SysV) vs systemctl

`service nginx restart` still works on most systems — it forwards to `systemctl`. `/etc/init.d/` scripts are the pre-systemd mechanism.

## Common Mistakes

- Starting a service but forgetting `enable`, so it is gone after a reboot (or enabling it and forgetting to start it).
- Editing unit files and forgetting `systemctl daemon-reload`.
- Editing package unit files under `/usr/lib/systemd/system` instead of using `systemctl edit`.
- Putting `&`, `nohup` or `-d`/daemonise flags in `ExecStart` with `Type=simple` — systemd thinks the service exited.
- Running application services as root.
- Using `restart` when `reload` would avoid dropping connections (and the other way round, expecting `reload` to apply changes a service only reads at start).
- Relying on variables from `~/.bashrc` — use `Environment=`/`EnvironmentFile=`.

## Key Takeaways

- systemd (PID 1) starts, supervises and logs services; units are configured in unit files.
- `systemctl status|start|stop|restart|reload|enable|disable NAME`; `enable --now` does both.
- `start` = now, `enable` = at boot; `reload` re-reads config without a restart.
- Custom units go in `/etc/systemd/system/`; overrides with `systemctl edit`; then `daemon-reload`.
- A good service unit: absolute `ExecStart` in the foreground, dedicated `User=`, `Restart=on-failure`, `EnvironmentFile=`, `WantedBy=multi-user.target`.
- Diagnose with `systemctl status` and `journalctl -u NAME`.
