# VLSM and Supernetting

**Module:** Subnetting · **Interview priority:** Frequently asked

## What Is It?

- **VLSM** (Variable Length Subnet Masking): subnetting one network into subnets of **different sizes**, each sized to its need.
- **Supernetting** (route **summarisation** / **aggregation**): combining several contiguous networks into **one larger prefix**, so a router advertises one route instead of many.

```text
VLSM:         one block  →  many right-sized pieces        (longer prefixes)
Supernetting: many blocks →  one summary route              (shorter prefix)
```

## Why It Exists

Fixed-size subnetting wastes addresses: if every subnet is a /24, a 2-host router link wastes 252 addresses. VLSM sizes each subnet to fit. Supernetting keeps routing tables small: an ISP announces `203.0.112.0/22` instead of four /24s, and the Internet's routing table stays manageable. Both are possible only because of CIDR.

## VLSM

### The method

1. List the requirements and **sort them largest first**.
2. For each, pick the smallest block with 2ʰ − 2 ≥ hosts needed.
3. Allocate blocks **in order from the start of the address space**, each starting at a multiple of its own block size.
4. Keep a running "next free address".

Allocating largest-first guarantees each block starts on a proper boundary without gaps.

### Worked example: `192.168.50.0/24`

Requirements: Sales 100 hosts, Engineering 50, HR 25, one router link 2.

| Need | Hosts needed | Block (addresses) | Prefix | Subnet | Usable range | Broadcast |
|------|--------------|-------------------|--------|--------|--------------|-----------|
| Sales | 100 | 128 | /25 | 192.168.50.0/25 | .1 – .126 | .127 |
| Engineering | 50 | 64 | /26 | 192.168.50.128/26 | .129 – .190 | .191 |
| HR | 25 | 32 | /27 | 192.168.50.192/27 | .193 – .222 | .223 |
| Router link | 2 | 4 | /30 | 192.168.50.224/30 | .225 – .226 | .227 |
| *Free* | | | | 192.168.50.228 – .255 | | |

With fixed /25 subnets, only two subnets would exist — the requirement could not be met at all.

### What goes wrong if you allocate smallest-first

Starting with the /30 at `.0`, the /27 cannot start at `.4` (not a multiple of 32): it must jump to `.32`, leaving `.4`–`.31` as an awkward gap; then the /26 at `.64`, and the /25 needs a multiple of 128 → `.128`. It still fits here, but the free space is fragmented. Largest-first avoids this.

## Supernetting (Summarisation)

### The method

1. Write the networks in binary (only the octet where they differ matters).
2. Count the **common leading bits** — that is the summary prefix length.
3. The summary network is the common bits followed by zeros.

### Worked example: four /24s

```text
192.168.16.0/24   3rd octet  00010000
192.168.17.0/24              00010001
192.168.18.0/24              00010010
192.168.19.0/24              00010011
                             ^^^^^^ 6 common bits in the 3rd octet → 16 + 6 = 22
Summary: 192.168.16.0/22   (covers 192.168.16.0 – 192.168.19.255)
```

Quick check with blocks: a /22 is a block of 4 in the 3rd octet; 16 is a multiple of 4; the block is exactly 16–19. ✓

### Rules for a clean summary

- The number of networks should be a **power of two** (2, 4, 8 …).
- The first network must start on a **boundary** of the summary's block size.

`172.16.8.0/24` – `172.16.15.0/24` (8 networks, 8 is a multiple of 8) → `172.16.8.0/21`. ✓

### Over-summarisation

`192.168.1.0/24` and `192.168.2.0/24` are adjacent but **not** on a /23 boundary: 1 = `00000001`, 2 = `00000010`, only 6 common bits → the smallest single summary is `192.168.0.0/22`, which also covers `192.168.0.0/24` and `192.168.3.0/24`. If those exist elsewhere, traffic for them would be misrouted. Either advertise two routes or accept the overlap only if those ranges are unused.

## Real World

- Cloud and enterprise address plans use VLSM all the time: `/24`s for app tiers, `/28`s for small management subnets, `/30` or `/31` for links.
- Routers summarise at area or site borders (OSPF area ranges, BGP aggregates). An ISP with `203.0.112.0/22` announces one route to the Internet, not 4 or 1,000.

## Comparison

| | Subnetting / VLSM | Supernetting |
|---|-------------------|--------------|
| Direction | Split a network | Combine networks |
| Prefix | Longer | Shorter |
| Goal | Fit address needs, isolate | Smaller routing tables |
| Done by | Network designers when allocating | Routers when advertising routes |

## Common Traps

- **Allocating VLSM blocks off-boundary** — a /27 must start at a multiple of 32.
- **Summarising a non-power-of-two set or an off-boundary set** into a prefix that silently includes extra networks.
- **Confusing summary routes with real subnets** — a summary is a routing entry, not a broadcast domain.

## Interview Follow-up

- *"Why sort VLSM requirements from largest to smallest?"* So each block starts on a valid boundary and free space stays contiguous.
- *"What is the benefit of route summarisation besides table size?"* Stability: a flapping /24 inside a summary does not cause updates outside the summary.

## Key Takeaways

- VLSM = different-sized subnets from one block; sort largest first; align each block to its size.
- Supernetting = combine contiguous networks into one shorter prefix by counting common leading bits.
- A clean summary needs a power-of-two count of networks starting on a matching boundary.
