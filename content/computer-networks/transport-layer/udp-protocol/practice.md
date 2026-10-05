# UDP — Practice

### P1. Header size

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** UDP header

How large is the UDP header?

- A) 4 bytes
- B) 8 bytes
- C) 20 bytes
- D) 40 bytes

<details>
<summary>Answer</summary>

**Answer:** B) 8 bytes

</details>

### P2. What UDP does not do

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** UDP features

Which of these does UDP provide: (a) ports, (b) retransmission, (c) ordering, (d) checksum, (e) connection setup?

<details>
<summary>Answer</summary>

Only (a) ports and (d) checksum.

</details>

### P3. Message boundaries

**Difficulty:** Medium · **Type:** Output-based · **Concepts:** datagrams vs byte stream

A sender calls `send("AB")` then `send("CD")` over UDP; both arrive. How many `receive()` calls does the receiver need, and what does each return? What could a TCP receiver's single `read()` return?

<details>
<summary>Answer</summary>

UDP: two receives, `"AB"` and `"CD"` (boundaries preserved; order not guaranteed). TCP is a byte stream, so one `read()` may return `"ABCD"`, `"A"`, `"ABC"` … — the application must frame its own messages.

</details>

### P4. Choose the transport

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** UDP use cases

For a multiplayer game sending player positions 30 times a second, why is UDP usually chosen, and what does the game do about lost packets?

<details>
<summary>Answer</summary>

Positions are quickly outdated; waiting for retransmission of an old position would cause lag. With UDP the game uses the newest position that arrives, interpolates/predicts movement, and adds its own sequence numbers to ignore stale packets. Critical events (a purchase, a chat message) may be sent with application-level acknowledgements.

</details>
