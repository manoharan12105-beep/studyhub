# Troubleshooting Connection Errors

**Module:** Troubleshooting · **Interview priority:** Core

## How to Use This Topic

These scenarios start **after** basic connectivity works: the host can reach the network, but a specific connection or service fails. Each scenario: **Symptoms → Possible Causes → Diagnostic Workflow → Fix → Prevention → Interview Explanation**. The key skill is reading the error: **refused**, **timeout**, **unreachable** and **reset** each point to different layers.

| Error | What happened on the wire | Points to |
|-------|---------------------------|-----------|
| **Connection refused** | SYN answered by **RST** | Host reachable; nothing listening on that IP:port (or a firewall *rejects*) |
| **Connection timed out** | SYN answered by **nothing** | Firewall *dropping*, wrong IP/route, host down |
| **No route to host / Network unreachable** | ICMP unreachable, or no local route | Routing, gateway, or firewall reject (host prohibited) |
| **Port unreachable** (UDP) | ICMP port unreachable | Nothing listening on that UDP port |
| **Connection reset by peer** | RST in the middle of a connection | Server/app crashed or closed abruptly, proxy/LB/firewall killed an idle connection |

## Scenario 1: Connection Refused

### Symptoms

`curl: (7) Failed to connect to 10.0.2.20 port 8080 … Could not connect to server`, `java.net.ConnectException: Connection refused`, PostgreSQL "Connection refused. Check that the hostname and port are correct and that the postmaster is accepting TCP/IP connections." The error appears **immediately**.

### Possible Causes

- The service is not running or crashed.
- It listens on a **different port**.
- It listens only on **`127.0.0.1`** (localhost) while you connect via the network IP.
- You connect to `localhost` from inside a **container**, which is the container itself.
- A firewall configured to **reject** (rather than drop).

### Diagnostic Workflow

```bash
# Illustrative: on the server
sudo ss -ltnp | grep 8080       # is anything listening? on which address?
systemctl status myapp          # is the service running? recent crash?
# from the client
nc -zv 10.0.2.20 8080
```

`LISTEN 127.0.0.1:8080` means local-only: remote clients are refused.

### Fix

Start/fix the service; use the correct port; bind to `0.0.0.0` or the network IP (`server.address`, PostgreSQL `listen_addresses`); use the right host from containers (service name, `host.docker.internal`).

### Prevention

Health checks and restarts (systemd, Kubernetes probes), configuration reviews, explicit bind addresses.

### Interview Explanation

"Refused means my SYN reached a host that answered with RST — the network path works, but nothing is listening on that address and port. I check whether the service runs, which port and address it binds to, and whether I'm inside a container calling localhost."

## Scenario 2: Connection Timeout

### Symptoms

The client hangs, then: `curl: (28) Connection timed out after 3002 milliseconds`, `java.net.SocketTimeoutException: Connect timed out`, `ERR_CONNECTION_TIMED_OUT`.

### Possible Causes

- A **firewall or security group dropping** the traffic (most common in cloud).
- Wrong IP address (nothing at that address) or wrong route.
- Host down or unreachable; NAT/VPN path broken.
- Server overloaded so its accept queue drops SYNs.

### Diagnostic Workflow

1. Is the IP right? `nslookup host` — resolving to an old/private IP?
2. Is the host reachable at all? `ping` (if ICMP allowed), `traceroute` — where does it stop?
3. Test the port from **different places**: from the same subnet vs from outside. Works inside but not outside → a firewall between.
4. Check security groups / NACLs / host firewall (`ufw status`, `nft list ruleset`) for the port and source.
5. On the server, `sudo tcpdump -n port 443` — do SYNs arrive? If yes and no SYN-ACK leaves → host firewall or application backlog; if SYNs never arrive → filtered upstream.

### Fix

Allow the port from the right sources; correct the IP/DNS record; fix routes (route tables, NAT gateway); scale or fix an overloaded server.

### Prevention

Infrastructure as code for firewall rules; connectivity tests in deployment pipelines; short client **connect timeouts** so failures surface quickly.

### Interview Explanation

"A timeout means no response at all — usually a firewall silently dropping packets, or the address is wrong or unreachable. Refused, in contrast, proves the host is reachable. I check DNS, test the port from inside and outside the network, and review security groups and host firewalls, using tcpdump to see whether the SYNs arrive."

## Scenario 3: Port Unreachable (UDP)

### Symptoms

DNS queries to a server fail immediately; `nc -uzv host 53` reports failure; traceroute's last hop shows the destination answered with port unreachable.

### Possible Causes

No process listening on that UDP port (DNS server stopped, wrong port), or a firewall rejecting with ICMP.

### Diagnostic Workflow

