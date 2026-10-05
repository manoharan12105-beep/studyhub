# Troubleshooting Connectivity Problems

**Module:** Troubleshooting · **Interview priority:** Core

## How to Use This Topic

Each scenario follows the same structure: **Symptoms → Possible Causes → Diagnostic Workflow → Fix → Prevention → Interview Explanation**. The workflows apply the [layered method](../network-troubleshooting-methodology/content.md) with the [diagnostic commands](../network-diagnostic-commands/content.md). Connection-level errors (refused, timeout, port unreachable, firewalls) are in [Troubleshooting Connection Errors](../troubleshooting-connection-errors/content.md).

## Scenario 1: Internet Not Working

### Symptoms

No website loads on a laptop; other devices may or may not work.

### Possible Causes

Link down (cable, Wi-Fi), DHCP failure, wrong gateway, DNS failure, router/ISP outage, proxy or VPN misconfiguration.

### Diagnostic Workflow

```text
1. Link?         Wi-Fi connected / cable link light / ip link shows UP
2. IP config?    ipconfig /all — real address (not 169.254.x.x), mask, gateway, DNS
3. Gateway?      ping <gateway>
4. Internet?     ping 1.1.1.1  (by IP — no DNS involved)
5. DNS?          nslookup example.com
6. Web?          curl -v https://example.com
Other devices on the same network working?  → problem is this device; otherwise router/ISP
```

### Fix

Follow the first failing step: reconnect/replace cable; renew DHCP (`ipconfig /renew`); correct gateway/DNS; restart the router or contact the ISP if the gateway works but the Internet does not; remove broken proxy/VPN settings.

### Prevention

Use DHCP rather than manual settings; monitor the uplink; document network settings.

### Interview Explanation

"I would scope it first — one device or everyone — then go bottom-up: link, IP configuration, ping the gateway, ping an Internet IP, test DNS, then the browser. The first step that fails tells me whether it is the device, the LAN, DNS or the ISP."

## Scenario 2: Can Ping an IP but Not a Domain

### Symptoms

`ping 8.8.8.8` works; `ping google.com` → "could not find host" / "Name or service not known"; browsers say "DNS_PROBE_FINISHED_NXDOMAIN" or "server IP address could not be found".

### Possible Causes

Wrong or unreachable DNS server (from DHCP or set manually), DNS server down, firewall blocking UDP/TCP 53, broken VPN DNS, corrupted local cache, a hosts-file entry.

### Diagnostic Workflow

```bash
# Illustrative
nslookup google.com              # uses the configured resolver — fails or times out?
nslookup google.com 1.1.1.1      # a different resolver — works?
ipconfig /all                    # Windows: which DNS servers are configured?
cat /etc/resolv.conf             # Linux
```

If the public resolver works and the configured one does not, the configured resolver (or the path to it) is the problem.

### Fix

Correct the DNS servers (DHCP option 6 / adapter settings), restart the router's DNS service, allow port 53 in the firewall, flush the cache (`ipconfig /flushdns`), remove stale hosts entries.

### Prevention

Configure two resolvers; monitor DNS; avoid hard-coded DNS settings on clients.

### Interview Explanation

"Ping by IP proves layers 1–3 work, so the problem is name resolution. I compare the configured resolver with a public one to confirm, check the DNS settings from DHCP and the hosts file, then fix the resolver configuration." See [DNS Failures](../../dns/dns-caching-ttl-and-failures/content.md).

## Scenario 3: Wrong Default Gateway

### Symptoms

The host reaches printers and servers **in its own subnet** but nothing outside — no Internet, no other subnets.

### Possible Causes

Static configuration typo; DHCP scope with the wrong router option; the gateway is outside the host's subnet; router interface down.

### Diagnostic Workflow

```bash
# Illustrative
ip route                 # "default via 192.168.1.254" — is that really the router?
ping 192.168.1.254       # no reply / "Destination Host Unreachable"
ip neigh                 # gateway entry FAILED/INCOMPLETE → nothing answers ARP for that IP
ping 192.168.1.1         # the real router answers
```

### Fix

