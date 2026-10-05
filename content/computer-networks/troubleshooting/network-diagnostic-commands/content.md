# Network Diagnostic Commands

**Module:** Troubleshooting · **Interview priority:** Core

## What Is It?

The core command-line tools for checking each layer, on Linux and Windows:

| Question | Linux | Windows |
|----------|-------|---------|
| My IP configuration? | `ip addr`, `ip route` (`ifconfig` legacy) | `ipconfig /all` |
| Reachable? RTT? Loss? | `ping` | `ping` |
| Which path? Where does it stop? | `traceroute`, `tracepath`, `mtr` | `tracert`, `pathping` |
| Does the name resolve? | `dig`, `nslookup`, `getent hosts` | `nslookup`, `Resolve-DnsName` |
| Is the port open? | `nc -zv`, `curl` | `Test-NetConnection -Port` |
| Does HTTP(S) work? | `curl -v` | `curl.exe -v` |
| Which sockets/ports are in use? | `ss -tulpn` (`netstat` legacy) | `netstat -ano` |
| IP ↔ MAC cache? | `ip neigh` | `arp -a` |

> [!NOTE]
> Outputs below were captured on a real Windows 11 machine and a WSL Ubuntu instance; public and ISP addresses in them were replaced with documentation ranges. Your values will differ. The Linux side of these tools is covered in depth in the Linux topics [IP and Hostname](../../../linux/networking/ip-and-hostname/content.md), [Connectivity and DNS Tools](../../../linux/networking/connectivity-and-dns-tools/content.md) and [Ports and HTTP Tools](../../../linux/networking/ports-and-http-tools/content.md).

## Why It Exists

Each tool answers one layer's question. Knowing which tool proves what — and what it does **not** prove — turns a guess into a diagnosis.

## Commands

### ipconfig / ip / ifconfig — interface configuration

**Purpose:** show IP address, mask, gateway, DNS servers, DHCP status, MAC.

```bash
# Windows (Command Prompt)
ipconfig /all
ipconfig /release && ipconfig /renew     # get a new DHCP lease
ipconfig /flushdns                       # clear the OS DNS cache
```

```bash
ip -br addr      # Linux: brief view of interfaces and addresses
ip route         # routing table: default gateway
```

**Output (varies):**

```text
lo               UNKNOWN        127.0.0.1/8 10.255.255.254/32 ::1/128
eth0             UP             172.19.220.201/20 fe80::215:5dff:fe90:f144/64
default via 172.19.208.1 dev eth0 proto kernel
172.19.208.0/20 dev eth0 proto kernel scope link src 172.19.220.201
```

**Read it:** `eth0` is UP with `172.19.220.201/20`; the default gateway is `172.19.208.1`; the connected network is `172.19.208.0/20`. Red flags: no IP, `169.254.x.x` (DHCP failed), wrong mask, no default route.

**Common mistake:** `ifconfig` is deprecated on many Linux distributions (net-tools not installed); use `ip`.

### ping — reachability, RTT, loss

```bash
ping -c 2 1.1.1.1        # Linux: -c count
```

**Output (varies):**

```text
PING 1.1.1.1 (1.1.1.1) 56(84) bytes of data.
64 bytes from 1.1.1.1: icmp_seq=1 ttl=55 time=53.3 ms
64 bytes from 1.1.1.1: icmp_seq=2 ttl=55 time=44.0 ms

--- 1.1.1.1 ping statistics ---
2 packets transmitted, 2 received, 0% packet loss, time 1002ms
rtt min/avg/max/mdev = 43.995/48.645/53.296/4.650 ms
```

```bash
# Windows (Command Prompt): -n count (default 4)
ping -n 2 example.com
```

**Output (varies):**

