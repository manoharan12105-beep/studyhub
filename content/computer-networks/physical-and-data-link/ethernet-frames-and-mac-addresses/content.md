# Ethernet Frames, MAC Addresses and Error Detection

**Module:** Physical and Data Link Layers · **Interview priority:** Core

## What Is It?

**Ethernet** (IEEE 802.3) is the dominant wired LAN technology. It packages data into **frames**, addresses them with **MAC addresses**, and detects corruption with a **CRC**. Wi-Fi (802.11) uses a different frame format but the same 48-bit MAC addresses, which is why wired and wireless devices share one LAN.

## Why It Exists

A raw stream of bits has no boundaries, no destination and no way to spot damage. Framing answers *where does a unit start and end*, MAC addressing answers *which device on this link is it for*, and the CRC answers *did it arrive intact*.

## MAC Addresses

A **MAC address** is a 48-bit (6-byte) identifier for a network interface, written as six hexadecimal pairs: `3c:22:fb:9a:10:4e` (Linux style) or `3C-22-FB-9A-10-4E` (Windows style).

```text
   3c:22:fb   :   9a:10:4e
   └──OUI───┘     └─device─┘
   manufacturer   assigned by the manufacturer
   (IEEE assigns)
```

- The first 3 bytes are the **OUI** (Organizationally Unique Identifier) of the manufacturer; the last 3 are unique within it.
- In the first byte, the lowest bit marks **multicast** (1) vs unicast (0), and the second-lowest marks **locally administered** (1) vs globally unique (0).
- `ff:ff:ff:ff:ff:ff` is the **broadcast** address — every device on the LAN accepts it.
- MACs are "burned in" but can be changed in software. Phones use **randomised MAC addresses** per Wi-Fi network for privacy; virtual machines and containers get generated MACs.
- MAC addresses are **flat** (no network part) and **local**: they matter only on the current link.

```bash
# Illustrative: show interfaces and their MAC addresses
ip link show          # Linux: "link/ether 00:15:5d:90:f1:44"
```

```bash
# Windows (Command Prompt)
ipconfig /all         # "Physical Address . . . : 00-15-5D-90-F1-44"
```

## The Ethernet II Frame

```text
 ┌──────────┬─────┬──────────┬──────────┬───────────┬──────────────────────┬─────────┐
 │ Preamble │ SFD │ Dest MAC │ Src MAC  │ EtherType │ Payload (46–1500 B)  │  FCS    │
 │   7 B    │ 1 B │   6 B    │   6 B    │    2 B    │ e.g. an IP packet    │  4 B    │
 └──────────┴─────┴──────────┴──────────┴───────────┴──────────────────────┴─────────┘
  └ Layer 1: sync ┘└──────────── frame header (14 B) ─┘                       └ trailer ┘
```

| Field | Purpose |
|-------|---------|
| Preamble + SFD | Alternating bits that let the receiver synchronise its clock, then "frame starts now" (handled by the NIC, not shown in captures) |
| **Destination MAC** | First, so a switch can start deciding where to send the frame as soon as it arrives |
| **Source MAC** | Who sent it — switches learn from this field |
| **EtherType** | What is inside: `0x0800` IPv4, `0x86DD` IPv6, `0x0806` ARP, `0x8100` VLAN tag follows |
| **Payload** | 46 to 1,500 bytes (padded if shorter). 1,500 is Ethernet's **MTU** |
| **FCS** | Frame Check Sequence: CRC-32 over the frame |

Minimum frame size is 64 bytes (header + payload + FCS), maximum 1,518 (1,522 with a VLAN tag). **Jumbo frames** (payload ~9,000) are used inside some data centres.

## Error Detection

Noise can flip bits. The data link layer **detects** errors; it does not repair them on Ethernet.

| Method | How it works | Catches |
|--------|--------------|---------|
| **Parity bit** | Add 1 bit so the count of 1s is even (or odd) | Any single-bit error; misses an even number of flipped bits |
| **Checksum** | Add up the data in 16-bit words (one's complement) and send the sum | Many errors; used by IP (header only), TCP and UDP |
| **CRC** (Cyclic Redundancy Check) | Treat the bits as a polynomial, divide by a fixed generator polynomial, send the remainder | All burst errors up to the CRC length and almost all others; used by Ethernet (CRC-32), Wi-Fi, disks |

### CRC, in concept

1. Sender and receiver agree on a **generator** polynomial (Ethernet uses a standard 33-bit generator, giving a 32-bit remainder).
2. The sender appends zeros to the data, divides by the generator using XOR arithmetic (no carries), and sends the **remainder** as the FCS.
3. The receiver divides the received frame (data + FCS) by the same generator. A **zero remainder** means no detected error; anything else means corruption → the frame is **dropped**.

A tiny worked example with generator `1011` (CRC-3) and data `1101`:

```text
Data with 3 zeros appended:  1101000
1101000 ÷ 1011 (XOR division):
  1101 XOR 1011 = 0110 → bring down → 1100
  1100 XOR 1011 = 0111 → bring down → 1110
  1110 XOR 1011 = 0101 → bring down → 1010
  1010 XOR 1011 = 0001 → remainder 001
Transmitted: 1101 001   →  receiver divides 1101001 by 1011 → remainder 000 ✓
```

Recovery is left to higher layers: TCP notices missing data and retransmits.

> [!NOTE]
> Detecting vs correcting: **error-correcting codes** (e.g. Hamming, Reed-Solomon, LDPC) add enough redundancy to *fix* errors and are used in Wi-Fi/5G physical layers, DVDs and memory (ECC RAM). Ethernet frames themselves are only checked.

## Real World

- `ip -s link` shows `RX errors` — rising CRC errors point to a bad cable or interference.
- MAC randomisation means a café's "MAC-based" guest login may ask you to log in again on a new visit.
- Cloud VMs have MAC addresses too, but the cloud's virtual network handles delivery — you will mostly care about IPs there.

## Common Traps

- **"MAC addresses are unique and permanent."** Usually unique, but they can be changed, cloned or randomised.
- **"A MAC address can tell you where a device is."** It is flat — no location or network part. That is why IP addresses exist.
- **"Ethernet retransmits corrupted frames."** It drops them; TCP retransmits.
- **"The checksum and the CRC are the same."** IP/TCP/UDP use a simple 16-bit checksum; Ethernet uses the much stronger CRC-32.

## Interview Follow-up

- *"How many bits is a MAC address and an IPv4 address?"* 48 and 32.
- *"What is the MTU of Ethernet and why does it matter?"* 1,500 bytes of payload; larger IP packets must be fragmented or rejected, and VPN overhead reduces it.

## Key Takeaways

- MAC address: 48 bits, OUI + device part, flat and link-local; `ff:ff:ff:ff:ff:ff` = broadcast.
- Ethernet frame: dest MAC, src MAC, EtherType, payload (46–1,500), FCS (CRC-32).
- Parity < checksum < CRC in detection strength. Ethernet detects and drops; TCP recovers.
