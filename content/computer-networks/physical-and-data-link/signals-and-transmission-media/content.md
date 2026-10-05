# Bits, Signals and Transmission Media

**Module:** Physical and Data Link Layers · **Interview priority:** Awareness

> [!NOTE]
> **Awareness topic.** Software interviews rarely go deep here. Know the media types, their trade-offs and duplex modes; skip the electronics.

## What Is It?

The Physical layer turns bits into something that can travel — voltage on copper, light in glass, or radio waves — and back again. The **transmission medium** is what carries that signal.

## Why It Exists

Every higher layer depends on bits arriving. The medium decides the maximum speed, the distance before the signal must be regenerated, and how sensitive the link is to interference — which is why data centres use fibre, offices use copper and phones use radio.

## How It Works

### Bits become signals

| Medium | A bit is represented as |
|--------|-------------------------|
| Copper | Changes in voltage level |
| Fibre | Pulses (and phases) of light from a laser or LED |
| Wireless | Changes in a radio wave's amplitude, frequency or phase (modulation) |

Signals weaken with distance (**attenuation**), pick up **noise** and **interference**, and spread out (**distortion**). That is why every medium has a maximum segment length, and why repeaters and amplifiers exist.

### Guided media (cables)

| Medium | How it works | Typical speed / distance | Strengths | Weaknesses |
|--------|--------------|--------------------------|-----------|------------|
| **Twisted pair** (Cat5e, Cat6, Cat6a) | Pairs of copper wires twisted to cancel interference; RJ-45 connectors | 1 Gbit/s (Cat5e) to 10 Gbit/s (Cat6a) up to **100 m** | Cheap, easy to install, can carry power (PoE) | Short distance, electrical interference |
| **Coaxial** | Central copper conductor inside a shield | Cable TV / cable Internet (DOCSIS) | Better shielding than twisted pair | Bulky; mostly legacy for LANs |
| **Optical fibre** | Light reflecting along a glass core | 10–400 Gbit/s+; km (multimode: hundreds of metres; single-mode: tens of km and more) | Huge bandwidth, long distance, immune to electrical interference, hard to tap | Costlier transceivers, fragile, needs special skills to join |

### Unguided media (wireless)

| Medium | Range | Use |
|--------|-------|-----|
| Radio — Wi-Fi (2.4 / 5 / 6 GHz) | Tens of metres | Wireless LANs |
| Radio — cellular (4G/5G) | Kilometres | Mobile data |
| Bluetooth | Metres | PAN |
| Microwave links | Line of sight, tens of km | Point-to-point backhaul between towers |
| Satellite | Global | Remote areas, ships, aircraft |
| Infrared | Line of sight, metres | Remote controls |

Wireless is a **shared medium**: devices on one channel take turns, and walls, distance and other networks reduce throughput. Higher frequencies (5 and 6 GHz) carry more data but penetrate walls less than 2.4 GHz.

### Transmission modes (duplex)

| Mode | Direction | Example |
|------|-----------|---------|
| Simplex | One way only | Keyboard → computer |
| Half duplex | Both ways, not at the same time | Walkie-talkie, hub-based Ethernet, a Wi-Fi channel |
| Full duplex | Both ways simultaneously | Switched Ethernet (separate pairs/fibres per direction) |

A **duplex mismatch** (one end full, the other half) causes late collisions and terrible throughput — a classic Layer 1 issue.

### Serial vs parallel

Network links send bits **serially** (one after another) on each lane; high-speed links use several lanes in parallel internally (e.g. 4 lanes of 25 Gbit/s for 100 Gbit/s).

## Comparison

| | Twisted pair | Fibre | Wi-Fi |
|---|--------------|-------|-------|
| Max typical distance | 100 m | Kilometres | Tens of metres |
| Interference | Some | None (electrical) | High |
| Cost | Low | Higher | Low per device |
| Security | Tappable | Hard to tap | Broadcast through the air — needs encryption (WPA2/WPA3) |
| Typical use | Desks, servers in a rack | Backbones, data centres, submarine cables, FTTH | Laptops, phones |

## Real World

- Your home: fibre to the building (FTTH/ONT), Cat6 to the TV, Wi-Fi to phones.
- Data centre: copper for short links inside a rack, fibre between racks and buildings.
- Slow Wi-Fi is often Layer 1: distance, walls, a crowded 2.4 GHz channel — not the ISP.

## Common Traps

- **"Wireless is faster because it has no cable."** Wi-Fi is shared and half duplex per channel; a cable usually gives more stable throughput and lower latency.
- **"Fibre is faster because light travels faster than electricity."** Signals in copper and fibre both travel at roughly two-thirds of light speed. Fibre wins on **bandwidth and distance**, not propagation speed.

## Key Takeaways

- Physical layer: bits as voltage, light or radio. Attenuation and noise limit distance.
- Twisted pair (cheap, 100 m), fibre (high capacity, long distance, interference-free), wireless (mobile, shared, interference-prone).
- Simplex, half duplex, full duplex. Switched Ethernet is full duplex; Wi-Fi channels are shared.
