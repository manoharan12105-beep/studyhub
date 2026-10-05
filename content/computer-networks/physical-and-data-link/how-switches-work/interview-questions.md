# How Switches Work — Interview Questions

## Beginner

### Q1. How does a switch learn MAC addresses?

<details>
<summary>Answer</summary>

From the source MAC of every incoming frame: it records "this MAC is reachable through this port" in its MAC address table, with an ageing timer (typically 300 s) that is refreshed each time the MAC is seen.

</details>

### Q2. What does a switch do with a frame whose destination MAC is not in its table?

<details>
<summary>Answer</summary>

It floods it out of every port in the same VLAN except the one it arrived on. Only the real destination accepts it; when that device replies, the switch learns its port and later frames are forwarded to that port only.

</details>

## Intermediate

### Q3. Explain forwarding, filtering and flooding.

<details>
<summary>Answer</summary>

Forwarding: the destination is known on another port, so the frame goes out only there. Filtering: the destination is known on the same port the frame came in, so it is dropped. Flooding: the destination is unknown, broadcast or (without IGMP snooping) multicast, so the frame goes out all other ports.

</details>

### Q4. What is the difference between store-and-forward and cut-through switching?

**Style:** Comparison

<details>
<summary>Answer</summary>

Store-and-forward receives the entire frame, checks its CRC and only then forwards it, so corrupted frames are dropped; latency grows with frame size. Cut-through begins forwarding as soon as the destination MAC is read, giving lower, constant latency but possibly forwarding corrupted frames. Data-centre switches often use cut-through for latency.

</details>

## Advanced

### Q5. What is a MAC flooding attack and how is it prevented?

**Style:** Scenario

<details>
<summary>Answer</summary>

The attacker sends huge numbers of frames with random source MACs, filling the switch's MAC table. Legitimate addresses can no longer be learned, so traffic to them is flooded to all ports and the attacker can capture it. Prevention: port security (limit the number of MACs per port and shut or restrict the port on violation), 802.1X port authentication, and monitoring.

</details>

### Q6. Does a switch modify the frame it forwards?

**Style:** Follow-up

<details>
<summary>Answer</summary>

No. A Layer 2 switch forwards the frame unchanged: same source and destination MACs and payload. (It may add or remove an 802.1Q VLAN tag on trunk ports, which also requires recomputing the FCS.) A router, by contrast, always builds a new Layer 2 header.

</details>
