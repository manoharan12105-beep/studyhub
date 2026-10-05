# NIC, Repeater, Hub, Bridge and Switch

**Module:** Network Devices · **Interview priority:** Core

## What Is It?

These are the devices that connect hosts **inside one local network**. They differ in how much they understand about the data passing through:

| Device | OSI layer | Understands | Decision it makes |
|--------|-----------|-------------|-------------------|
| **NIC** (network interface card) | 1 and 2 | Bits and frames for its own host | "Is this frame for me?" |
| **Repeater** | 1 — Physical | Only signals | None — regenerates the signal |
| **Hub** | 1 — Physical | Only signals | None — copies to every port |
| **Bridge** | 2 — Data Link | MAC addresses | Forward or filter between two segments |
| **Switch** | 2 — Data Link | MAC addresses | Forward to exactly the right port |

## Why It Exists

Signals weaken with distance, devices need a shared place to plug in, and traffic for one device should not bother all the others. Each device in this list solved the next problem: repeaters fixed distance, hubs added ports, bridges and switches stopped sending everything everywhere.

## NIC (Network Interface Card)

The hardware that connects a host to a link — an Ethernet port or a Wi-Fi adapter, usually built into the motherboard.

- Converts frames to signals on the medium and back.
- Has a burned-in **MAC address** (48 bits, e.g. `3c:22:fb:9a:10:4e`) used for delivery on the local link.
- Accepts frames addressed to its MAC, broadcasts and subscribed multicasts; drops others (unless in promiscuous mode, as packet sniffers use).
- Checks each frame's CRC and discards corrupted frames (see [Ethernet Frames and MAC Addresses](../../physical-and-data-link/ethernet-frames-and-mac-addresses/content.md)).

## Repeater (Layer 1)

Signals lose strength and pick up noise over distance (copper Ethernet is limited to 100 m per segment). A **repeater** receives the weakened signal and **regenerates** a clean one. It does not read addresses — it does not even know frames exist. Modern equivalents: fibre amplifiers on long-haul links, Wi-Fi range extenders (which are more than simple repeaters).

## Hub (Layer 1)

A **hub** is a multi-port repeater: a bit arriving on one port is copied out of **every other port**.

```text
A sends to C through a hub:
   A ──► [ HUB ] ──► B   (receives and drops it)
             │  ──► C   (accepts it)
             └───► D   (receives and drops it)
```

Consequences:

- **One collision domain:** if two devices transmit at once, signals collide; devices must use half duplex and CSMA/CD (listen, transmit, detect collision, back off).
- **Shared bandwidth:** a 100 Mbit/s hub gives 100 Mbit/s *total* to all ports.
- **No privacy:** every device sees every frame.

Hubs are obsolete; you will meet them in interviews, not in data centres.

## Bridge (Layer 2)

A **bridge** connects two LAN segments and reads the **destination MAC address** of each frame:

- It **learns** which MAC addresses are on which side by reading **source** MACs.
- If the destination is on the same side as the sender, it **filters** (does not forward) the frame.
- If it is on the other side, or unknown, it **forwards** it.

This splits one collision domain into two and keeps local traffic local. A bridge is the ancestor of the switch.

## Switch (Layer 2)

A **switch** is a multi-port bridge built in hardware. It keeps a **MAC address table** (port ↔ MAC) and forwards each frame only to the port where the destination lives.

```text
A sends to C through a switch:
   A ──► [ SWITCH ] ──► C   only
         MAC table: A→port1, B→port2, C→port3, D→port4
```

- **Each port is its own collision domain**; links run in **full duplex**, so collisions do not happen.
- **Dedicated bandwidth per port:** a 1 Gbit/s switch can carry many 1 Gbit/s conversations at once.
- **Unknown destination or broadcast:** the frame is **flooded** to all ports except the incoming one. So a switch does **not** split the broadcast domain — all ports are in one broadcast domain (unless [VLANs](../../physical-and-data-link/vlans-trunks-and-stp/content.md) are used).

How the table is learned, aged and used is covered in [How Switches Work](../../physical-and-data-link/how-switches-work/content.md).

> [!NOTE]
> **Layer 3 switches** also route between VLANs using IP addresses in hardware — they blur the line between switch and router. In a plain interview answer, "switch" means a Layer 2 device.

## Comparison

| | Hub | Bridge | Switch |
|---|-----|--------|--------|
| Layer | 1 | 2 | 2 |
| Forwarding | Every port | Between two segments by MAC | Only the destination port by MAC |
| Collision domains | One for all ports | One per side | One per port |
| Broadcast domains | One | One | One (per VLAN) |
| Duplex | Half | Half or full | Full |
| Bandwidth | Shared | Shared per segment | Dedicated per port |
| Security | Everyone sees everything | Better | Best of the three |

## Real World

- Your home router box contains a small **switch** (the 4 LAN ports) and an access point.
- Data centres use high-speed switches (25–400 Gbit/s ports) in a leaf-spine design.
- An attacker on a switched network cannot passively see others' traffic as on a hub — which is why attacks like [ARP spoofing](../../network-security/common-network-attacks/content.md) try to trick the switch path instead.

## Common Traps

> [!WARNING]
> **Common trap:** "A switch breaks up broadcast domains." It breaks up **collision** domains. Broadcasts still go to every port. Routers (or VLANs) break up broadcast domains.

- **"A hub sends the frame to the destination."** It sends it to *everyone*; the destination's NIC is the one that accepts it.
- **"Repeaters and hubs read MAC addresses."** Layer 1 devices see only signals.

## Interview Follow-up

- *"Hub vs switch?"* See the comparison table — and [Network Device Comparisons](../network-device-comparisons/content.md).
- *"What does a switch do with a frame to an unknown MAC?"* Floods it to all ports except the incoming one, then learns where the reply comes from.

## Key Takeaways

- NIC: connects a host, has the MAC address. Repeater: regenerates signals. Hub: repeats to all ports (one collision domain).
- Bridge: filters between segments by MAC. Switch: forwards to exactly one port using a learned MAC table.
- Switch = one collision domain per port, still one broadcast domain.
