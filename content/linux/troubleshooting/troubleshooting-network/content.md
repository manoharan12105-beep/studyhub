# Troubleshooting: Network Connectivity and DNS

**Module:** Troubleshooting · **Interview priority:** Frequently asked

## How to Use This Topic

Network problems are solved by testing **layer by layer**, from your own machine outwards, until one step fails. The scenarios follow **Symptoms → Possible Causes → Diagnostic Workflow → Fix → Prevention → Interview Explanation** and use the tools from [IP and hostname](../../networking/ip-and-hostname/content.md), [connectivity and DNS tools](../../networking/connectivity-and-dns-tools/content.md) and [ports and HTTP tools](../../networking/ports-and-http-tools/content.md).

| Step | Question | Command |
|------|----------|---------|
| 1 | Do I have an address and an interface that is up? | `ip -br addr`, `ip link` |
| 2 | Do I have a route (default gateway)? | `ip route` |
| 3 | Can I reach the gateway / an IP outside? | `ping -c 3 <gateway>`, `ping -c 3 1.1.1.1` |
| 4 | Does name resolution work? | `getent hosts name`, `dig name`, `cat /etc/resolv.conf` |
| 5 | Is the remote port reachable? | `nc -zv host port`, `curl -v` |
| 6 | Is the service listening, and on which address? (on the server) | `ss -ltnp` |
| 7 | Is a firewall in the way? | `ufw status`, `nft list ruleset`, cloud security groups |

Commands that need a real network are `# Illustrative` with typical output; local checks run in the [practice lab](../../linux-fundamentals/linux-practice-lab/content.md).

## Scenario 1: Cannot Reach a Server or Service

### Symptoms

- `curl`, a browser or an application cannot connect: "Connection refused", "Connection timed out", "No route to host", "Network is unreachable".

### Possible Causes

The **error message** narrows it down:

| Error | Meaning | Usual cause |
|-------|---------|-------------|
| `Could not resolve host` | DNS failed | Scenario 2 |
| `Connection refused` | The host answered: nothing listens on that port | Service down, wrong port, listening only on `127.0.0.1` |
| `Connection timed out` | No answer at all | Firewall dropping packets, host down, wrong IP, routing |
| `No route to host` | Host unreachable, or rejected by a firewall | Host down, firewall `REJECT`, wrong subnet |
| `Network is unreachable` | No route for that destination | No default gateway, interface down |

### Diagnostic Workflow

Work outwards. First, local configuration:

```bash
# Illustrative
ip -br addr
ip route
```

**Output (varies):**

```text
lo               UNKNOWN        127.0.0.1/8 ::1/128
eth0             UP             192.168.1.25/24 fe80::215:5dff:fe3a:1b2c/64
default via 192.168.1.1 dev eth0 proto dhcp src 192.168.1.25 metric 100
192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.25
```

No address, interface `DOWN`, or no `default via` line → the problem is local.

Next, basic reachability (ICMP may be blocked by firewalls, so a failed `ping` alone does not prove the host is down):

```bash
# Illustrative
ping -c 3 192.168.1.1           # gateway
ping -c 3 1.1.1.1               # the internet, by IP (no DNS involved)
traceroute -n 10.0.1.5          # where along the path do packets stop?
```

Then the actual port. Bash can test a TCP port without extra tools — here against the lab machine itself, first with nothing listening:

```bash
cd ~/linux-lab
timeout 2 bash -c '</dev/tcp/127.0.0.1/8080' 2>/dev/null && echo "port open" || echo "port closed"
```

**Output:**

```text
port closed
```

And with a small web server listening:

```bash
python3 -m http.server 8080 --bind 127.0.0.1 > /dev/null 2>&1 &
sleep 1
timeout 2 bash -c '</dev/tcp/127.0.0.1/8080' 2>/dev/null && echo "port open" || echo "port closed"
kill $!
```

**Output:**

```text
port open
```

The usual tools give clearer messages; these are real error messages for each case:

