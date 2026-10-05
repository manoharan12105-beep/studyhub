# Collision Domains and Broadcast Domains

**Module:** Physical and Data Link Layers · **Interview priority:** Core

## What Is It?

- A **collision domain** is the set of devices whose transmissions can **collide** — they share one medium and only one may transmit at a time.
- A **broadcast domain** is the set of devices that receive each other's **broadcast** frames (`ff:ff:ff:ff:ff:ff`).

| Device | Separates collision domains? | Separates broadcast domains? |
|--------|------------------------------|------------------------------|
| Hub, repeater | No | No |
| Bridge, switch | **Yes** — each port is its own | No (yes per VLAN) |
| Router | Yes | **Yes** — each interface is its own |

## Why It Exists

Both domains limit performance. A large collision domain means devices wait for each other and collide. A large broadcast domain means every ARP request and DHCP Discover interrupts every host. Network design is largely about keeping both small: switches for collision domains, routers and VLANs for broadcast domains.

## How It Works

### Collisions and CSMA/CD

On a shared medium (bus or hub), two devices may start transmitting at once; their signals overlap and both frames are destroyed. Classic Ethernet handles this with **CSMA/CD** (Carrier Sense Multiple Access with Collision Detection):

1. **Carrier sense:** listen; wait while the medium is busy.
2. **Multiple access:** when idle, transmit.
3. **Collision detection:** while sending, compare what is on the wire with what you sent; if different, a collision happened — send a jam signal.
4. **Back off:** wait a random time (binary exponential back-off: after the n-th collision choose a random slot from 0 to 2ⁿ − 1, capped at 2¹⁰ − 1), then try again; give up after 16 attempts.

With **switches and full duplex**, each link has one device at each end and separate send/receive paths, so collisions cannot happen and CSMA/CD is not used. Wi-Fi uses **CSMA/CA** (collision *avoidance*: wait random back-off before sending, acknowledgements) because a radio cannot listen while transmitting.

### Broadcast domains

Broadcasts are needed — ARP and DHCP rely on them — but each broadcast frame is processed by every host's CPU in the domain. With thousands of hosts in one broadcast domain, broadcast traffic (and ARP tables) grows large. Typical design keeps a broadcast domain to a few hundred hosts — often one subnet per VLAN, such as a `/24` with 254 hosts.

**Rule of thumb:** one broadcast domain = one VLAN = one IP subnet.

### Counting domains

```text
         [Router]
        ╱        ╲
   [Switch A]   [Hub]
   ╱  │  ╲      ╱  ╲
  P1  P2  P3   P4  P5
```

- **Broadcast domains:** 2 (one per router interface).
- **Collision domains:** Switch A has 4 links (P1, P2, P3, uplink) → 4; the hub and everything on it (P4, P5 and its uplink) → 1. Total **5**.

## Real World

- The first fix for "slow office network" in the 1990s was replacing hubs with switches — collision domains shrank to one device each.
- Large flat networks (one broadcast domain for a whole building) suffer **broadcast storms** when a loop appears; splitting them into VLANs/subnets and running STP limits the damage.
- Cloud VPC subnets do not deliver real broadcasts at all; the provider answers ARP itself.

## Common Traps

> [!WARNING]
> **Common trap:** "A switch creates separate broadcast domains." Switches create separate **collision** domains; broadcasts reach every port in the VLAN.

- **"Full-duplex Ethernet still uses CSMA/CD."** No — no collisions are possible on a full-duplex point-to-point link.
- **Counting:** every router *interface* starts a new broadcast domain; every switch/router *port* is a collision domain; a hub and everything on it is *one* collision domain.

## Interview Follow-up

- *"How do you reduce broadcast traffic?"* Split the network into smaller subnets with routers or VLANs.
- *"Why does Wi-Fi use CSMA/CA instead of CSMA/CD?"* A radio cannot reliably detect collisions while transmitting, and hidden stations may not hear each other; so it avoids collisions and uses ACKs instead.

## Key Takeaways

- Collision domain = devices sharing a medium; broadcast domain = devices reached by a broadcast.
- Hubs separate nothing; switches separate collision domains; routers (and VLANs) separate broadcast domains.
- CSMA/CD: listen, send, detect, jam, back off — only on shared half-duplex media.
- One broadcast domain ≈ one VLAN ≈ one IP subnet.