```text
Pinging example.com [2606:4700:83b5:72db:f23b:50c:ef6b:ff98] with 32 bytes of data:
Reply from 2606:4700:83b5:72db:f23b:50c:ef6b:ff98: time=24ms
Reply from 2606:4700:83b5:72db:f23b:50c:ef6b:ff98: time=22ms

Ping statistics for 2606:4700:83b5:72db:f23b:50c:ef6b:ff98:
    Packets: Sent = 2, Received = 2, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 22ms, Maximum = 24ms, Average = 23ms
```

Note that Windows resolved the name and chose **IPv6** first. A name that fails to resolve gives `ping: nosuchhost.invalid: Name or service not known` (Linux) — a DNS problem, not reachability.

**Proves:** Layer 3 path works for ICMP. **Does not prove:** that any TCP port or application works; ICMP may be blocked while services work.

### traceroute / tracert — the path

```bash
# Windows (Command Prompt): -d no reverse DNS, -h max hops, -w timeout ms
tracert -d -h 4 -w 1000 1.1.1.1
```

**Output (varies; addresses replaced):**

```text
Tracing route to 1.1.1.1 over a maximum of 4 hops

  1    17 ms     4 ms     3 ms  192.168.1.1
  2     *        *        *     Request timed out.
  3     *        *        *     Request timed out.
  4    41 ms    29 ms    40 ms  198.51.100.29

Trace complete.
```

**Read it:** hop 1 = your gateway; `*` = no ICMP reply from that hop (common, not necessarily loss) because later hops answer. Linux: `traceroute -n host` (UDP probes; `-I` ICMP, `-T -p 443` TCP); `mtr` combines ping and traceroute continuously. How it works: [TTL and ICMP](../../routing/ttl-and-icmp/content.md).

### nslookup / dig / getent — DNS

```bash
nslookup example.com
```

**Output (varies; resolver address replaced):**

```text
Server:  UnKnown
Address:  192.168.1.1

Non-authoritative answer:
Name:    example.com
Addresses:  2606:4700:83b5:72db:f23b:50c:ef6b:ff98
          172.66.147.243
          104.20.23.154
```

A non-existent name:

```text
*** UnKnown can't find doesnotexist.invalid: Non-existent domain
```

- `nslookup name 1.1.1.1` asks a **specific** resolver — compare to isolate a broken local resolver.
- `nslookup -type=MX example.com` queries other record types.
- `dig example.com +short`, `dig @8.8.8.8 example.com`, `dig +trace example.com` (Linux/macOS; package `dnsutils`/`bind9-dnsutils`).
- `getent hosts example.com` resolves the way applications do (including `/etc/hosts`), unlike `nslookup`/`dig`, which query DNS directly.

### curl — test HTTP(S) end to end

```bash
# Illustrative: needs network access
curl -v https://example.com -o /dev/null
```

**Output (varies; excerpt):**

```text
* Host example.com:443 was resolved.
* IPv6: 2606:4700:83b5:72db:f23b:50c:ef6b:ff98
* IPv4: 172.66.147.243, 104.20.23.154
*   Trying [2606:4700:83b5:72db:f23b:50c:ef6b:ff98]:443...
* Immediate connect fail for 2606:4700:83b5:72db:f23b:50c:ef6b:ff98: Network is unreachable
*   Trying 172.66.147.243:443...
* ALPN: curl offers h2,http/1.1
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
* TLSv1.3 (IN), TLS handshake, Server hello (2):
* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384 / X25519MLKEM768 / id-ecPublicKey
* ALPN: server accepted h2
*   subject: CN=example.com
```

One command shows DNS (resolved addresses), TCP (`Trying …`, IPv6 fallback to IPv4), TLS (version, cipher, certificate), and then the HTTP request (`> GET / HTTP/2`) and response (`< HTTP/2 200`).

Useful options:

| Option | Use |
|--------|-----|
| `-v` | Verbose: connection, TLS, headers |
| `-I` | HEAD request: headers only |
| `-s -o /dev/null -w '%{http_code}\n'` | Print only the status code (scripts, health checks) |
| `-w 'dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer}\n'` | Timing breakdown per phase |
| `--resolve name:443:IP` | Force a name to an IP (test a new server before changing DNS) |
| `--max-time 5`, `--connect-timeout 3` | Do not hang |
| `-k` | Skip certificate checks — diagnosis only, never in code |

