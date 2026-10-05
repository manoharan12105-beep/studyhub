# IP Addresses vs MAC Addresses — Practice

### P1. Which changes?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** hop-by-hop addressing

As a packet travels from a laptop through four routers to a server (no NAT), which address changes at every hop?

- A) Destination IP
- B) Source IP
- C) Destination MAC
- D) Destination port

<details>
<summary>Answer</summary>

**Answer:** C) Destination MAC

</details>

### P2. Fill the headers

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** frame addressing

Laptop L (`192.168.1.10`, MAC `L`) sends to `198.51.100.5` via gateway R (`192.168.1.1`, MAC `R`). Fill in the first frame: src MAC, dst MAC, src IP, dst IP.

<details>
<summary>Answer</summary>

src MAC = `L`, dst MAC = `R`, src IP = `192.168.1.10`, dst IP = `198.51.100.5`.

</details>

### P3. Same LAN

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** local delivery

Laptop L (`192.168.1.10/24`) sends to printer P (`192.168.1.50`, MAC `P`). What is the destination MAC, and does the router see this frame?

<details>
<summary>Answer</summary>

Destination MAC = `P` (the printer itself, same subnet). The router is not involved; the switch forwards the frame directly to the printer's port.

</details>

### P4. Identifier for the job

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** MAC, IP, port

Which identifier: (a) a switch chooses a port, (b) a router chooses a next hop, (c) the OS chooses which program receives data?

<details>
<summary>Answer</summary>

(a) MAC, (b) IP, (c) port.

</details>
