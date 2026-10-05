# Connectivity and DNS: ping, traceroute, dig and nslookup

**Module:** Networking Basics · **Interview priority:** Core

## What Is It?

The tools for "can this machine reach that one, and does the name resolve?":

| Tool | Diagnoses |
|------|-----------|
| `ping` | Is the host reachable? How long does a round trip take? Is there packet loss? |
| `traceroute` / `tracepath` / `mtr` | Which routers (hops) does traffic pass through, and where does it stop or slow down? |
| `dig` | Full DNS answers: records, TTLs, which server answered, error status |
| `nslookup` | Simple DNS lookups (also available on Windows) |
| `host` | Very short DNS lookups |
| `getent hosts` | Resolution exactly as applications do it (`/etc/hosts` + DNS) |

`dig`, `nslookup` and `host` come in the `dnsutils` / `bind9-dnsutils` package; `traceroute` is its own package. Minimal servers and containers often lack them (`sudo apt install dnsutils traceroute`).

## Why It Matters

- "The application cannot reach the database / API" is one of the most common incidents. These tools separate **DNS problems** from **network problems** from **application problems**.
- `ping` succeeding while the application fails points at ports, firewalls or the application — not basic connectivity.
- Interview questions: "how do you check if a host is reachable?", "ping works but the website does not — why?", "how do you troubleshoot DNS?", "what does traceroute show?".

## Core Concept

### A layered way to think

```text
1. Name → IP      Does the name resolve?            getent hosts / dig / nslookup
2. IP reachable   Do packets get there and back?    ping, traceroute
3. Port open      Is a service listening/allowed?   nc -zv, curl, ss (next topic)
4. Application    Does it answer correctly?         curl -v, logs
```

Fix the lowest broken layer first. If a name does not resolve, nothing above it will work.

### How ping works

`ping` sends ICMP **echo request** packets and waits for **echo replies**. It reports each reply's round-trip time and, at the end, packet loss and min/avg/max timing.

