# OSI Layers 1 and 2: Physical and Data Link

**Module:** OSI Model · **Interview priority:** Core

## What Is It?

The two lowest layers move data across **one link** — from one device to the next device directly connected to it.

| | Layer 1 — Physical | Layer 2 — Data Link |
|---|--------------------|---------------------|
| Responsibility | Transmit raw **bits** as signals | Deliver **frames** node to node on one link |
| PDU | Bit | Frame |
| Addressing | None | **MAC address** (48-bit) |
| Key functions | Signals, encoding, timing, media, connectors, data rate, duplex | Framing, MAC addressing, error **detection**, media access control, flow on the link |
| Protocols / standards | Ethernet physical specs (1000BASE-T), 802.11 radio, fibre optics, DSL | Ethernet (802.3), Wi-Fi MAC (802.11), PPP, VLAN tagging (802.1Q) |
| Devices | Cable, hub, repeater, modem, transceiver | Switch, bridge, access point, NIC |

## Why It Exists

Higher layers assume "I can hand a packet to the next device". Something must turn that into voltage changes or light pulses (Layer 1), and something must mark where a packet starts and ends, say which device on a shared link it is for, and notice when noise corrupted it (Layer 2).

## Layer 1 — Physical

Defines everything about the **medium and the signal**:

- **Media:** twisted-pair copper, coaxial cable, optical fibre, radio.
- **Signal and encoding:** how a 0 and a 1 are represented (voltage levels, light on/off, radio modulation).
- **Bit rate and timing:** 1 Gbit/s, clock synchronisation between sender and receiver.
- **Connectors and pinouts:** RJ-45, LC fibre connectors.
- **Transmission mode:** simplex, half duplex, full duplex.
- **Physical topology:** how devices are cabled.

Layer 1 does **not** know what the bits mean. A hub or repeater copies them without understanding frames. More detail: [Signals and Transmission Media](../../physical-and-data-link/signals-and-transmission-media/content.md).

## Layer 2 — Data Link

Turns the raw bit stream into reliable-enough **frames** between neighbours:

| Function | What it means |
|----------|---------------|
| **Framing** | Adds a header and a trailer so the receiver knows where a frame starts and ends |
| **Physical (MAC) addressing** | Source and destination MAC addresses — which NIC on this link |
| **Error detection** | Frame Check Sequence (CRC-32) in the trailer; a corrupted frame is **dropped** (Ethernet does not repair it) |
| **Media access control** | Who may transmit on a shared medium: CSMA/CD (old Ethernet), CSMA/CA (Wi-Fi) |
| **Link-level flow control** | Pause frames on Ethernet to slow a sender on this link |

### Two sublayers

- **LLC** (Logical Link Control, 802.2): interface to the network layer; identifies which Layer 3 protocol is inside (in Ethernet II, the EtherType field does this: `0x0800` IPv4, `0x86DD` IPv6, `0x0806` ARP).
- **MAC** (Media Access Control): addressing and access to the medium.

### An Ethernet frame (simplified)

```text
| Dest MAC (6) | Src MAC (6) | EtherType (2) | Payload: IP packet (46–1500) | FCS / CRC (4) |
└──────────────── header (14 bytes) ─────────┘                                └ trailer ┘
```

Field by field: [Ethernet Frames and MAC Addresses](../../physical-and-data-link/ethernet-frames-and-mac-addresses/content.md).

### Scope: one hop only

MAC addresses matter only on the **current link**. When a router forwards a packet, it removes the old frame and builds a new one with new MAC addresses for the next link. The IP addresses inside stay the same — see [IP vs MAC Addresses](../../arp-and-local-delivery/ip-vs-mac-addresses/content.md).

## Real World

- "Cable unplugged", "Wi-Fi signal weak", "duplex mismatch causing errors" → Layer 1.
- "Switch port in the wrong VLAN", "MAC address table full", "ARP not resolving" → Layer 2.
- `ip link` shows Layer 2 state (`UP`, MAC address `link/ether`); `ethtool eth0` shows Layer 1 speed and duplex.

## Common Traps

- **"Layer 2 corrects errors."** Ethernet only *detects* them (CRC) and drops the frame; recovery is left to TCP (Layer 4). Wi-Fi does retransmit frames at the link level because radio errors are frequent.
- **"MAC addresses are used end to end."** Only on the local link; they change at every router.
- **"A switch is Layer 1 because it has cables."** It reads MAC addresses, so it is Layer 2.

## Interview Follow-up

- *"Why do we need Layer 2 if we have IP?"* IP says which host overall; Layer 2 gets the packet to the right device on *this* wire — the next hop.
- *"What happens to a frame with a bad CRC?"* The receiving NIC or switch drops it silently.

## Key Takeaways

- Layer 1: bits as signals over a medium — no addresses, no meaning.
- Layer 2: frames between neighbours — MAC addresses, framing, CRC error detection, media access.
- Frame = header (dest MAC, src MAC, EtherType) + payload + FCS trailer.
- MAC addresses are hop-local; frames are rebuilt at every router.
