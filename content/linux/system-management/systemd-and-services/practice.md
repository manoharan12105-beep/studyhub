# systemd and Services — Practice

These items need root and a systemd-based system (a VM, WSL with systemd, or a cloud server).

### P1. Start at boot and now

**Difficulty:** Easy · **Type:** Command · **Concepts:** enable --now

Make `nginx` start immediately and at every boot, with one command.

<details>
<summary>Answer</summary>

```bash
# Illustrative: needs root
sudo systemctl enable --now nginx
```

</details>

### P2. Enabled but not running

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** start vs enable

`systemctl is-enabled redis` prints `enabled`, but `systemctl is-active redis` prints `inactive`. What is true?

- A) Redis will never start
- B) Redis is not running now but will start at the next boot
- C) Redis is running but will not start at boot
- D) The unit file is broken

<details>
<summary>Answer</summary>

**Answer:** B) Redis is not running now but will start at the next boot

**Explanation:** `enable` affects boot; it does not start the service now. Run `sudo systemctl start redis` to start it.

</details>

### P3. Apply a config change gently

**Difficulty:** Easy · **Type:** Command · **Concepts:** reload

You changed `/etc/nginx/nginx.conf`. Check the syntax and apply the change without dropping active connections.

<details>
<summary>Answer</summary>

```bash
# Illustrative: needs root
sudo nginx -t && sudo systemctl reload nginx
```

</details>

### P4. Why did it fail?

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** status, journalctl

`systemctl status inventory` shows `Active: failed (Result: exit-code)` and `ExecStart=… (code=exited, status=1/FAILURE)`. List the commands you run next and three likely causes.

<details>
<summary>Answer</summary>

```bash
# Illustrative
journalctl -u inventory -n 100 --no-pager
journalctl -u inventory -b -p err
```

Likely causes: the application threw an exception at startup (missing configuration, cannot connect to the database), port 8080 already in use, the service user cannot read the JAR or config files, a wrong path in `ExecStart`, or missing environment variables because services do not read shell profiles.

</details>

### P5. Unit file changes ignored

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** daemon-reload

You added `Environment=SPRING_PROFILES_ACTIVE=prod` to `/etc/systemd/system/inventory.service` and restarted it, but the app still runs with the default profile. What did you forget?

<details>
<summary>Answer</summary>

`sudo systemctl daemon-reload` — systemd was still using the cached old unit definition. Reload, then restart, and confirm with `systemctl show inventory -p Environment`.

</details>

### P6. Write a unit

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** unit file directives

Write a unit file for `/opt/reports/report-server` (a binary that runs in the foreground and listens on port 9000), running as user `reports`, restarting 10 seconds after any failure, and starting at boot after the network is up.

<details>
<summary>Answer</summary>

```text
# /etc/systemd/system/report-server.service
[Unit]
Description=Report server
After=network-online.target
Wants=network-online.target

[Service]
User=reports
WorkingDirectory=/opt/reports
ExecStart=/opt/reports/report-server
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Illustrative: needs root
sudo systemctl daemon-reload
sudo systemctl enable --now report-server
```

</details>

### P7. Override without editing

**Difficulty:** Medium · **Type:** Command · **Concepts:** systemctl edit

Increase the open-files limit of the packaged `nginx.service` to 65536 so the change survives package upgrades.

<details>
<summary>Answer</summary>

```bash
# Illustrative: needs root
sudo systemctl edit nginx
# in the editor:
# [Service]
# LimitNOFILE=65536
sudo systemctl restart nginx
```

`systemctl edit` writes a drop-in in `/etc/systemd/system/nginx.service.d/` and reloads the configuration automatically.

</details>

### P8. Exit code 143

**Difficulty:** Hard · **Type:** Conceptual · **Concepts:** SuccessExitStatus

After every `systemctl stop`, a Spring Boot service shows `Active: failed (Result: exit-code) … status=143`. Why, and how do you fix the reporting?

<details>
<summary>Answer</summary>

systemd stops the service with SIGTERM; the JVM shuts down gracefully and exits with 128 + 15 = 143. systemd treats any non-zero exit as a failure unless told otherwise. Add `SuccessExitStatus=143` to the `[Service]` section (then `daemon-reload`) so a clean stop is recorded as success.

</details>
