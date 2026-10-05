# Subnet Masks and CIDR

**Module:** Network Layer and IP Addressing · **Interview priority:** Core

## What Is It?

A **subnet mask** is a 32-bit pattern of **1s followed by 0s** that marks which bits of an IPv4 address are the **network part** (1s) and which are the **host part** (0s). **CIDR notation** writes the same thing as a **prefix length**: the number of 1 bits.

```text
255.255.255.0   =  11111111.11111111.11111111.00000000   =  /24
255.255.255.192 =  11111111.11111111.11111111.11000000   =  /26
```

**CIDR** (Classless Inter-Domain Routing, 1993) means any prefix length from `/0` to `/32` is allowed — no more fixed classes.

## Why It Exists

The mask lets every device answer two questions from an address alone:

1. **Which network is this address in?** (For hosts: local or remote? For routers: which route matches?)
2. **Which addresses belong to this network?** (Network address, broadcast address, usable host range.)

CIDR also lets networks be sized to fit (a `/27` for 30 hosts) and lets routers **aggregate** many networks into one route.

## How It Works

### Mask ↔ prefix

| Prefix | Mask | Last non-255 octet bits | Addresses | Usable hosts |
|--------|------|-------------------------|-----------|--------------|
| /8 | 255.0.0.0 | — | 16,777,216 | 16,777,214 |
| /16 | 255.255.0.0 | — | 65,536 | 65,534 |
| /20 | 255.255.240.0 | `11110000` | 4,096 | 4,094 |
| /22 | 255.255.252.0 | `11111100` | 1,024 | 1,022 |
| /24 | 255.255.255.0 | — | 256 | 254 |
| /25 | 255.255.255.128 | `10000000` | 128 | 126 |
| /26 | 255.255.255.192 | `11000000` | 64 | 62 |
| /27 | 255.255.255.224 | `11100000` | 32 | 30 |
| /28 | 255.255.255.240 | `11110000` | 16 | 14 |
| /29 | 255.255.255.248 | `11111000` | 8 | 6 |
| /30 | 255.255.255.252 | `11111100` | 4 | 2 |
| /32 | 255.255.255.255 | — | 1 | single host |

A valid mask has **contiguous** 1s: `255.255.255.0` is valid; `255.255.0.255` is not.

### Finding the network address: bitwise AND

**Network address = IP AND mask** (bit by bit: 1 AND 1 = 1, otherwise 0).

Example: `192.168.10.77/26`

```text
IP     192.168.10.77    → last octet 01001101
Mask   255.255.255.192  → last octet 11000000
AND                       last octet 01000000 = 64
Network address:   192.168.10.64
Broadcast address: host bits all 1 → 01111111 = 127 → 192.168.10.127
Usable hosts:      192.168.10.65 – 192.168.10.126  (62 hosts)
```

### The four answers for any address

| Answer | Rule |
|--------|------|
| **Network address** | Host bits all 0 (IP AND mask) |
| **Broadcast address** | Host bits all 1 |
| **First usable host** | Network address + 1 |
| **Last usable host** | Broadcast address − 1 |
| **Usable hosts** | 2ʰ − 2, where h = 32 − prefix |

The fast way to do this without binary — the **block-size method** — is in [Subnetting: The Block-Size Method](../../subnetting/subnetting-block-size-method/content.md).

### Prefix length and the routing table

Routers store routes as prefixes (`10.0.0.0/8`, `10.1.0.0/16`, `0.0.0.0/0`). A destination matches a route when its first *prefix* bits equal the route's. When several match, the **longest prefix** (most specific) wins — see [Longest Prefix Match](../../routing/longest-prefix-match/content.md).

### Default gateway and the mask together

A host's configuration always has three related values: **IP + mask + default gateway**. The gateway must be inside the network defined by IP and mask. Example: `10.0.1.25/24` → valid gateways are `10.0.1.1`–`10.0.1.254`.

### Wildcard masks (awareness)

ACLs on routers and OSPF configuration use the **inverse** of the mask: `/24` → wildcard `0.0.0.255`. Wildcard = `255.255.255.255 − mask`.

## Real World

- Cloud VPC: `10.0.0.0/16` for the VPC, `/24` subnets per availability zone; AWS reserves 5 addresses per subnet, so a `/24` gives 251 usable.
- Kubernetes pod CIDR (`10.244.0.0/16`) and service CIDR are just prefixes; overlapping them with your company network causes routing conflicts.
- Security group rule `0.0.0.0/0` = "any IPv4 address"; `203.0.113.7/32` = exactly one address.

## Common Traps

- **"/24 means 24 hosts."** It means 24 **network** bits; 8 host bits → 254 hosts.
- **"Larger prefix = larger network."** The opposite: `/30` is tiny, `/8` is huge.
- **Network vs broadcast:** the network address is *not* the first host; the broadcast is *not* the last host.
- **Mask in the wrong place:** the network/host split for `/26` is inside the 4th octet, so only that octet changes.

## Interview Follow-up

- *"What does the subnet mask do?"* Separates network and host bits so devices can tell local from remote and routers can match routes.
- *"How many hosts does a /27 support?"* 30.

## Key Takeaways

- Mask = contiguous 1s (network) then 0s (host); `/n` = number of 1s.
- Network = IP AND mask; broadcast = host bits all 1; hosts in between; usable = 2ʰ − 2.
- Bigger prefix number → smaller network.
- Routers match prefixes; the longest match wins.