```bash
# Illustrative: on the server
sudo ss -lunp | grep :53        # anything listening on UDP 53?
```

Remember that UDP has no handshake: with a silent drop the client just waits for its own application timeout.

### Fix

Start the UDP service or correct the port; adjust firewall rules.

### Prevention

Monitoring of UDP services (synthetic DNS queries); alerting.

### Interview Explanation

"For UDP, the equivalent of TCP's refused is an ICMP port unreachable from the host. If even that is blocked, the client only sees an application timeout."

## Scenario 4: One Website Works, Another Does Not

### Symptoms

Most sites load; one site (or one API) fails or hangs — from this network only, or for this user only.

### Possible Causes

DNS problem for that domain (wrong/stale record, cached NXDOMAIN, hosts-file entry); the site itself is down; corporate proxy or firewall blocking the category/domain; TLS problems (expired certificate, untrusted company CA, SNI-based filtering); MTU problems (VPN) affecting large responses; IPv6 broken on the path while the site prefers IPv6; the site blocking your IP/region.

### Diagnostic Workflow

```text
nslookup site               → resolves? to what? same as from another network/resolver?
curl -v https://site        → where does it stop: resolve, connect, TLS, or HTTP status?
curl -4 -v / curl -6 -v     → only one IP version broken?
test from another network (mobile hotspot) → network-specific or site-wide?
downforeveryoneorjustme-style check → site-wide outage?
```

### Fix

Depends on the failing phase: flush/correct DNS; whitelist in the proxy/firewall; fix certificates/trust; fix MTU/VPN; disable broken IPv6 path; contact the site owner.

### Prevention

Monitoring from several networks/regions; automated certificate renewal; MTU/MSS clamping on tunnels.

### Interview Explanation

"Since other sites work, my connection and DNS are basically fine. I use `curl -v` to see which phase fails for that site — DNS, TCP connect, TLS or HTTP — and compare from another network to decide whether it is my network's filtering or the site itself."

## Scenario 5: Firewall Blocking Traffic

### Symptoms

A new service or a new client cannot connect; timeouts (drop) or immediate refusals/unreachable (reject); works from some sources but not others.

### Possible Causes

Missing allow rule (security group, NACL, host firewall, corporate firewall); rule order (a deny above the allow); stateless rules missing return traffic; rules referencing the wrong source range.

### Diagnostic Workflow

1. Test from a source **inside** the same network segment (bypasses perimeter firewalls) and from the failing source.
2. Read every firewall on the path: client egress rules, network firewalls, cloud security groups and NACLs, host firewall on the server.
3. Look for drops in firewall logs / VPC flow logs (`REJECT` entries).
4. Capture on the server (`tcpdump`) to see whether packets arrive.

### Fix

Add the minimal allow rule (source, port, protocol); fix rule order; for stateless ACLs, allow the return ephemeral ports.

### Prevention

Rules in version-controlled infrastructure as code, reviewed; reference security groups instead of IP ranges; document required flows.

### Interview Explanation

"Firewalls cause timeouts when they drop and refusals or unreachable messages when they reject. I locate which firewall blocks by testing from different points and reading flow logs, then add the narrowest rule that allows the needed traffic." See [Firewalls and ACLs](../../network-security/firewalls-and-acls/content.md).

## Scenario 6: Connection Reset

### Symptoms

`Connection reset by peer`, `java.net.SocketException: Connection reset`, intermittent 502s, often after idle periods or under load.

### Possible Causes

Server process crashed or closed the socket abruptly; a load balancer, NAT or firewall dropped an idle connection and answers later packets with RST; keep-alive timeout mismatch between client/LB/server; request too large for a proxy.

### Diagnostic Workflow

Correlate timestamps with server logs (crashes, restarts, OOM), idle durations (does it happen after N minutes idle?), and the idle timeouts of every hop (LB, NAT gateway, database). Packet captures show who sent the RST.

### Fix

Retire pooled connections before middlebox idle timeouts; TCP keepalive; backend keep-alive timeout longer than the LB's; retry idempotent requests; fix crashes.

### Prevention

Consistent timeout configuration across hops; connection validation in pools.

### Interview Explanation

"A reset means someone actively aborted the connection with RST. If it happens after idle periods, a middlebox dropped the connection state; I align idle timeouts and pool lifetimes. If it happens under load or randomly, I look for crashes and proxy limits."

## Key Takeaways

- Refused = RST: reachable host, nothing listening (or reject) → check the service, port, bind address, container localhost.
- Timeout = silence: firewall drop, wrong IP/route, host down → check DNS, security groups, routes, tcpdump.
- UDP: port unreachable is the "refused"; silent drops become app timeouts.
- One site fails: find the failing phase with `curl -v`, compare networks.
- Reset after idle: middlebox timeouts vs pooled connections.
