# Subnetting Fundamentals

**Module:** Subnetting · **Interview priority:** Core

## What Is It?

**Subnetting** divides one IP network into several smaller networks (**subnets**) by **borrowing bits from the host part** and using them as extra network bits.

```text
Before:  192.168.1.0/24    network bits: 24 │ host bits: 8   → 1 network × 254 hosts
Borrow 2 host bits:
After:   192.168.1.0/26    network bits: 26 │ host bits: 6   → 4 subnets × 62 hosts
         192.168.1.0/26, 192.168.1.64/26, 192.168.1.128/26, 192.168.1.192/26
```

## Why It Exists

| Reason | Example |
|--------|---------|
| **Smaller broadcast domains** | 4 × 62 hosts instead of 1 × 254: each ARP/DHCP broadcast bothers fewer hosts |
| **Security and control** | Put Finance, Engineering and Guests in separate subnets; filter traffic between them at the router/firewall |
| **Efficient address use** | Give a point-to-point link a /30 (2 hosts), not a /24 (254) |
| **Organisation and routing** | Subnets per site/floor/availability zone; summarise them in one route upstream |
| **Matching the cloud** | A VPC `10.0.0.0/16` is split into public and private subnets per zone |

## How It Works

### The two formulas

When you borrow **s** bits from the host part and leave **h** host bits:

```text
Number of subnets          = 2ˢ
Addresses per subnet       = 2ʰ
Usable hosts per subnet    = 2ʰ − 2      (network + broadcast addresses reserved)
New prefix                 = old prefix + s
h                          = 32 − new prefix
```

Powers of two to know by heart:

| n | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|----|----|----|
| 2ⁿ | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1,024 | 2,048 | 4,096 |

> [!NOTE]
> Old textbooks used 2ˢ − 2 subnets (excluding the "subnet zero" and "all-ones subnet"). Modern equipment uses all subnets (since RFC 1878 / Cisco IOS 12.0 `ip subnet-zero` is the default), so **2ˢ** is the correct answer today. Mention it if asked.

### Working backwards from a requirement

**"I need N subnets"** → smallest s with 2ˢ ≥ N.
**"I need H hosts per subnet"** → smallest h with 2ʰ − 2 ≥ H.

Example: split `192.168.10.0/24` into subnets of at least 25 hosts.

```text
2ʰ − 2 ≥ 25  →  h = 5 (30 hosts)       new prefix = 32 − 5 = /27
borrowed s = 27 − 24 = 3               subnets = 2³ = 8
block size = 2⁵ = 32 → subnets start at .0, .32, .64, .96, .128, .160, .192, .224
```

### Listing the subnets

Subnet k (counting from 0) starts at **k × block size**:

| # | Network | First host | Last host | Broadcast |
|---|---------|------------|-----------|-----------|
| 0 | 192.168.10.0/27 | .1 | .30 | .31 |
| 1 | 192.168.10.32/27 | .33 | .62 | .63 |
| 2 | 192.168.10.64/27 | .65 | .94 | .95 |
| 3 | 192.168.10.96/27 | .97 | .126 | .127 |
| … | … | … | … | … |
| 7 | 192.168.10.224/27 | .225 | .254 | .255 |

Each broadcast address is one less than the next network address.

### The binary view (why it works)

Borrowing bits moves the mask boundary right. For `/27` in the 4th octet:

```text
mask 4th octet:  1 1 1 │ 0 0 0 0 0
                 └ subnet ┘ └ host ┘
subnet bits 000 → .0     001 → .32    010 → .64   … 111 → .224
```

The lowest borrowed bit has value 32 — that is the **block size**. The [block-size method](../subnetting-block-size-method/content.md) turns this into fast mental arithmetic.

## Real World

- A small company: `10.10.0.0/16` → `/24` per department (256 subnets of 254 hosts).
- AWS: VPC `10.0.0.0/16` → `10.0.1.0/24` (public, zone a), `10.0.2.0/24` (public, zone b), `10.0.11.0/24` (private, zone a)… each subnet's route table decides whether it reaches the Internet.
- Router-to-router links use `/30` or `/31` to waste nothing.

## Common Traps

- **Forgetting the −2** for hosts (but **not** for subnets).
- **Counting borrowed bits from the wrong starting prefix.** Borrowed bits are new prefix − *original* prefix.
- **"More subnets = more hosts."** The total address count is fixed; every borrowed bit doubles the subnets and halves each subnet's size.

## Interview Follow-up

- *"How many subnets and hosts if you subnet a /24 with a /28?"* 2⁴ = 16 subnets, 2⁴ − 2 = 14 hosts each.
- *"What do you lose by subnetting?"* Two addresses per subnet (network and broadcast) plus usually one for the gateway — more subnets means more overhead.

## Key Takeaways

- Subnetting borrows host bits to create more, smaller networks.
- Subnets = 2^(borrowed bits); usable hosts = 2^(host bits) − 2.
- Size subnets from the requirement: smallest h with 2ʰ − 2 ≥ hosts needed.
- Subnet k starts at k × block size; broadcast = next network − 1.
