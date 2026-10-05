# IPv4 Addressing: Structure, Network and Host Portions

**Module:** Network Layer and IP Addressing · **Interview priority:** Core

## What Is It?

An **IPv4 address** is a **32-bit** number that identifies a network interface. It is written in **dotted-decimal** notation: four **octets** (8 bits each, 0–255) separated by dots.

```text
Dotted decimal:   192      .  168      .  1        .  10
Binary:           11000000 .  10101000 .  00000001 .  00001010
Total:            32 bits  →  2³² = 4,294,967,296 possible addresses
```

Every address has two parts:

```text
        192.168.1   .   10
   └─ network part ─┘└ host part ┘     (with a /24 mask)
```

- The **network portion** identifies the network (all hosts on one subnet share it).
- The **host portion** identifies the interface within that network.
- The **subnet mask** or **prefix length** (`/24`) says where the split is — see [Subnet Masks and CIDR](../subnet-masks-and-cidr/content.md).

## Why It Exists

Routers cannot store a route to every one of billions of hosts. Splitting addresses into network + host lets a router keep one entry per network: "everything in `192.168.1.x` → interface 2". This hierarchy is what makes global routing possible — the same idea as postal codes.

## How It Works

### Converting between decimal and binary

Each octet bit has a place value:

```text
bit value:  128  64  32  16   8   4   2   1
```

- **Decimal → binary:** `168` = 128 + 32 + 8 → `10101000`.
- **Binary → decimal:** `11000000` = 128 + 64 = `192`.

Memorise the values that appear in masks: `128, 192, 224, 240, 248, 252, 254, 255` (1 to 8 leading ones).

### Classful addressing (history)

Before 1993, the first bits of the address fixed the network/host split:

| Class | First octet | Leading bits | Default mask | Networks | Hosts per network | Use |
|-------|-------------|--------------|--------------|----------|-------------------|-----|
| A | 1–126 | `0` | `255.0.0.0` (/8) | 126 | 16,777,214 | Very large networks |
| B | 128–191 | `10` | `255.255.0.0` (/16) | 16,384 | 65,534 | Medium networks |
| C | 192–223 | `110` | `255.255.255.0` (/24) | 2,097,152 | 254 | Small networks |
| D | 224–239 | `1110` | — | — | — | Multicast |
| E | 240–255 | `1111` | — | — | — | Experimental / reserved |

`127.x.x.x` is reserved for loopback (so Class A usable networks are 1–126).

**Why classes were abandoned:** they wasted addresses. A company needing 2,000 addresses got a Class B (65,534 hosts) and left 63,000 unused; a Class C (254) was too small. **CIDR** (1993) replaced classes with variable prefix lengths (`/21` gives 2,046 hosts). Classes survive only as vocabulary ("a Class C-sized /24") and in interview questions.

### Host counting

With **h** host bits there are **2ʰ** addresses in the network, of which **2ʰ − 2** can be assigned to hosts: the all-zeros host part is the **network address**, and the all-ones host part is the **broadcast address**.

| Prefix | Host bits | Addresses | Usable hosts |
|--------|-----------|-----------|--------------|
| /8 | 24 | 16,777,216 | 16,777,214 |
| /16 | 16 | 65,536 | 65,534 |
| /24 | 8 | 256 | 254 |
| /30 | 2 | 4 | 2 |

The `/31` (point-to-point links, RFC 3021) and `/32` (a single host route) are special cases.

### Example: dissecting 192.168.1.10/24

```text
IP:         11000000.10101000.00000001.00001010
Mask /24:   11111111.11111111.11111111.00000000
Network:    192.168.1.0       (host bits all 0)
Broadcast:  192.168.1.255     (host bits all 1)
Hosts:      192.168.1.1 – 192.168.1.254   (254 usable)
```

## Real World

- Your laptop shows something like `192.168.1.10` with mask `255.255.255.0` — a `/24` from the home router's DHCP.
- Cloud VPCs are allocated as CIDR blocks such as `10.0.0.0/16`, then split into subnets (`10.0.1.0/24`).
- Because 4.3 billion addresses ran out (IANA's free pool was exhausted in 2011), the Internet relies on [private addresses and NAT](../public-private-and-special-ip-addresses/content.md) and is moving to [IPv6](../ipv6-addressing/content.md).

## Common Traps

- **"256 is a valid octet."** Octets range 0–255.
- **"Class C means private."** No — `192.168.0.0/16` is a private range that happens to fall in the old Class C space; most Class C space is public.
- **"A /24 has 256 hosts."** 256 addresses, 254 usable.
- **Leading zeros:** `192.168.001.010` is ambiguous (some tools read leading zeros as octal); never write them.

## Interview Follow-up

- *"What are the IPv4 classes?"* Give the table, then say CIDR replaced them in 1993.
- *"How many hosts in a /26?"* 2⁶ − 2 = 62.

## Key Takeaways

- IPv4 = 32 bits, four octets 0–255, about 4.3 billion addresses.
- Address = network part + host part; the mask or prefix length marks the split.
- Classes A/B/C/D/E are historical; CIDR uses any prefix length.
- Usable hosts = 2ʰ − 2 (network and broadcast addresses reserved).
