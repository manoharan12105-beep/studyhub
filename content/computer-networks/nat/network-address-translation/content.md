# NAT: Network Address Translation

**Module:** NAT · **Interview priority:** Core

## What Is It?

**NAT** rewrites IP addresses (and usually ports) in packets as they pass through a router, so that devices with **private** addresses can communicate with the Internet using one or a few **public** addresses. Your home router does it for every device in the house.

```text
Laptop 192.168.1.10 ─┐
Phone  192.168.1.11 ─┼─► [ home router: NAT ] ── public 203.0.113.45 ──► Internet
TV     192.168.1.12 ─┘    private side             public side
```

## Why It Exists

- **IPv4 exhaustion:** there are far fewer public IPv4 addresses than devices. NAT lets thousands of devices share one public address; private ranges (`10/8`, `172.16/12`, `192.168/16`) can be reused by everyone.
- **Hiding internal structure:** outsiders see only the public address.
- **Side effect:** inbound connections that nobody inside started have no translation entry and are dropped — a basic (but not designed) protection.

## How It Works

### Types of NAT

| Type | Mapping | Use |
|------|---------|-----|
| **Static NAT** | One private IP ↔ one public IP, permanently | Make an internal server reachable at a fixed public IP |
| **Dynamic NAT** | Private IPs ↔ a **pool** of public IPs, first come first served | Rare today; pool exhaustion when too many hosts |
| **PAT** (Port Address Translation), also *NAT overload*, *NAPT*, *masquerading* | **Many private IP:port ↔ one public IP, different ports** | Every home router; cloud NAT gateways |

### PAT step by step

The laptop opens `https://203.0.113.10` (a server):

```text
1. Laptop sends:        src 192.168.1.10:52100   →  dst 203.0.113.10:443
2. Router translates:   src 203.0.113.45:40001   →  dst 203.0.113.10:443
   and records:         192.168.1.10:52100 ↔ 203.0.113.45:40001 (TCP, to 203.0.113.10:443)
3. Server replies:      src 203.0.113.10:443     →  dst 203.0.113.45:40001
4. Router looks up 40001 in its table and translates back:
                        src 203.0.113.10:443     →  dst 192.168.1.10:52100
```

The NAT translation table:

| Protocol | Inside (private) | Outside (public) | Remote |
|----------|------------------|------------------|--------|
| TCP | 192.168.1.10:52100 | 203.0.113.45:40001 | 203.0.113.10:443 |
| TCP | 192.168.1.11:52100 | 203.0.113.45:40002 | 203.0.113.10:443 |
| UDP | 192.168.1.12:60512 | 203.0.113.45:40003 | 8.8.8.8:53 |

- Two devices may use the **same private port** (52100); the router gives them **different public ports** — that is how one public IP is shared.
- ~64,000 ports per public IP and protocol limit simultaneous mappings to the same remote endpoint; large NATs use several public IPs.
- Entries **expire** after inactivity (TCP: after FIN/RST or minutes to hours idle; UDP: often 30 s–a few minutes). Long-idle connections through NAT can silently die — one reason for TCP/HTTP keep-alives.
- NAT changes IP and TCP/UDP headers, so it must recompute checksums — it works at layers 3 **and** 4.

### Inbound: port forwarding

An unsolicited connection from the Internet to `203.0.113.45:8080` matches no table entry and is dropped. To host a server at home, configure **port forwarding** (a static mapping):

```text
203.0.113.45:8080  →  192.168.1.10:8080   (forward TCP 8080 to the laptop)
```

### Carrier-grade NAT (CGNAT)

Many ISPs, especially mobile, do not give customers a public IP at all: your router gets an address from `100.64.0.0/10`, and the ISP translates again to a shared public IP — **double NAT**. Port forwarding on your router then cannot work.

### NAT traversal (for P2P)

Two peers both behind NAT cannot simply connect to each other. Techniques:

| Technique | Idea |
|-----------|------|
| **STUN** | A public server tells a peer its public IP:port as seen from outside |
| **UDP hole punching** | Both peers send packets to each other's public endpoints at the same time; each NAT creates an entry, letting the other's packets in |
| **TURN** | A relay server forwards traffic when direct connection is impossible (symmetric NAT, strict firewalls) |
| **ICE** | Framework that tries all of the above and picks the best working path (used by WebRTC video calls) |
| UPnP / NAT-PMP | Devices ask the home router to open a port automatically (games, consoles) |

## Advantages and Limitations

| Advantages | Limitations |
|------------|-------------|
| Conserves public IPv4 addresses | Breaks end-to-end connectivity: hosts are not directly reachable |
| Hides internal addressing | Inbound services need port forwarding; impossible behind CGNAT |
| Lets internal addressing stay stable when ISPs change | Complicates P2P, VoIP, games, some VPNs (need traversal) |
| Blocks unsolicited inbound traffic as a side effect | Protocols that carry IPs inside payloads (FTP active mode, SIP) need helpers (ALGs) |
| | Logs show the shared public IP — harder to trace and to rate-limit per user |
| | Per-connection state on the router; table limits; idle timeouts |

> [!IMPORTANT]
> NAT is **not a firewall**. It blocks unsolicited inbound traffic only as a side effect. Security needs a real stateful firewall — which is exactly what IPv6 networks use, since IPv6 has enough addresses to make NAT unnecessary.

## Real World

- **Cloud:** instances in a **private subnet** reach the Internet (package downloads, external APIs) through a **NAT gateway**; the external API sees the NAT gateway's public IP — which is what you give partners to allowlist.
- **Docker:** containers on the default bridge network (`172.17.0.0/16`) reach the outside through masquerading on the host, and `-p 8080:8080` is port forwarding (DNAT) into the container.
- **Kubernetes:** Services and node ports rely on NAT rules (iptables/IPVS) to send traffic to pods.

## Common Traps

- **"NAT makes my network secure."** It hides and blocks unsolicited inbound connections, but it is not a firewall policy, does nothing against outbound malware, and can be traversed.
- **"Each device keeps its own public IP."** With PAT all devices share one public IP, distinguished by port.
- **"Port forwarding opens a port on my laptop."** It creates a mapping on the router; the laptop must still listen and its firewall must allow it.

## Interview Follow-up

- *"How do multiple devices share one public IP?"* PAT: different public source ports per connection, tracked in the translation table.
- *"Why can't I host a server at home on mobile data?"* CGNAT — you have no public IP to forward from.

## Key Takeaways

- NAT translates private ↔ public addresses at the network edge; PAT also translates ports so many devices share one IP.
- Static NAT = fixed 1:1; dynamic NAT = pool; PAT = many-to-one by port (home routers, cloud NAT gateways).
- Inbound needs port forwarding (static mapping); CGNAT adds a second NAT at the ISP.
- P2P across NAT uses STUN, hole punching, TURN, ICE. NAT is not a firewall.