Error messages map to layers:

```text
curl: (6) Could not resolve host: api.example.com                    ← DNS
curl: (7) Failed to connect to 127.0.0.1 port 9 after 0 ms: Could not connect to server   ← refused (nothing listening)
curl: (28) Connection timed out after 3002 milliseconds              ← no answer (firewall/drop/host down)
curl: (60) SSL certificate problem: unable to get local issuer certificate   ← TLS trust
```

(The `(7)` and `(28)` lines were captured from real runs.)

### nc / Test-NetConnection — is the TCP port reachable?

```bash
# Illustrative
nc -zv db.internal 5432
```

```text
# Windows (PowerShell)
Test-NetConnection db.internal -Port 5432
```

Success = a TCP handshake completed. **Refused** = the host answered RST (nothing listening, or rejected). **Timeout** = no answer (dropped by a firewall, wrong route, host down).

### ss / netstat — sockets on this machine

```bash
ss -tan | head -5        # Linux: TCP, all states, numeric
```

**Output (varies):**

```text
State     Recv-Q Send-Q  Local Address:Port    Peer Address:Port
LISTEN    0      1000   10.255.255.254:53           0.0.0.0:*
LISTEN    0      4096       127.0.0.54:53           0.0.0.0:*
LISTEN    0      4096    127.0.0.53%lo:53           0.0.0.0:*
TIME-WAIT 0      0      172.19.220.201:33542 23.206.189.171:80
```

- `sudo ss -tulpn` — listening TCP/UDP ports with the owning process: "is my Spring Boot app listening on 8080, and on which address?"
- `ss -tan state established '( dport = :5432 )'` — connections to PostgreSQL.
- Windows: `netstat -ano | findstr :8080` → PID → Task Manager / `tasklist /FI "PID eq 1234"`.

### arp / ip neigh — the neighbour cache

`arp -a` (Windows) or `ip neigh` (Linux): is the gateway's MAC known? `FAILED`/`INCOMPLETE` entries mean ARP gets no answer — wrong gateway IP or a Layer 2 problem. See [ARP](../../arp-and-local-delivery/arp-address-resolution/content.md).

## Comparison: what each tool proves

| Tool | Layer | Proves | Blind to |
|------|-------|--------|----------|
| `ip addr` / `ipconfig` | 1–3 config | Link state, addressing | Whether anything is reachable |
| `ping` | 3 | ICMP reachability, RTT, loss | Ports, applications; blocked ICMP |
| `traceroute` | 3 | Path and where it stops | Return path; hops that hide from ICMP |
| `nslookup` / `dig` | 7 (DNS) | Name resolution via DNS | Hosts-file overrides (use `getent`) |
| `nc -zv` | 4 | TCP port reachability | TLS, application correctness |
| `curl -v` | 4–7 | Full HTTP(S) exchange, timings | — (the end-to-end test) |
| `ss` / `netstat` | 4 (local) | What listens/connects on this host | Remote side |

## Common Mistakes

- Concluding "server down" from a failed ping.
- Using `nslookup` to explain what an application resolves, forgetting the hosts file.
- Using `curl -k` in production code to "fix" certificate errors.
- Forgetting that `localhost` inside a container is the container.

## Key Takeaways

- Config: `ipconfig /all` / `ip addr` + `ip route`. Reachability: `ping`. Path: `traceroute`/`tracert`. DNS: `nslookup`/`dig`/`getent`. Port: `nc -zv`/`Test-NetConnection`. End to end: `curl -v`. Local sockets: `ss`/`netstat`.
- Map error messages to layers: resolve → DNS; refused → nothing listening; timeout → filtered/unreachable; certificate → TLS.
- Know what each tool cannot prove.
