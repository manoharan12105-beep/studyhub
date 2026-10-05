# OSI vs TCP/IP — Practice

### P1. Merged layers

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** layer mapping

Which OSI layers does the TCP/IP Application layer cover?

- A) Application only
- B) Application and Presentation
- C) Application, Presentation and Session
- D) Application, Presentation, Session and Transport

<details>
<summary>Answer</summary>

**Answer:** C) Application, Presentation and Session

</details>

### P2. Map each protocol

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** layer mapping

For each, give the OSI layer number and TCP/IP (5-layer) layer: HTTP, TCP, IP, Ethernet, fibre optic signalling.

<details>
<summary>Answer</summary>

HTTP: 7 / Application. TCP: 4 / Transport. IP: 3 / Network. Ethernet: 2 / Data Link. Fibre signalling: 1 / Physical.

</details>

### P3. Model or suite?

**Difficulty:** Medium · **Type:** Comparison · **Concepts:** reference model vs protocol suite

A colleague says "our packets go through the OSI stack". What is imprecise about this, and how would you rephrase it?

<details>
<summary>Answer</summary>

OSI is a reference model, not a stack that runs. The packets go through the TCP/IP stack (HTTP over TLS over TCP over IP over Ethernet). Rephrase: "our traffic uses TCP/IP; we describe its layers with OSI numbering."

</details>

### P4. Describe the device

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** L4 vs L7 vocabulary

A load balancer forwards connections to backends based only on the client IP hash and destination port. What OSI layer label would you give it, and what can it **not** do?

<details>
<summary>Answer</summary>

An L4 (transport-layer) load balancer. It cannot route by URL path, host header or cookies, and cannot add HTTP headers, because it does not parse HTTP.

</details>
