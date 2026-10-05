# OSI Layers 1 and 2 — Practice

### P1. Which layer?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** Data Link functions

Which function belongs to the Data Link layer?

- A) Choosing the route to a remote network
- B) Detecting corrupted frames with a CRC
- C) Retransmitting lost segments
- D) Encrypting data

<details>
<summary>Answer</summary>

**Answer:** B) Detecting corrupted frames with a CRC

**Explanation:** Routing is Layer 3, segment retransmission is TCP (Layer 4), encryption is presentation-level (TLS).

</details>

### P2. Layer 1 or Layer 2 problem?

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** layer identification

Classify each problem: (a) a damaged cable, (b) a switch port configured in the wrong VLAN, (c) Wi-Fi too weak in a corner of the office, (d) duplicate MAC addresses on two virtual machines.

<details>
<summary>Answer</summary>

(a) Layer 1, (b) Layer 2, (c) Layer 1 (signal), (d) Layer 2.

</details>

### P3. EtherType

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** EtherType

A frame's EtherType is `0x0806`. What does it carry, and how does the receiver use this field?

<details>
<summary>Answer</summary>

An ARP message. The receiver uses the EtherType to hand the payload to the right protocol handler (`0x0800` → IPv4, `0x86DD` → IPv6, `0x0806` → ARP).

</details>

### P4. Bad CRC

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** error detection

A frame carrying part of a file download is corrupted on a switched Ethernet link. Who notices, what happens to the frame, and how is the data eventually recovered?

<details>
<summary>Answer</summary>

The next receiver (switch or NIC) recomputes the CRC, finds a mismatch and silently drops the frame. The sending TCP never receives an acknowledgement for that data (or sees duplicate ACKs) and retransmits it.

</details>
