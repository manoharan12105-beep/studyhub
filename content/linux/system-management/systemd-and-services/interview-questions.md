# systemd and Services — Interview Questions

## Beginner

### Q1. What is systemd?

<details>
<summary>Answer</summary>

The init system and service manager on most modern Linux distributions. It runs as PID 1, starts units at boot in dependency order and in parallel, supervises and restarts services, manages logging through the journal, and handles shutdown. `systemctl` controls it.

</details>

### Q2. What is the difference between `systemctl start` and `systemctl enable`?

<details>
<summary>Answer</summary>

`start` runs the service now; it will not come back after a reboot unless enabled. `enable` configures it to start automatically at boot (it creates a symlink into the target's `.wants` directory) but does not start it now. `systemctl enable --now` does both.

</details>

### Q3. How do you check whether a service is running?

<details>
<summary>Answer</summary>

`systemctl status name` (state, main PID, memory, recent logs) or, in scripts, `systemctl is-active --quiet name` (exit status 0 if active).

</details>

### Q4. What is the difference between `restart` and `reload`?

<details>
<summary>Answer</summary>

`restart` stops and starts the service — new process, dropped connections, a brief outage. `reload` asks the running service to re-read its configuration (typically via `SIGHUP`) without stopping, so connections usually survive; it works only if the unit defines `ExecReload`. `reload-or-restart` picks whichever is available.

</details>

## Intermediate

### Q5. How do you find out why a service failed to start?

<details>
<summary>Answer</summary>

`systemctl status name -l --no-pager` shows the state, the exit code or signal, and the last log lines. `journalctl -u name -n 100 --no-pager` (or `-b` for this boot, `-p err` for errors) gives full context. Then check the `ExecStart` path, file permissions for the service user, required config/environment files, ports in use, and dependencies.

</details>

### Q6. You edited a unit file but systemd still uses the old settings. Why?

<details>
<summary>Answer</summary>

systemd caches unit definitions. Run `sudo systemctl daemon-reload`, then restart the service. `systemctl status` warns "unit file changed on disk" in this situation.

</details>

### Q7. Where should you put your own unit files and changes to packaged units?

<details>
<summary>Answer</summary>

Own units: `/etc/systemd/system/name.service`. Changes to packaged units: drop-in overrides via `sudo systemctl edit name`, stored in `/etc/systemd/system/name.service.d/override.conf`. Files under `/usr/lib/systemd/system/` belong to packages and are overwritten on upgrade.

</details>

### Q8. What does `Restart=on-failure` do?

<details>
<summary>Answer</summary>

systemd restarts the service when it exits with a non-zero status, is killed by a signal (other than a clean stop), or times out — but not when it exits cleanly or is stopped with `systemctl stop`. `RestartSec=` sets the delay; `StartLimitBurst`/`StartLimitIntervalSec` stop restart loops ("start request repeated too quickly").

</details>

### Q9. What is a systemd target?

<details>
<summary>Answer</summary>

A unit that groups other units and represents a system state, replacing SysV runlevels: `multi-user.target` (normal server, like runlevel 3), `graphical.target` (desktop, 5), `rescue.target` (single-user, 1). Services declare `WantedBy=multi-user.target` so enabling them hooks them into normal boot.

</details>

## Advanced

### Q10. Write a minimal unit file to run a Java application as a service.

<details>
<summary>Answer</summary>

```text
[Unit]
Description=My app
After=network-online.target
Wants=network-online.target

[Service]
User=myapp
WorkingDirectory=/opt/myapp
EnvironmentFile=/etc/myapp/env
ExecStart=/usr/bin/java -jar /opt/myapp/app.jar
SuccessExitStatus=143
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then `daemon-reload` and `enable --now`. Key points: absolute paths, run in the foreground, unprivileged user, environment from a file, and 143 treated as success because a JVM stopped with SIGTERM exits with 128 + 15.

</details>

### Q11. How does `systemctl stop` terminate a service?

<details>
<summary>Answer</summary>

It runs `ExecStop` if defined; otherwise it sends `SIGTERM` (the configurable `KillSignal`) to the processes in the service's cgroup (per `KillMode`), waits up to `TimeoutStopSec` (default 90 s), then sends `SIGKILL` to whatever remains. Because the whole cgroup is tracked, child processes are not left behind.

</details>

### Q12. A service runs fine from your shell but fails under systemd. What differences do you check?

<details>
<summary>Answer</summary>

Environment (no shell profiles: `PATH`, `JAVA_HOME` and app variables must be set with `Environment=`/`EnvironmentFile=`), user and permissions (`User=`), working directory, the `Type=` (a program that daemonises needs `Type=forking` or a foreground flag), sandboxing options (`ProtectSystem`, `PrivateTmp`), resource limits (`LimitNOFILE`), SELinux/AppArmor contexts, and dependencies started too late (`After=network-online.target`).

</details>
