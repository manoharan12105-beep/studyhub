# ARP: Address Resolution Protocol

**Module:** ARP and Local Delivery · **Interview priority:** Core

## What Is It?

**ARP** finds the **MAC address** that belongs to an **IPv4 address on the local network**. It works by asking everyone on the LAN ("Who has 192.168.1.20? Tell 192.168.1.10") and letting the owner answer. Results are kept in an **ARP cache**.

ARP is defined in RFC 826. It is carried directly inside Ethernet frames (EtherType `0x0806`), not inside IP — which is why it is placed between Layer 2 and Layer 3. IPv6 does not use ARP; it uses **Neighbor Discovery (NDP)** over ICMPv6.

## Why It Exists

A host knows the **IP** of the next hop — from DNS plus its routing decision — but Ethernet delivers frames by **MAC**. Without ARP, nobody would know which MAC to put in the frame. ARP is the bridge between the two layers.

## How It Works

### Step by step: A (192.168.1.10) wants to send to B (192.168.1.20), same subnet

1. **Decide the next hop.** B is in A's subnet, so the next hop is B itself.
2. **Check the ARP cache.** Is there an entry for `192.168.1.20`? If yes, use it and skip to step 6.
3. **Cache miss → ARP request (broadcast).**

```text
Ethernet: dst ff:ff:ff:ff:ff:ff   src AA:AA:AA:AA:AA:AA   type 0x0806
ARP:      opcode 1 (request)
          sender MAC AA:AA:AA:AA:AA:AA   sender IP 192.168.1.10
          target MAC 00:00:00:00:00:00   target IP 192.168.1.20
          "Who has 192.168.1.20? Tell 192.168.1.10"
```

   The switch floods it to every port in the VLAN. Every host receives it; those whose IP is not `192.168.1.20` ignore it.

4. **ARP reply (unicast).** B recognises its IP. It also **caches A's mapping** from the request (A will soon be talking to it). It replies directly to A:

```text
Ethernet: dst AA:AA:AA:AA:AA:AA   src BB:BB:BB:BB:BB:BB   type 0x0806
ARP:      opcode 2 (reply)  "192.168.1.20 is at BB:BB:BB:BB:BB:BB"
```

5. **Cache it.** A stores `192.168.1.20 → BB:BB:BB:BB:BB:BB`. (The switch also learned both MACs' ports along the way.)
6. **Send the data frame** with destination MAC `BB:BB:BB:BB:BB:BB`. Packets that arrived while waiting for ARP are queued and sent now.

### Remote destination: ARP for the gateway, not the server

If A sends to `203.0.113.10` (another network), it does **not** ARP for `203.0.113.10` — nobody on the LAN would answer. It ARPs for its **default gateway** (`192.168.1.1`) and sends the frame to the gateway's MAC. See [Local vs Remote Delivery](../local-vs-remote-delivery/content.md).

### The ARP cache

```bash
# Illustrative: Linux neighbour table
ip neigh
```

**Output (varies):**

```text
192.168.1.1 dev wlan0 lladdr a4:91:b1:00:00:01 REACHABLE
192.168.1.20 dev wlan0 lladdr 3c:22:fb:9a:10:4e STALE
```

```bash
# Windows (Command Prompt)
arp -a
```

- Entries **expire** (Linux keeps them `REACHABLE` for tens of seconds, then `STALE` and re-verifies before reuse; Windows ages them out within minutes). This lets the cache follow devices that change NIC or IP.
- `ip neigh flush all` / `arp -d *` clears it — a quick fix after replacing a device that kept its IP.

### Gratuitous ARP

An ARP message announcing **your own** mapping without anyone asking (target IP = sender IP). Used to:

- **Detect duplicate IPs** when an interface comes up: if anyone answers, the address is already in use.
- **Update everyone's caches** after a change — e.g. when a standby server takes over a floating/virtual IP in a failover (keepalived/VRRP) so that traffic moves to the new MAC immediately.

### Proxy ARP

A router answers ARP requests on behalf of hosts on another network, so hosts can reach them without knowing about the router. Mostly legacy; can mask misconfigured subnet masks.

## Real World

- First request to a new LAN host is slightly slower: ARP must resolve first.
- **ARP spoofing / poisoning:** ARP has **no authentication**; an attacker can send fake replies ("192.168.1.1 is at *my* MAC"), becoming a man-in-the-middle for the whole LAN. Defences: Dynamic ARP Inspection on switches, static entries for critical hosts, and — most importantly — encryption (TLS/HTTPS), so intercepted traffic is useless. See [Common Network Attacks](../../network-security/common-network-attacks/content.md).

## Comparison: ARP vs DNS

| | ARP | DNS |
|---|-----|-----|
| Translates | IP → MAC | Name → IP |
| Scope | Local network only | Global |
| Transport | Ethernet broadcast/unicast | UDP/TCP port 53 |
| Layer | Between 2 and 3 | Application |
| Asked | Everyone on the LAN | A specific resolver |

Both are "address resolution" — at different layers, and both are needed for a typical request: DNS first (name → IP), then ARP (gateway IP → MAC).

## Common Traps

- **"ARP finds the MAC of the remote server."** Only of hosts on the **same link** — for remote destinations, the gateway's MAC.
- **"ARP replies are broadcast."** The request is broadcast; the reply is normally **unicast** to the asker.
- **"IPv6 uses ARP."** It uses NDP (Neighbor Solicitation/Advertisement over ICMPv6 multicast).

## Interview Follow-up

- *"What happens if the ARP request gets no reply?"* The host retries a few times, then reports the destination as unreachable (`ping` shows "Destination Host Unreachable" from your own IP).
- *"Why does the receiver also cache the sender's mapping?"* It will almost certainly reply, and the request already contained the sender's IP and MAC — saving a second ARP exchange.

## Key Takeaways

- ARP maps IPv4 → MAC on the local link: broadcast request, unicast reply, cached with expiry.
- For remote destinations, ARP resolves the default gateway's MAC.
- Gratuitous ARP announces your own mapping (duplicate detection, failover).
- ARP is unauthenticated → ARP spoofing; TLS protects data even if spoofed.
