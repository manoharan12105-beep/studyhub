# OSI Layers 1 and 2 — Interview Questions

## Beginner

### Q1. What are the responsibilities of the Data Link layer?

<details>
<summary>Answer</summary>

Node-to-node delivery on one link: framing (header + trailer), physical addressing with MAC addresses, error detection with a CRC in the trailer, media access control on shared media (CSMA/CD, CSMA/CA), and link-level flow control. Its PDU is the frame; devices are switches, bridges and access points.

</details>

### Q2. What does the Physical layer define?

<details>
<summary>Answer</summary>

How bits travel: the medium (copper, fibre, radio), signal encoding, bit rate and timing, connectors and pinouts, and transmission mode (simplex/half/full duplex). It moves bits without knowing what they mean.

</details>

## Intermediate

### Q3. Does the Data Link layer correct errors?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Ethernet only detects errors: the receiver recomputes the CRC-32 over the frame and, if it differs from the FCS, drops the frame. Recovery happens end to end in TCP, which notices the missing data and retransmits. Wi-Fi is an exception: because radio errors are common, 802.11 acknowledges and retransmits frames at the link layer.

</details>

### Q4. What are the LLC and MAC sublayers?

<details>
<summary>Answer</summary>

LLC (Logical Link Control) is the upper sublayer: it interfaces with the network layer and identifies the payload protocol (in Ethernet II this is the EtherType field, e.g. `0x0800` for IPv4). MAC (Media Access Control) is the lower sublayer: physical addressing and controlling access to the medium.

</details>

## Advanced

### Q5. Why do MAC addresses change at every hop while IP addresses stay the same?

**Style:** Why

<details>
<summary>Answer</summary>

Layer 2 delivers only across one link, to the next device. Each router removes the incoming frame, decides the next hop from the IP destination, and builds a new frame with its own outgoing MAC as source and the next hop's MAC as destination. The IP header (Layer 3) describes the end-to-end source and destination, so it is not rewritten (except by NAT).

</details>
