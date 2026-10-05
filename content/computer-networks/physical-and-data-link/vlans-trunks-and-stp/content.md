# VLANs, Trunk Ports and Spanning Tree

**Module:** Physical and Data Link Layers · **Interview priority:** Frequently asked

## What Is It?

- A **VLAN** (Virtual LAN) splits one physical switch (or several) into multiple **logical** LANs. Each VLAN is a separate broadcast domain, usually with its own IP subnet.
- An **access port** belongs to one VLAN and connects an end device. A **trunk port** carries traffic of many VLANs between switches (or to a router/server), tagging each frame with its VLAN ID (**IEEE 802.1Q**).
- **STP** (Spanning Tree Protocol, IEEE 802.1D; modern RSTP 802.1w) prevents **loops** when switches are connected with redundant links, by blocking some ports.

## Why It Exists

Without VLANs, separating Finance from Guests needs separate switches and cables. With VLANs, one set of switches carries many isolated networks — moved and changed by configuration, not by rewiring.

Redundant links between switches protect against cable failures, but Ethernet frames have **no TTL**: a broadcast in a loop circulates forever, multiplying until the network collapses (a **broadcast storm**). STP keeps redundancy while ensuring only one active path.

## VLANs

```text
            one physical switch
 ┌──────────────────────────────────────────┐
 │ ports 1–8:  VLAN 10  (Engineering) 10.0.10.0/24 │
 │ ports 9–16: VLAN 20  (Finance)     10.0.20.0/24 │
 │ ports 17–24: VLAN 30 (Guests)      10.0.30.0/24 │
 └──────────────────────────────────────────┘
 A broadcast from port 2 reaches only ports 1–8.
```

- Devices in different VLANs **cannot** talk at Layer 2, even on the same switch. They need a router or Layer 3 switch (**inter-VLAN routing**), where firewall rules can be applied.
- Benefits: smaller broadcast domains, security isolation, flexible grouping by function rather than location.

### Access vs trunk ports

| | Access port | Trunk port |
|---|-------------|------------|
| VLANs carried | One | Many |
| Connects to | PCs, printers, phones | Other switches, routers, hypervisors |
| Frames | Untagged (the end device does not know about VLANs) | Tagged with an 802.1Q header (VLAN ID) |

### The 802.1Q tag

```text
| Dest MAC | Src MAC | 802.1Q tag (4 B) | EtherType | Payload | FCS |
                      │ TPID 0x8100 │ priority (3 bits) │ DEI (1) │ VLAN ID (12 bits) │
```

12 bits → VLAN IDs 1–4094 (0 and 4095 reserved). The **native VLAN** on a trunk is sent untagged — mismatched native VLANs on two ends cause traffic to leak between VLANs.

### Inter-VLAN routing

```text
PC in VLAN 10 ──access──► [switch] ══trunk══► [router or L3 switch]
                                                 VLAN 10 gateway 10.0.10.1
                                                 VLAN 20 gateway 10.0.20.1
```

The router has one (sub)interface per VLAN, each acting as that subnet's default gateway — "router on a stick" when it is a single trunk link.

## Spanning Tree Protocol (STP)

### The loop problem

```text
   [SW1]────────[SW2]
      ╲          ╱
        ─[SW3]─        a broadcast from SW3 goes to SW1 and SW2,
                       each floods it to the other, which floods it back… forever
```

A loop causes **broadcast storms**, **MAC table instability** (the same MAC appears on different ports) and **duplicate frames**.

### How STP fixes it

1. Switches exchange **BPDUs** (bridge protocol data units) and elect a **root bridge** — the switch with the lowest bridge ID (priority, then MAC).
2. Every other switch picks its **root port**: the port with the lowest path cost to the root.
3. On each link, one **designated port** forwards towards that segment.
4. All other ports are **blocked** — they receive BPDUs but do not forward data.

The result is a loop-free tree. If an active link fails, STP unblocks a backup port. Classic STP takes 30–50 seconds to converge; **RSTP** usually converges within a few seconds.

## Real World

- Corporate Wi-Fi often puts employees and guests on different VLANs (SSIDs mapped to VLANs) with a firewall between them.
- Hypervisors (VMware, KVM) receive trunks and place each VM's virtual NIC in a VLAN.
- "The network froze after someone plugged a cable between two wall ports" — a loop without STP (or with `portfast` misused).

## Common Traps

- **"VLANs on the same switch can talk because they share hardware."** Not at Layer 2 — they need routing.
- **"STP balances traffic over redundant links."** Classic STP **blocks** redundant links; they carry nothing until a failure. (Per-VLAN STP variants or link aggregation are used to use both.)
- **"Routers need STP."** Routers do not forward broadcasts and IP has a TTL, so routed loops die out; STP is a Layer 2 mechanism.

## Interview Follow-up

- *"Access port vs trunk port?"* One untagged VLAN vs many tagged VLANs.
- *"Why do Layer 2 loops cause storms when Layer 3 loops do not?"* Ethernet frames have no TTL; IP packets do.

## Key Takeaways

- VLAN = logical LAN = separate broadcast domain (and usually a subnet). Inter-VLAN traffic needs a router.
- Access ports: one VLAN, untagged. Trunk ports: many VLANs, 802.1Q tagged (12-bit VLAN ID).
- Layer 2 loops cause broadcast storms because frames have no TTL. STP elects a root bridge and blocks redundant ports; RSTP converges faster.
