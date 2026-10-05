# Switching Techniques — Practice

### P1. Identify the technique

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** circuit switching

Which technique has a setup phase, a dedicated path and constant delay during transfer?

- A) Packet switching (datagram)
- B) Message switching
- C) Circuit switching
- D) Broadcasting

<details>
<summary>Answer</summary>

**Answer:** C) Circuit switching

</details>

### P2. Out of order

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** datagram switching

Why can packets of one download arrive out of order, and which layer fixes it?

<details>
<summary>Answer</summary>

Each IP packet is routed independently, so packets can take different paths or wait in different queues. TCP at the receiver uses sequence numbers to reorder them before giving data to the application.

</details>

### P3. Wasted capacity

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** circuit vs packet efficiency

A user reads a web page for 60 seconds after a 1-second download. Over a circuit-switched connection, what happens to the reserved capacity during the 60 seconds? What happens with packet switching?

<details>
<summary>Answer</summary>

Circuit: the capacity stays reserved and unused for 60 seconds — nobody else can use it. Packet: no capacity is reserved, so other users' packets use the link while this user is idle.

</details>

### P4. Link failure

**Difficulty:** Medium · **Type:** Comparison · **Concepts:** resilience

A link in the middle of the path fails during a transfer. What happens under circuit switching and under packet switching?

<details>
<summary>Answer</summary>

Circuit switching: the connection is broken and must be set up again. Packet switching: routing protocols find another path and later packets are forwarded around the failure; TCP retransmits any packets lost in the meantime.

</details>
