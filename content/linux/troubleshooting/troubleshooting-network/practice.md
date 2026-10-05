# Troubleshooting: Network Connectivity and DNS — Practice

### P1. Read the error

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** refused vs timeout

`curl http://10.0.1.5:8080/` immediately prints `Failed to connect to 10.0.1.5 port 8080 after 2 ms: Could not connect to server` (refused). What is the most likely cause?

- A) DNS is broken
- B) A firewall silently drops the packets
- C) The host is reachable, but nothing listens on port 8080
- D) The network cable is unplugged

<details>
<summary>Answer</summary>

**Answer:** C) The host is reachable, but nothing listens on port 8080

**Explanation:** An immediate refusal is a reply from the host. Dropped packets would cause a timeout; DNS is not involved when you use an IP.

</details>

### P2. Which layer?

**Difficulty:** Easy · **Type:** Scenario · **Concepts:** layered troubleshooting

`ping 1.1.1.1` works, `ping example.com` prints `Temporary failure in name resolution`. Which layer is broken, and what are your next two commands?

<details>
<summary>Answer</summary>

DNS — IP connectivity works. Next: `cat /etc/resolv.conf` (or `resolvectl status`) to see the configured DNS servers, then `dig example.com` (and `dig @1.1.1.1 example.com`) to see whether the configured server answers.

</details>

### P3. Test a port without nc

**Difficulty:** Medium · **Type:** Output · **Concepts:** /dev/tcp

In the lab, nothing listens on port 9090. What does this print?

```bash
cd ~/linux-lab
timeout 2 bash -c '</dev/tcp/127.0.0.1/9090' 2>/dev/null && echo "open" || echo "closed"
```

<details>
<summary>Answer</summary>

**Output:**

```text
closed
```

Bash's `/dev/tcp/host/port` opens a TCP connection; it fails (refused), so the `||` branch runs. `timeout` guards against hanging when packets are dropped.

</details>

### P4. Resolver lookup

**Difficulty:** Easy · **Type:** Command · **Concepts:** getent, /etc/hosts

Show how the system resolves `localhost`, the same way applications do.

<details>
<summary>Answer</summary>

```bash
getent hosts localhost
```

It consults the sources in `/etc/nsswitch.conf` — normally `/etc/hosts` first, then DNS. The address shown (`127.0.0.1` or `::1`) depends on the system.

</details>

### P5. Local only

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** bind address

On a server, `sudo ss -ltnp | grep 5432` prints:

```text
LISTEN 0 200 127.0.0.1:5432 0.0.0.0:* users:(("postgres",pid=812,fd=6))
```

An application on another machine cannot connect to the database. What is wrong and what must change?

<details>
<summary>Answer</summary>

PostgreSQL listens only on the loopback address, so remote connections are refused. Set `listen_addresses = '*'` (or the server's private IP) in `postgresql.conf`, allow the client network in `pg_hba.conf`, restart PostgreSQL, and open port 5432 in the firewall only for the application's network.

</details>

### P6. Stale address

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** /etc/hosts vs DNS

`dig +short api.internal` prints `10.0.2.20` (the new server), but `curl http://api.internal/health` still reaches the old server `10.0.1.20`. What do you check first?

<details>
<summary>Answer</summary>

`/etc/hosts` — `grep api.internal /etc/hosts` — or run `getent hosts api.internal`. `dig` bypasses `/etc/hosts`, but applications use it first; an old entry overrides DNS. Other possibilities: a local caching resolver or the application's own DNS cache.

</details>

### P7. DNS status codes

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** dig status

`dig shop.example.com` shows `status: SERVFAIL`. What does it mean?

- A) The name does not exist
- B) The DNS server could not complete the resolution (upstream or DNSSEC problem)
- C) The answer was found
- D) Your machine has no network

<details>
<summary>Answer</summary>

**Answer:** B) The DNS server could not complete the resolution (upstream or DNSSEC problem)

**Explanation:** `NXDOMAIN` means the name does not exist; `NOERROR` means success; an unreachable server gives "no servers could be reached" rather than a status.

</details>

### P8. Timeout from outside

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** firewall, security groups

A new VM in the cloud runs nginx. `curl localhost` on the VM works, `sudo ss -ltnp` shows `0.0.0.0:80`, but from your laptop `curl http://<public-ip>/` times out. List the likely causes in order of checking.

<details>
<summary>Answer</summary>

1. Cloud security group / network ACL does not allow inbound TCP 80 (the most common cause of timeouts on new VMs).
2. The host firewall: `sudo ufw status` / `sudo nft list ruleset`.
3. Wrong IP: the public IP vs the private IP, or the VM has no public IP / the load balancer is not configured.
4. Routing for the subnet (no internet gateway attached).

The listener is correct (`0.0.0.0:80`), so the application is not the problem; a timeout (not a refusal) points to packet filtering.

</details>
