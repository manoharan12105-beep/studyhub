# TTL, ICMP, ping and traceroute

**Module:** Routing · **Interview priority:** Core

## What Is It?

- **TTL** (Time To Live; IPv6: Hop Limit) is a counter in every IP packet, decreased by 1 at each router. At 0 the packet is discarded.
- **ICMP** (Internet Control Message Protocol) carries **error and diagnostic messages** for IP: "destination unreachable", "time exceeded", "echo request/reply". It is carried inside IP (protocol number 1; ICMPv6 is 58) and has **no ports**.
- `ping` and `traceroute` are built from these two mechanisms.

## Why It Exists

IP is best effort and silent: without help, a sender would never learn why packets disappear. ICMP lets routers and hosts report problems back to the source. TTL protects the network from packets that loop forever when routes are misconfigured — and, as a side effect, lets us discover the path.

## How It Works

### Important ICMP messages

| Type | Name | Sent when | Seen as |
|------|------|-----------|---------|
| 8 / 0 | **Echo Request / Echo Reply** | `ping` asks; the target answers | `Reply from …` / `64 bytes from …` |
| 3 | **Destination Unreachable** | Codes: 0 network, 1 host, **3 port unreachable** (UDP port closed), **4 fragmentation needed**, 13 administratively prohibited (firewall) | `Destination host unreachable`, traceroute `!H`, `!N`, `!X` |
| 11 | **Time Exceeded** | TTL reached 0 in transit (code 0) | traceroute hop lines; `TTL expired in transit` |
| 5 | Redirect | A router tells a host a better next hop exists | Rare |

ICMPv6 also carries **Neighbor Discovery** (it replaces ARP) — so blocking all ICMPv6 breaks IPv6 entirely.

### TTL in action

```text
Host sends TTL 64 → R1 (63) → R2 (62) → R3 (61) → server receives TTL 61
If the routes loop:  R1 → R2 → R1 → R2 … TTL hits 0 → dropped, ICMP Time Exceeded to the source
```

Typical initial values: **64** (Linux, macOS), **128** (Windows), **255** (many routers). From a received TTL you can estimate the hop count and guess the sender's OS.

### ping

Sends ICMP Echo Requests and measures the time until each Echo Reply returns (the **RTT**).

```bash
ping -c 2 1.1.1.1
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

What it tells you: reachability at Layer 3, round-trip time, packet loss, jitter (`mdev`). What it does **not** tell you: whether a TCP port or an application works — ICMP has no ports.

### traceroute / tracert

Discovers each router on the path by deliberately **expiring** packets:

1. Send probes with **TTL = 1**. The first router decrements to 0, drops them and returns ICMP *Time Exceeded* — revealing its address and RTT.
2. Send with **TTL = 2** → the second router reveals itself.
3. Continue until the destination answers (Echo Reply for Windows `tracert`, which uses ICMP probes; ICMP *Port Unreachable* for classic Linux `traceroute`, which uses UDP probes to high ports).

Usually 3 probes per hop → three times per line.

```bash
# Windows (Command Prompt): -d skips reverse DNS, -h limits hops
tracert -d -h 4 1.1.1.1
```

**Output (varies; addresses replaced with documentation ranges):**

```text
Tracing route to 1.1.1.1 over a maximum of 4 hops

  1    17 ms     4 ms     3 ms  192.168.1.1
  2     *        *        *     Request timed out.
  3     *        *        *     Request timed out.
  4    41 ms    29 ms    40 ms  198.51.100.29

Trace complete.
```

Reading it:

- Hop 1 is your default gateway.
- `* * *` means **that router did not send Time Exceeded** (many ISP routers rate-limit or block ICMP) — not necessarily that packets are lost; hop 4 answered, so traffic passes through hops 2 and 3.
- A sudden permanent jump in RTT at one hop and every hop after it suggests congestion or a long-distance link there; a high RTT at a single middle hop only is usually that router being slow to *answer* ICMP.
- If the trace stops at hop N forever, the problem is at or after hop N (or ICMP is blocked from there on).

### Path MTU Discovery

Hosts send packets with the Don't Fragment bit set; a router that cannot forward a large packet returns ICMP *Fragmentation Needed* with its MTU. **Blocking all ICMP breaks this**, causing hangs on large transfers.

## Real World

- Cloud security groups often block ICMP by default, so `ping` fails although HTTPS works — test with `curl` or `nc` instead.
- "Request timed out" vs "Destination host unreachable" on Windows: timed out = no reply at all; unreachable = a router (or your own host, failing ARP) reported it cannot deliver.
- `mtr` (Linux) combines ping and traceroute continuously, showing loss per hop.

## Common Traps

> [!WARNING]
> **Common trap:** "Ping fails, so the server is down." Many servers and firewalls block ICMP. Test the actual service port (`curl -v`, `nc -zv host 443`).

- **"Ping uses TCP or UDP."** It uses ICMP, which has no ports.
- **"Stars in traceroute mean packet loss at that hop."** They mean no ICMP reply from that hop; look at later hops.
- **"Block all ICMP for security."** That breaks Path MTU Discovery and IPv6 neighbour discovery; filter selectively.

## Interview Follow-up

- *"How does traceroute work?"* Increasing TTLs + ICMP Time Exceeded from each hop.
- *"Can you ping a port?"* No; use `nc -zv`, `curl`, `telnet host port` or `Test-NetConnection -Port` on Windows.

## Key Takeaways

- TTL decrements per hop; at 0 the packet is dropped with ICMP Time Exceeded — prevents loops.
- ICMP reports errors and diagnostics; it has no ports.
- `ping` = Echo Request/Reply → reachability, RTT, loss.
- `traceroute` = TTL 1, 2, 3 … → each hop reveals itself via Time Exceeded.
- Blocked ICMP makes ping fail and can break PMTUD — test real ports for services.