```bash
# Illustrative
nc -zv -w 2 127.0.0.1 8080
curl -sS http://127.0.0.1:8080/
curl -sS --connect-timeout 3 http://10.255.255.1:8080/
```

**Output (varies):**

```text
nc: connect to 127.0.0.1 port 8080 (tcp) failed: Connection refused
curl: (7) Failed to connect to 127.0.0.1 port 8080 after 0 ms: Could not connect to server
curl: (28) Connection timed out after 3002 milliseconds
```

"Refused" came back instantly — the host is reachable, but nothing listens. "Timed out" means packets got no answer — look for a firewall, a wrong IP or a down host.

On the server, check that the service listens on the right address:

```bash
# Illustrative
sudo ss -ltnp | grep :8080
# LISTEN 0 4096 127.0.0.1:8080 0.0.0.0:* users:(("java",pid=2210,fd=12))   ← local only!
```

### Fix

| Finding | Fix |
|---------|-----|
| Interface down / no IP | `sudo ip link set eth0 up`, fix DHCP or network configuration (netplan, NetworkManager) |
| No default route | Fix the gateway in the network configuration |
| Refused | Start the service, use the right port, bind to `0.0.0.0` or the public interface |
| Timed out | Open the port in the host firewall (`sudo ufw allow 8080/tcp`) and in the cloud security group / network ACL |

### Prevention

Health checks and monitoring of endpoints (not just hosts), firewall rules managed as code, documentation of which service listens on which port and address.

### Interview Explanation

"I go layer by layer: interface and IP with `ip addr`, route with `ip route`, reachability with `ping` and `traceroute`, DNS with `dig`, then the port with `nc -zv` or `curl -v`. The error matters: 'connection refused' means the host is reachable but nothing listens on that port, so I check the service and its bind address with `ss -ltnp`; a timeout usually means a firewall or security group is dropping packets, or the host is down."

## Scenario 2: DNS Issue

### Symptoms

- `Could not resolve host`, `Name or service not known`, `Temporary failure in name resolution`.
- Access by IP works, access by name does not.
- Some names resolve to the wrong (old) address.

### Possible Causes

- Wrong or unreachable DNS server in `/etc/resolv.conf` (or in systemd-resolved / NetworkManager configuration).
- The record does not exist (typo, not created yet) → `NXDOMAIN`.
- Stale caches after a DNS change (TTL not expired), or an old entry in `/etc/hosts` overriding DNS.
- Internal names need a search domain or an internal DNS server (VPN not connected).
- A firewall blocking port 53 (UDP and TCP).

### Diagnostic Workflow

The error messages from different tools (real output):

```bash
# Illustrative
ping -c 1 no-such-host.invalid
curl -sS http://no-such-host.invalid/
```

**Output (varies):**

```text
ping: no-such-host.invalid: Name or service not known
curl: (6) Could not resolve host: no-such-host.invalid
```

1. **Does it work by IP?** If `ping 1.1.1.1` works and names fail, it is DNS.

2. **What does the system resolver return?** `getent` follows the same path as applications (`/etc/hosts` first, then DNS, as configured in `/etc/nsswitch.conf`):

```bash
getent hosts localhost
```

**Output (varies):**

```text
::1             localhost
```

A name that does not resolve prints nothing and returns exit status 2:

```bash
getent hosts no-such-host.invalid
echo "exit status: $?"
```

**Output:**

```text
exit status: 2
```

```bash
grep -v '^#' /etc/hosts | head -3
```

**Output (varies):**

```text
127.0.0.1       localhost
127.0.1.1       devbox.localdomain      devbox
```

3. **Which DNS server is used, and what does it answer?**

```bash
# Illustrative
cat /etc/resolv.conf                      # nameserver lines (127.0.0.53 = systemd-resolved)
resolvectl status                         # the real upstream servers with systemd-resolved
dig no-such-host.invalid | grep -E 'status|SERVER'
```

**Output (varies):**

```text
;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 733
;; SERVER: 10.255.255.254#53(10.255.255.254) (UDP)
```

`NXDOMAIN` = the server answered "this name does not exist". Compare with a server that cannot be reached at all:

