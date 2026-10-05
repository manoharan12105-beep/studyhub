# IPv6 Addressing and IPv4 vs IPv6

**Module:** Network Layer and IP Addressing · **Interview priority:** Frequently asked

## What Is It?

**IPv6** is the successor to IPv4, with **128-bit** addresses — about 3.4 × 10³⁸ of them. Addresses are written as eight groups of four hexadecimal digits separated by colons:

```text
2001:0db8:0000:0000:0000:ff00:0042:8329
```

## Why It Exists

IPv4's 4.3 billion addresses ran out (IANA's last blocks were allocated in 2011). NAT stretched IPv4 but broke end-to-end connectivity and added complexity. IPv6 gives every device a globally unique address again, and cleans up the protocol: no broadcast, simpler header, built-in autoconfiguration.

## How It Works

### Shortening rules

1. **Drop leading zeros** in any group: `0db8` → `db8`, `0042` → `42`, `0000` → `0`.
2. **Replace one run** of consecutive all-zero groups with `::` — **only once** per address (otherwise its length is ambiguous).

```text
Full:        2001:0db8:0000:0000:0000:ff00:0042:8329
Rule 1:      2001:db8:0:0:0:ff00:42:8329
Rule 2:      2001:db8::ff00:42:8329

Loopback:    0000:…:0001  → ::1
Unspecified: all zeros    → ::
```

To expand `::`, fill in as many zero groups as needed to make 8 groups.

### Structure: prefix + interface ID

Like IPv4, an IPv6 address has a network **prefix** and a host part (**interface identifier**). The standard subnet is a **/64**:

```text
2001:db8:abcd:0012 : 0000:0000:0000:0001
└──── 64-bit prefix ───┘ └── 64-bit interface ID ──┘
 (48-bit site prefix from the ISP + 16-bit subnet ID)
```

- A typical organisation (or even a home) gets a **/48** or **/56** from its ISP and creates /64 subnets from it — a /48 holds 65,536 /64 subnets.
- Each /64 subnet holds 2⁶⁴ addresses. Subnetting IPv6 is about organising, not conserving.

### Address types

| Type | Prefix | Meaning | IPv4 analogue |
|------|--------|---------|---------------|
| **Global unicast** | `2000::/3` | Public, routable on the Internet | Public address |
| **Unique local (ULA)** | `fc00::/7` (used: `fd00::/8`) | Private, not routed on the Internet | RFC 1918 private |
| **Link-local** | `fe80::/10` | Valid only on one link; **every interface always has one**; used by NDP and routers | `169.254.0.0/16` |
| **Loopback** | `::1/128` | This host | `127.0.0.1` |
| **Unspecified** | `::/128` | No address yet | `0.0.0.0` |
| **Multicast** | `ff00::/8` | One-to-group (`ff02::1` = all nodes on the link) | `224.0.0.0/4` |
| **Anycast** | (from unicast space) | One-to-nearest | Anycast |
| **Documentation** | `2001:db8::/32` | Examples only | `192.0.2.0/24` etc. |

There is **no broadcast** in IPv6; multicast replaces it.

### How a host gets an address

- **SLAAC** (Stateless Address Autoconfiguration): the router advertises the /64 prefix (Router Advertisement); the host builds its own interface ID (random, for privacy) and checks it is unique (Duplicate Address Detection).
- **DHCPv6**: a server assigns addresses (stateful), or just provides extra options such as DNS servers.
- **Static** configuration for servers.

A host normally has **several** IPv6 addresses at once: a link-local, one or more global ones (stable and temporary/privacy), sometimes a ULA.

### NDP replaces ARP

**Neighbor Discovery Protocol** (over ICMPv6) finds neighbours' MAC addresses (Neighbor Solicitation / Advertisement, sent to a solicited-node **multicast** address rather than broadcast), discovers routers, and detects duplicate addresses.

### Using IPv6 addresses in URLs

Wrap them in brackets, because colons also separate the port: `http://[2001:db8::10]:8080/health`.

## IPv4 vs IPv6

| | IPv4 | IPv6 |
|---|------|------|
| Address size | 32 bits | 128 bits |
| Notation | Dotted decimal `192.0.2.1` | Hex groups with colons `2001:db8::1` |
| Address count | ≈ 4.3 × 10⁹ | ≈ 3.4 × 10³⁸ |
| Header | 20–60 bytes, variable, with checksum | 40 bytes fixed, no checksum, extension headers |
| Broadcast | Yes | No — multicast instead |
| MAC resolution | ARP | NDP (ICMPv6) |
| Autoconfiguration | DHCP (or APIPA) | SLAAC and/or DHCPv6 |
| Fragmentation | Routers and senders | Sender only |
| NAT | Widely needed | Not needed (enough addresses); firewalls still used |
| TTL field | TTL | Hop Limit |
| IPsec | Optional add-on | Designed in (support originally mandatory; use optional) |
| Loopback | `127.0.0.1` | `::1` |

### Transition: running both

The two protocols are **not compatible** on the wire — an IPv4-only host cannot talk directly to an IPv6-only host. The Internet uses:

- **Dual stack:** devices run IPv4 and IPv6 together (most common). DNS returns both `A` and `AAAA` records and clients prefer IPv6 while falling back quickly to IPv4 ("Happy Eyeballs").
- **Tunnelling:** IPv6 packets inside IPv4 (or vice versa) across networks that support only one.
- **Translation (NAT64/DNS64):** IPv6-only clients reach IPv4-only servers through a translator — common on mobile networks.

## Real World

The `curl -v https://example.com` capture below shows dual stack in action: curl received both IPv6 and IPv4 addresses, tried IPv6 first, found no IPv6 route on this machine, and fell back to IPv4.

```text
* IPv6: 2606:4700:83b5:72db:f23b:50c:ef6b:ff98
* IPv4: 172.66.147.243, 104.20.23.154
*   Trying [2606:4700:83b5:72db:f23b:50c:ef6b:ff98]:443...
* Immediate connect fail for 2606:4700:83b5:72db:f23b:50c:ef6b:ff98: Network is unreachable
*   Trying 172.66.147.243:443...
```

## Common Traps

- **Using `::` twice** (`2001::1::5`) — invalid.
- **"IPv6 has broadcast."** It does not.
- **"IPv6 means no firewall is needed because there is no NAT."** NAT was never a firewall; IPv6 hosts need stateful firewalls that block unsolicited inbound traffic.
- **"IPv6 and IPv4 are interoperable."** They need dual stack, tunnels or translation.

## Interview Follow-up

- *"Compress `fe80:0000:0000:0000:0202:b3ff:fe1e:8329`."* `fe80::202:b3ff:fe1e:8329`.
- *"Why is a /64 the standard IPv6 subnet?"* SLAAC builds a 64-bit interface ID, so subnets must leave 64 host bits.

## Key Takeaways

- IPv6: 128-bit addresses, hex groups, drop leading zeros, `::` once.
- Standard subnet /64; sites get /48 or /56.
- Types: global (`2000::/3`), ULA (`fd00::/8`), link-local (`fe80::/10`), loopback `::1`, multicast `ff00::/8`. No broadcast.
- NDP replaces ARP; SLAAC/DHCPv6 replace DHCP.
- IPv4 ↔ IPv6 need dual stack, tunnelling or translation.
