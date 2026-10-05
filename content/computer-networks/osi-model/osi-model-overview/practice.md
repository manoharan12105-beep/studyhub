# The OSI Model — Practice

### P1. Order the layers

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** layer order

Order from Layer 1 to Layer 7: Transport, Physical, Application, Data Link, Session, Network, Presentation.

<details>
<summary>Answer</summary>

Physical, Data Link, Network, Transport, Session, Presentation, Application.

</details>

### P2. Identify the PDU

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** PDUs

A unit with a source MAC, destination MAC and a CRC trailer is called a:

- A) Packet
- B) Segment
- C) Frame
- D) Datagram

<details>
<summary>Answer</summary>

**Answer:** C) Frame

**Explanation:** MAC addresses and the trailer belong to the Data Link layer, whose PDU is the frame.

</details>

### P3. Identify the layer

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** layer responsibilities

Name the OSI layer: (a) choosing a path through routers, (b) converting a JPEG and compressing it, (c) port numbers, (d) voltage levels on a cable, (e) detecting a corrupted frame with a CRC, (f) HTTP.

<details>
<summary>Answer</summary>

(a) Network (3), (b) Presentation (6), (c) Transport (4), (d) Physical (1), (e) Data Link (2), (f) Application (7).

</details>

### P4. Identify the protocol's layer

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** protocols by layer

Place each protocol: TCP, IP, Ethernet, DNS, ICMP, UDP, SSH, Wi-Fi (802.11).

<details>
<summary>Answer</summary>

Transport: TCP, UDP. Network: IP, ICMP. Data Link: Ethernet, Wi-Fi (802.11 also defines Physical). Application: DNS, SSH.

</details>

### P5. Which layer failed?

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** layered troubleshooting

`ping 8.8.8.8` succeeds, `ping google.com` fails with "could not find host". Which function is failing and at which layer does that protocol sit?

<details>
<summary>Answer</summary>

Name resolution — DNS, an Application-layer protocol. Layers 1–3 work (the ping by IP succeeds), so the problem is the DNS server setting or the DNS server itself.

</details>

### P6. Hop by hop

**Difficulty:** Hard · **Type:** Packet flow · **Concepts:** end-to-end vs hop-by-hop

A packet crosses two switches and two routers (no NAT, no proxies). Up to which layer does each device read the data? Which device reads the TCP header?

<details>
<summary>Answer</summary>

Switches read up to Layer 2, routers up to Layer 3. Only the destination host reads the TCP header (Layer 4) — transport is end-to-end. (A NAT device, stateful firewall or L4 load balancer would also read it.)

</details>
