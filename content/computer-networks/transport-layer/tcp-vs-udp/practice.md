# TCP vs UDP — Practice

### P1. Pick the transport

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** protocol choice

Which application most needs TCP?

- A) A live multiplayer game's position updates
- B) Downloading a software installer
- C) A VoIP call
- D) Sending OSPF hellos

<details>
<summary>Answer</summary>

**Answer:** B) Downloading a software installer

**Explanation:** A single missing byte corrupts the file. (OSPF runs directly over IP, not TCP or UDP.)

</details>

### P2. TCP or UDP?

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** protocol by application

Which transport: SSH, DHCP, PostgreSQL, NTP, SMTP, a WebRTC video call, HTTP/3.

<details>
<summary>Answer</summary>

SSH TCP, DHCP UDP, PostgreSQL TCP, NTP UDP, SMTP TCP, WebRTC video UDP, HTTP/3 UDP (QUIC).

</details>

### P3. Feature check

**Difficulty:** Medium · **Type:** Comparison · **Concepts:** feature differences

For each feature say TCP, UDP or both: (a) ports, (b) checksum, (c) multicast, (d) flow control, (e) message boundaries preserved, (f) handshake.

<details>
<summary>Answer</summary>

(a) both, (b) both, (c) UDP, (d) TCP, (e) UDP, (f) TCP.

</details>

### P4. Design choice

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** trade-offs

A stock-price feed sends the latest price of 5,000 symbols ten times per second to 300 terminals on the same LAN. Old prices are worthless once a newer one arrives. Choose a transport and explain how you handle loss.

<details>
<summary>Answer</summary>

UDP multicast: one stream reaches all 300 terminals without 300 copies, and there is no point retransmitting a stale price. Each message carries a sequence number per symbol so receivers can ignore out-of-order old prices; a terminal that detects a gap can request a snapshot over a separate TCP channel.

</details>
