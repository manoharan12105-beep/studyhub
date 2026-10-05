# Network Topologies

**Module:** Network Fundamentals · **Interview priority:** Frequently asked

## What Is It?

A **topology** is the arrangement of nodes and links in a network. The **physical topology** is how cables and devices are actually connected; the **logical topology** is how data flows. They can differ: a hub is wired as a star but behaves logically like a bus, because every frame reaches every port.

## Why It Exists

Topology decides cost (how many cables and ports), resilience (what one failure breaks), performance (shared or dedicated links) and how easy it is to add devices or find faults. Data-centre and cloud network designs are topology decisions.

## The Topologies

### Bus

All devices attach to one shared cable (the backbone) with terminators at both ends.

```text
  [A]     [B]     [C]     [D]
   │       │       │       │
 ■─┴───────┴───────┴───────┴─■   ← one shared cable, terminators at the ends
```

- **Pros:** least cable, cheap, simple for a few devices.
- **Cons:** one cable break takes down the network; all devices share the bandwidth; collisions grow with traffic; hard to locate faults.
- **Seen in:** early Ethernet (10BASE2/10BASE5 coaxial). Obsolete for LANs.

### Ring

Each device connects to exactly two neighbours; data travels around the ring in one direction (or both, in a dual ring).

```text
     [A] ── [B]
      │       │
     [D] ── [C]
```

- **Pros:** orderly access (e.g. a token passed around), no collisions, predictable performance.
- **Cons:** in a single ring, one failed node or link breaks the ring; adding a node disrupts it.
- **Seen in:** Token Ring, FDDI (dual ring for fault tolerance), some metro fibre (SONET/SDH) rings.

### Star

Every device has its own link to a central device (switch or hub).

```text
      [A]   [B]
        ╲   ╱
  [E] ─ [SW] ─ [C]
          │
         [D]
```

- **Pros:** one cable failure affects only one device; easy to add, remove and troubleshoot; with a switch each port has dedicated bandwidth.
- **Cons:** more cable than bus; the central device is a single point of failure.
- **Seen in:** almost every modern Ethernet and Wi-Fi LAN (the access point is the centre).

### Mesh

Devices have multiple links to each other. In a **full mesh** every node links to every other: **n(n − 1) / 2** links for n nodes. In a **partial mesh** only some do.

```text
   [A] ─── [B]
    │ ╲   ╱ │
    │   ╳   │      full mesh of 4 nodes: 4 × 3 / 2 = 6 links
    │ ╱   ╲ │
   [D] ─── [C]
```

- **Pros:** many alternative paths, very resilient, no central bottleneck.
- **Cons:** cost and cabling grow quickly (10 nodes need 45 links); complex to manage.
- **Seen in:** Internet backbones and WAN cores (partial mesh), data-centre fabrics, Wi-Fi mesh systems.

### Tree (hierarchical)

Stars connected in levels: a root (core) connects to distribution devices, which connect to access devices.

```text
               [Core]
              ╱      ╲
       [Dist 1]      [Dist 2]
       ╱     ╲        ╱     ╲
   [Acc]   [Acc]   [Acc]   [Acc]
    hosts   hosts   hosts   hosts
```

- **Pros:** scalable, organised by floor or department, easy to expand.
- **Cons:** failure of a higher-level device cuts off everything below it; the root is critical.
- **Seen in:** campus and enterprise networks (core–distribution–access).

### Hybrid

A mix of the above — e.g. star LANs on each floor, joined by a partial-mesh core. Almost every real large network is hybrid.

## Comparison

| Topology | Cabling | One link fails | Central point of failure | Typical use today |
|----------|---------|----------------|--------------------------|-------------------|
| Bus | Least | Whole network may fail | The backbone cable | Obsolete |
| Ring | Low | Breaks a single ring | None (but every node matters) | Metro fibre rings |
| Star | Medium | Only that device | Central switch | LANs, Wi-Fi |
| Mesh | Most | Traffic reroutes | None | Backbones, data centres |
| Tree | Medium | Subtree below it | Root/core | Campus networks |
| Hybrid | Varies | Depends | Depends | Most real networks |

## Real World

Data centres use a **leaf-spine** topology: every leaf (rack) switch connects to every spine switch — a partial mesh that gives every server pair a path of the same length and many equal-cost alternatives.

**Think about it:** A full mesh of 50 branch offices would need how many links, and why do companies use a hub-and-spoke or partial mesh instead?

<details>
<summary>Answer</summary>

50 × 49 / 2 = 1,225 links. That is far too costly to lease and manage, so they connect branches to a few hubs (star/partial mesh) or over the Internet with VPNs.

</details>

## Common Traps

- **"Star topology has no single point of failure."** The central switch is one; redundant switches or a mesh core remove it.
- **"Physical and logical topology are always the same."** A hub-based star behaves logically as a bus (shared medium); a switched star behaves as dedicated point-to-point links.
- **Mesh link formula:** it is n(n − 1)/2 links, but each node needs n − 1 ports.

## Interview Follow-up

- *"Which topology do home networks use?"* Star — devices connect to the router/access point.
- *"Why is mesh used in the Internet core?"* Multiple paths let routing protocols route around failures.

## Key Takeaways

- Bus (shared cable, fragile), ring (neighbours, ordered), star (central device, most common), mesh (many paths, resilient, costly), tree (hierarchy of stars), hybrid (real networks).
- Full mesh links = n(n − 1)/2.
- Physical ≠ logical topology.