Set the correct gateway (fix the DHCP scope's router option for everyone).

### Prevention

Use DHCP; standardise gateway addresses (e.g. always `.1`); validate configuration changes.

### Interview Explanation

"Local traffic does not use the gateway, so it keeps working; everything remote is sent to a gateway that does not exist or does not route. I check `ip route`/`ipconfig`, ping the configured gateway, check ARP for it, and correct it." See [Local vs Remote Delivery](../../arp-and-local-delivery/local-vs-remote-delivery/content.md).

## Scenario 4: Wrong Subnet Mask or Wrong Subnet

### Symptoms

Some destinations work and others do not in a confusing pattern: e.g. the Internet works but one internal subnet does not; or a host can reach the gateway but not certain neighbours.

### Possible Causes

Mask too large (host thinks remote hosts are local and ARPs for them), mask too small (local hosts treated as remote), IP address from another subnet (VLAN mismatch), duplicate IP address.

### Diagnostic Workflow

1. Compare the host's IP/mask with the network's design (`10.10.20.0/24`?).
2. For a failing destination, decide local vs remote **with the host's mask** — does the host ARP for it (`ip neigh` shows `FAILED`) instead of using the gateway?
3. Check the switch port's VLAN matches the subnet the host is configured for.
4. Duplicate IP: Windows warns "IP address conflict"; `arping`/gratuitous ARP replies from another MAC.

### Fix

Correct the mask/IP (preferably via DHCP); move the port to the right VLAN; resolve the duplicate.

### Prevention

DHCP with reservations instead of static addresses; IP address management (IPAM); DHCP snooping and conflict detection.

### Interview Explanation

"The mask decides local vs remote. If it is too large, the host tries to reach remote hosts directly with ARP and fails; if the host is in the wrong VLAN, even the gateway is unreachable. I compare the configuration with the subnet plan and check ARP."

## Scenario 5: High Latency

### Symptoms

Pages and API calls are slow; ping times are high or rise under load; video calls lag.

### Possible Causes

Distance (server far away), congested link (someone saturating the uplink — **bufferbloat**), weak Wi-Fi, an overloaded router/VPN gateway, routing detour, server-side slowness mistaken for network latency.

### Diagnostic Workflow

```text
ping gateway             → high? local problem: Wi-Fi signal/interference, overloaded router
ping 1.1.1.1             → high but gateway fine? uplink/ISP/congestion
traceroute / mtr target  → at which hop does latency jump and stay high?
compare idle vs under load (upload running) → latency grows under load = bufferbloat
curl -w timings          → slow TTFB but fast connect = server, not network
```

### Fix

Use wired Ethernet or better Wi-Fi placement/5 GHz; stop or shape heavy transfers (QoS, smart queue management); choose a closer region/CDN; fix the slow server path.

### Prevention

Monitor latency (p95/p99), place services near users, capacity planning, QoS for real-time traffic.

### Interview Explanation

"I separate network latency from server time with curl timings, then locate the network latency hop by hop with traceroute or mtr: local Wi-Fi, the uplink, or distance."

## Scenario 6: Packet Loss

### Symptoms

`ping` shows loss (e.g. `10% packet loss`); downloads are slow and erratic; calls break up; TCP shows retransmissions.

### Possible Causes

Faulty cable or port (CRC errors), Wi-Fi interference, congested link dropping packets, duplex mismatch, overloaded firewall/NAT, ISP problems.

### Diagnostic Workflow

```text
ping -c 100 gateway       → loss on the LAN? cable/Wi-Fi/switch port
ping -c 100 1.1.1.1       → loss only beyond the gateway? uplink/ISP
mtr target                → loss starting at a hop AND continuing to the end = real loss there
ip -s link / switch counters → RX errors, CRC errors, drops
```

Loss that appears at one middle hop but not at later hops is usually ICMP rate-limiting, not real loss.

### Fix

Replace cables/ports; fix duplex settings; move to wired or a cleaner Wi-Fi channel; relieve congestion; escalate to the ISP with mtr evidence.

### Prevention

Monitor interface error counters; redundancy; capacity headroom.

### Interview Explanation

"Even 1–2 % loss cripples TCP throughput because every loss triggers retransmission and halves the congestion window. I measure loss at each segment (gateway, Internet, target) with ping and mtr, check interface error counters, and fix the faulty segment."

## Key Takeaways

- Internet down: link → IP config → gateway → IP on the Internet → DNS → web.
- Ping IP works but not names → DNS.
- Local works, remote fails → default gateway (or upstream).
- Odd partial reachability → mask, VLAN or duplicate IP.
- Latency and loss: measure per segment (gateway, Internet, target) with ping/mtr; separate server time from network time.
