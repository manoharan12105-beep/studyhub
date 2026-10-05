# TCP: Segments, Sequence Numbers and Reliability — Practice

### P1. Next sequence number

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** sequence numbers

A segment has SEQ = 4001 and carries 1,000 bytes. What ACK number will the receiver send if it has everything before it?

<details>
<summary>Answer</summary>

**5001** — the next byte it expects (4001 + 1,000).

</details>

### P2. Cumulative ACK

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** cumulative acknowledgement

Segments with SEQ 1, 101, 201 (100 bytes each) are sent. The receiver gets 1 and 201 but not 101. Which ACK does it send after receiving 201?

- A) ACK 301
- B) ACK 201
- C) ACK 101
- D) No ACK

<details>
<summary>Answer</summary>

**Answer:** C) ACK 101

**Explanation:** ACKs are cumulative: it still expects byte 101. Receiving 201 out of order triggers a duplicate ACK 101 (buffering 201–300).

</details>

### P3. After recovery

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** retransmission

Continuing P2: the sender retransmits SEQ 101 and it arrives. What ACK is sent now?

<details>
<summary>Answer</summary>

**ACK 301** — bytes 1–300 are now all received (201–300 was buffered).

</details>

### P4. Which mechanism?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** RTO vs fast retransmit

(a) The last segment of a transfer is lost; nothing follows it. (b) A middle segment is lost while many later segments arrive. Which loss-recovery mechanism resends each?

<details>
<summary>Answer</summary>

(a) The retransmission timeout — no later segments means no duplicate ACKs. (b) Fast retransmit after three duplicate ACKs.

</details>

### P5. Read the capture

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** retransmissions

A Wireshark capture of a slow API call shows many "TCP Retransmission" and "Dup ACK" entries. What does it indicate and how does it slow the call?

<details>
<summary>Answer</summary>

Packet loss on the path (congestion, a bad link, Wi-Fi interference, a faulty NIC/cable or an overloaded middlebox). Each loss costs at least an extra round trip (fast retransmit) or a timeout (hundreds of ms or more), and TCP cuts its congestion window, reducing throughput.

</details>
