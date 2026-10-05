# NIC, Repeater, Hub, Bridge and Switch — Interview Questions

## Beginner

### Q1. What is the difference between a hub and a switch?

**Style:** Comparison

<details>
<summary>Answer</summary>

A hub is a Layer 1 device that repeats every incoming signal to all other ports: all devices share one collision domain and the bandwidth, and everyone sees every frame. A switch is a Layer 2 device that learns MAC addresses and forwards each frame only to the destination's port: each port is its own collision domain, links are full duplex with dedicated bandwidth, and other hosts do not see the traffic.

</details>

### Q2. What is a NIC and what is stored in it?

<details>
<summary>Answer</summary>

The network interface card connects a host to a network medium (Ethernet or Wi-Fi). It converts between frames and signals, checks frame CRCs, and has a 48-bit MAC address burned in by the manufacturer, used to deliver frames on the local link.

</details>

### Q3. Why are repeaters needed?

<details>
<summary>Answer</summary>

Signals attenuate and pick up noise with distance; copper Ethernet segments are limited to 100 m. A repeater regenerates a clean signal so the segment can be extended. It works only at Layer 1 and does not understand frames or addresses.

</details>

## Intermediate

### Q4. How does a bridge decide whether to forward a frame?

<details>
<summary>Answer</summary>

It learns which side each MAC address is on by reading the source MAC of incoming frames. For each frame it looks up the destination MAC: same side as the sender → filter (drop); other side → forward; unknown or broadcast → forward (flood).

</details>

### Q5. Does a switch reduce broadcast traffic?

**Style:** Follow-up

<details>
<summary>Answer</summary>

No. Broadcast frames (destination `ff:ff:ff:ff:ff:ff`) are flooded to every port in the same VLAN. A switch separates collision domains, not broadcast domains. To limit broadcasts you need routers (subnets) or VLANs.

</details>

## Advanced

### Q6. Why did switches make CSMA/CD practically irrelevant?

**Style:** Why

<details>
<summary>Answer</summary>

CSMA/CD exists to handle collisions on a shared half-duplex medium. With a switch, each host has its own full-duplex link to a switch port — separate wire pairs for sending and receiving and no other transmitter on the segment — so collisions cannot occur and collision detection is not used.

</details>