```bash
# Illustrative
dig @192.0.2.1 +time=2 +tries=1 example.com
```

**Output (varies):**

```text
;; communications error to 192.0.2.1#53: timed out

; <<>> DiG 9.20.24-1ubuntu0.3-Ubuntu <<>> @192.0.2.1 +time=2 +tries=1 example.com
; (1 server found)
;; global options: +cmd
;; no servers could be reached
```

4. **Is another resolver giving a different answer?** `dig @1.1.1.1 name +short` vs `dig name +short` reveals a broken or stale local DNS server.

| `dig` result | Meaning |
|--------------|---------|
| `status: NOERROR` with an answer | DNS works — the problem is elsewhere (or a stale/wrong address) |
| `status: NXDOMAIN` | The name does not exist on that server |
| `status: SERVFAIL` | The server failed to resolve it (upstream or DNSSEC problem) |
| `no servers could be reached` | The DNS server is unreachable — network or firewall |

### Fix

- Correct the DNS server in the network configuration (netplan, NetworkManager, systemd-resolved) rather than editing a generated `/etc/resolv.conf`.
- Create or fix the DNS record; wait for the TTL or flush caches (`resolvectl flush-caches`).
- Remove stale `/etc/hosts` entries.
- Connect the VPN or add the search domain for internal names.

### Prevention

Two DNS servers configured, sensible TTLs (lower them before planned migrations), DNS records managed as code, monitoring that resolves critical names.

### Interview Explanation

"If access by IP works but by name fails, it is DNS. I check `/etc/hosts` and `getent hosts name`, which follows the same lookup order as applications, then `/etc/resolv.conf` or `resolvectl status` for the configured server, and `dig name` for the answer status: `NXDOMAIN` means the record does not exist, `SERVFAIL` a resolver problem, a timeout an unreachable DNS server. Comparing with `dig @1.1.1.1 name` shows whether the local resolver is at fault."

## Scenario 3: Works Locally, Not From Other Machines

### Symptoms

- `curl http://localhost:8080` on the server works; from another machine the same service times out or is refused.

### Possible Causes

- The application listens only on `127.0.0.1` (a common default for development servers and databases).
- The host firewall (`ufw`, `firewalld`, `nftables`) blocks the port.
- A cloud security group or network ACL blocks it.
- The client uses the wrong IP (a private address from outside the network, an old DNS record).

### Diagnostic Workflow

```bash
# Illustrative: on the server
sudo ss -ltnp | grep :8080            # 127.0.0.1:8080 → local only; 0.0.0.0:8080 or *:8080 → all interfaces
sudo ufw status verbose               # or: sudo firewall-cmd --list-all / sudo nft list ruleset
# from the client
nc -zv -w 3 server.example.com 8080
```

### Fix

Bind the application to `0.0.0.0` (or the specific interface) in its configuration — for example `server.address` in Spring Boot or `listen_addresses` in PostgreSQL — and open the port only to the networks that need it (`sudo ufw allow from 10.0.0.0/16 to any port 8080 proto tcp`, security group rule).

### Prevention

Explicit bind addresses in configuration, a documented firewall policy, connectivity tests from outside in deployment checks.

### Interview Explanation

"When a service works on `localhost` but not remotely, I check the listening address with `ss -ltnp` — `127.0.0.1` means it only accepts local connections — then the host firewall and the cloud security group. Refused points to the bind address or a firewall reject; a timeout usually to a firewall that drops packets."

## Key Takeaways

- Troubleshoot layer by layer: interface → route → ping by IP → DNS → port → service → firewall.
- Read the error: *refused* = reachable but nothing listening; *timed out* = dropped (firewall, down, wrong IP); *could not resolve* = DNS.
- `getent hosts` tests the resolver the way applications use it; `dig` shows the DNS status (`NXDOMAIN`, `SERVFAIL`, unreachable).
- `ss -ltnp` on the server shows whether a service listens and on which address (`127.0.0.1` vs `0.0.0.0`).
- Test ports with `nc -zv`, `curl -v`, or bash's `/dev/tcp`.