- **No reply** does not always mean the host is down: many firewalls and cloud security groups drop ICMP while allowing TCP services.
- **TTL** in replies is the remaining hop limit — a hint of distance (and of the remote OS's starting value: 64 on Linux, 128 on Windows).

### How traceroute works

traceroute sends probes with an increasing **TTL** (time to live) — 1, 2, 3, … Each router decrements the TTL; when it reaches 0, that router replies "time exceeded", revealing itself. The result is the list of hops.

- `*` means no reply for that probe. Many routers do not answer traceroute probes, so stars in the middle are normal if later hops answer; stars from some point onward to the end suggest traffic is blocked or lost there.
- A sudden jump in latency at one hop that persists for all later hops locates the slow link.

### DNS records you will meet

| Record | Maps | Example |
|--------|------|---------|
| `A` | Name → IPv4 address | `example.com → 104.20.23.154` |
| `AAAA` | Name → IPv6 address | |
| `CNAME` | Name → another name (alias) | `www.example.com → example.com` |
| `MX` | Domain → mail servers | |
| `TXT` | Text (verification, SPF) | |
| `NS` | Domain → its authoritative name servers | |
| `PTR` | IP → name (reverse DNS) | `8.8.8.8 → dns.google` |

**TTL** (time to live) is how many seconds resolvers may cache an answer — why DNS changes take time to "propagate".

## Commands

The outputs below are from one machine and network; addresses, times and hops will differ for you.

### ping

```bash
# Illustrative: needs network access
ping -c 3 127.0.0.1
```

**Output (varies):**

```text
PING 127.0.0.1 (127.0.0.1) 56(84) bytes of data.
64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.032 ms
64 bytes from 127.0.0.1: icmp_seq=2 ttl=64 time=0.182 ms
64 bytes from 127.0.0.1: icmp_seq=3 ttl=64 time=0.068 ms

--- 127.0.0.1 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2028ms
rtt min/avg/max/mdev = 0.032/0.094/0.182/0.063 ms
```

```bash
# Illustrative: needs network access
ping -c 2 example.com
```

**Output (varies):**

```text
PING example.com (172.66.147.243) 56(84) bytes of data.
64 bytes from 172.66.147.243: icmp_seq=1 ttl=52 time=81.7 ms
64 bytes from 172.66.147.243: icmp_seq=2 ttl=52 time=85.5 ms

--- example.com ping statistics ---
2 packets transmitted, 2 received, 0% packet loss, time 1002ms
rtt min/avg/max/mdev = 81.688/83.612/85.537/1.924 ms
```

The first line shows the name was resolved (to `172.66.147.243`) — so DNS works too.

| Option | Meaning |
|--------|---------|
| `-c N` | Send N packets and stop (Linux ping runs forever by default; `Ctrl+C` stops it) |
| `-i 0.2` | Interval between packets |
| `-W 2` | Wait at most 2 s for each reply |
| `-4` / `-6` | Force IPv4 / IPv6 |
| `-s 1400` | Packet size (test MTU problems) |

Error messages tell you the layer:

| Message | Meaning |
|---------|---------|
| `Name or service not known` | DNS failed — the name did not resolve |
| `Network is unreachable` | No route (no default gateway) |
| `Destination Host Unreachable` | Local network: nobody answered ARP for that address |
| No output, then 100 % packet loss | Packets lost or ICMP blocked by a firewall |

```bash
# Illustrative
ping -c 1 nosuchhost.invalid
# ping: nosuchhost.invalid: Name or service not known
```

### traceroute and alternatives

```bash
# Illustrative: needs the traceroute package and network access
traceroute -n -m 8 -q 1 8.8.8.8
```

**Output (varies):**

```text
traceroute to 8.8.8.8 (8.8.8.8), 8 hops max, 60 byte packets
 1  172.19.208.1  0.721 ms
 2  10.205.13.59  14.423 ms
 3  *
 4  *
 5  *
 6  *
 7  *
 8  *
```

Hop 1 is the local gateway, hop 2 the next router; after that, routers on this path do not answer UDP probes. `-n` skips reverse DNS for speed, `-m` sets the maximum hops, `-q` probes per hop. Try `-T -p 443` (TCP probes, needs root) or `-I` (ICMP) when UDP probes are filtered. `tracepath` needs no root; `mtr` combines ping and traceroute into a continuously updating table.

### dig

```bash
# Illustrative: needs the dnsutils package and network access
dig example.com
```

**Output (varies):**

```text
; <<>> DiG 9.20.24-1ubuntu0.3-Ubuntu <<>> example.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 62890
;; flags: qr rd ra ad; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 0

;; QUESTION SECTION:
;example.com.			IN	A

;; ANSWER SECTION:
example.com.		111	IN	A	172.66.147.243
example.com.		111	IN	A	104.20.23.154

;; Query time: 19 msec
;; SERVER: 10.255.255.254#53(10.255.255.254) (UDP)
;; WHEN: Thu Jan 15 09:30:40 UTC 2026
;; MSG SIZE  rcvd: 61
```

| Part | Meaning |
|------|---------|
| `status: NOERROR` | Lookup succeeded. `NXDOMAIN` = name does not exist; `SERVFAIL` = the resolver could not get an answer |
| `ANSWER SECTION` | The records: name, TTL (111 s left in cache), class, type, value |
| `SERVER` | Which DNS server answered |
| `Query time` | How long the lookup took |

Useful forms:

```bash
# Illustrative
dig +short example.com              # just the addresses
dig +short example.com MX           # a specific record type
dig +short @8.8.8.8 example.com     # ask a specific server (bypass the local resolver)
dig +short -x 8.8.8.8               # reverse lookup (PTR): dns.google.
dig +trace example.com              # follow the delegation from the root servers
```

Comparing the answer of your configured resolver with `@8.8.8.8` quickly shows whether a problem is local (stale cache, internal DNS) or global.

### nslookup and host

```bash
# Illustrative
nslookup example.com
```

**Output (varies):**

```text
Server:		10.255.255.254
Address:	10.255.255.254#53

Non-authoritative answer:
Name:	example.com
Address: 104.20.23.154
Name:	example.com
Address: 172.66.147.243
Name:	example.com
Address: 2606:4700:9c65:72db:f2fd:43e:ef6b:ff98
```

"Non-authoritative" means the answer came from a caching resolver, not the domain's own name server.

```bash
# Illustrative
host example.com
```

**Output (varies):**

```text
example.com has address 172.66.147.243
example.com has address 104.20.23.154
example.com has IPv6 address 2606:4700:9c65:72db:f2fd:43e:ef6b:ff98
example.com mail is handled by 0 .
```

### getent: what applications see

`dig` and `nslookup` query DNS servers directly and ignore `/etc/hosts`. Applications use the system resolver. `getent` uses the same path:

```bash
getent hosts localhost
```

**Output (varies):**

```text
::1             localhost
```

If `dig` works but `getent hosts` (and your application) fails — or the other way round — look at `/etc/hosts`, `/etc/nsswitch.conf` and `/etc/resolv.conf`.

## Examples

### "Cannot connect to db.internal"

```bash
# Illustrative
getent hosts db.internal         # 1. does it resolve for applications?
dig +short db.internal           # 2. what does DNS say?
ping -c 3 10.0.0.20              # 3. is the IP reachable? (may be blocked by firewall)
nc -zv 10.0.0.20 5432            # 4. is the PostgreSQL port open? (next topic)
```

### "The website works for me but not for a customer after a DNS change"

```bash
# Illustrative
dig +short shop.example.com                # what our resolver returns
dig +short @8.8.8.8 shop.example.com       # what a public resolver returns
dig shop.example.com | grep -A2 'ANSWER'   # check the TTL: old answers may be cached until it expires
```

## Comparison

### dig vs nslookup vs host vs getent

| | `dig` | `nslookup` | `host` | `getent hosts` |
|---|---|---|---|---|
| Detail | Full (flags, TTL, sections, server) | Medium | Minimal | Minimal |
| Uses `/etc/hosts` | No | No | No | **Yes** |
| Best for | DNS troubleshooting, scripts (`+short`) | Quick checks, also on Windows | Quick checks | "What will my app get?" |

### ping vs traceroute

| | `ping` | `traceroute` |
|---|---|---|
| Answers | Is it reachable? Latency? Loss? | Which path? Where does it stop or slow down? |
| Protocol (default) | ICMP echo | UDP probes (ICMP or TCP with options) |
| Blocked by firewalls | Often | Often (stars) |

## Common Mistakes

- Concluding a server is down because `ping` fails — ICMP is often blocked; test the actual port.
- Concluding the network is fine because `ping` works — the service port can still be closed or firewalled.
- Using `dig` to debug an application and missing an `/etc/hosts` override — use `getent hosts`.
- Reading `*` hops in traceroute as failures when later hops respond.
- Forgetting `-c` and leaving `ping` running forever in a script.
- Expecting DNS changes to apply instantly despite a long TTL.

## Key Takeaways

- Troubleshoot bottom-up: name resolution → IP reachability → port → application.
- `ping -c N host`: reachability, latency, loss; failure may just mean ICMP is filtered.
- `traceroute -n host`: hop-by-hop path; `*` = no reply from that hop.
- `dig name` (status, answer, TTL, server), `dig +short`, `dig @server`, `dig -x IP`; `nslookup` and `host` for quick checks.
- `getent hosts` shows what applications resolve, including `/etc/hosts`.
