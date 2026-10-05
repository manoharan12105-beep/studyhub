# Ports, Sockets and HTTP Tools — Practice

### P1. Listening ports

**Difficulty:** Easy · **Type:** Command · **Concepts:** ss

List all listening TCP and UDP ports with numeric addresses and the owning processes.

<details>
<summary>Answer</summary>

```bash
# Illustrative
sudo ss -tulpn
```

</details>

### P2. Read the listener

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** listening addresses

`ss -ltn` shows `LISTEN 0 4096 127.0.0.1:5432 0.0.0.0:*`. Who can connect to PostgreSQL?

- A) Any machine on the network
- B) Only processes on the same machine
- C) Nobody, it is not running
- D) Only root

<details>
<summary>Answer</summary>

**Answer:** B) Only processes on the same machine

**Explanation:** It listens on the loopback address. Remote access needs `listen_addresses = '*'` (or a specific IP) in `postgresql.conf`, plus `pg_hba.conf` and firewall rules.

</details>

### P3. Headers only

**Difficulty:** Easy · **Type:** Command · **Concepts:** curl -I

Show only the response headers of `https://example.com`, following redirects.

<details>
<summary>Answer</summary>

```bash
# Illustrative
curl -IL https://example.com
```

</details>

### P4. Status for a script

**Difficulty:** Medium · **Type:** Command · **Concepts:** curl -w, -o

Print only the HTTP status code of `http://localhost:8080/actuator/health`, giving up after 5 seconds.

<details>
<summary>Answer</summary>

```bash
# Illustrative
curl -s -o /dev/null --max-time 5 -w '%{http_code}\n' http://localhost:8080/actuator/health
```

`000` means no HTTP response at all (connection failed or timed out).

</details>

### P5. Refused or timeout?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** connection errors

From the app server, `nc -zv db01 5432` returns immediately with "Connection refused". From another network, the same command hangs and then times out. What does each result tell you?

<details>
<summary>Answer</summary>

From the app server, `db01` is reachable and answered, but nothing accepts connections on 5432 at that address — PostgreSQL is down, listening on another address (e.g. only `127.0.0.1`), or on another port. From the other network, packets get no answer at all — a firewall or security group is dropping them (or routing is missing).

</details>

### P6. Port conflict

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** ss -p, ps, kill

Starting your app fails with `Address already in use: bind 0.0.0.0:8080`. Write the commands to find out what owns the port and, if it is a stale copy of your own app, stop it gracefully.

<details>
<summary>Answer</summary>

```bash
# Illustrative
sudo ss -ltnp 'sport = :8080'        # → users:(("java",pid=4120,fd=45))
ps -o pid,user,etime,cmd -p 4120     # confirm it is your old instance
kill 4120                            # SIGTERM: graceful
sleep 5; ss -ltn 'sport = :8080'     # verify the port is free (kill -9 only if it refuses to exit)
```

If it is a systemd service, use `sudo systemctl stop <service>` instead, or start your app on another port.

</details>

### P7. Download and resume

**Difficulty:** Easy · **Type:** Command · **Concepts:** wget -c, curl -C

A large download of `https://example.com/big.iso` was interrupted. Resume it with wget, and give the curl equivalent.

<details>
<summary>Answer</summary>

```bash
# Illustrative
wget -c https://example.com/big.iso
curl -C - -O https://example.com/big.iso
```

</details>

### P8. Script that hides failures

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** curl -f, exit codes

A deployment script runs `curl -s https://api/internal/deploy-hook && echo "hook OK"`. It printed "hook OK" although the API returned `500 Internal Server Error`. Why, and how do you fix it?

<details>
<summary>Answer</summary>

`curl` exits 0 whenever it receives **any** HTTP response; a 500 is a successful transfer from curl's point of view. Add `-f` (`--fail`) so HTTP errors ≥ 400 produce exit code 22, and set timeouts:

```bash
# Illustrative
curl -sf --max-time 30 https://api/internal/deploy-hook && echo "hook OK" || { echo "hook failed" >&2; exit 1; }
```

</details>
