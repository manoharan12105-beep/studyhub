# Switching Techniques — Interview Questions

## Beginner

### Q1. What is the difference between circuit switching and packet switching?

**Style:** Comparison

<details>
<summary>Answer</summary>

Circuit switching reserves a dedicated path and capacity before sending; data then flows at a constant rate on that path (classic telephone calls). Packet switching splits data into packets that are routed independently through shared links with no reservation (the Internet). Circuit: guaranteed quality but wasted capacity and setup delay. Packet: efficient and resilient, but variable delay and possible loss.

</details>

### Q2. Which switching technique does the Internet use?

<details>
<summary>Answer</summary>

Packet switching in datagram mode: every IP packet carries the full destination address and each router decides its next hop independently.

</details>

## Intermediate

### Q3. Why is packet switching better for computer traffic?

**Style:** Why

<details>
<summary>Answer</summary>

Computer traffic is bursty — long idle periods, then short bursts. Reserving a circuit would waste capacity during idle time. Packet switching lets many users share links statistically, starts sending immediately (no setup) and reroutes around failed links.

</details>

### Q4. TCP is connection-oriented. Does that make the Internet circuit-switched?

**Style:** Follow-up

<details>
<summary>Answer</summary>

No. TCP's connection is state kept only in the two end hosts (sequence numbers, windows). Routers keep no per-connection state and switch each IP packet independently; packets of one TCP connection can take different paths and arrive out of order, and TCP reorders them.

</details>

## Advanced

### Q5. Compare datagram and virtual-circuit packet switching.

**Style:** Comparison

<details>
<summary>Answer</summary>

Datagram: no setup; every packet carries the full destination address and is routed independently, so packets can arrive out of order; nodes keep no per-flow state (IP). Virtual circuit: a path is set up first and switches keep per-circuit state; packets carry a short circuit identifier and follow the same path in order (X.25, Frame Relay, ATM; MPLS label switching is similar). Virtual circuits make QoS easier; datagrams are simpler and more resilient.

</details>
