# TCP Connection Termination, TIME_WAIT and TCP States — Practice

### P1. Who waits?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** TIME_WAIT

Which side enters TIME_WAIT?

- A) Always the server
- B) Always the client
- C) The side that sent the first FIN
- D) The side that sent the last FIN

<details>
<summary>Answer</summary>

**Answer:** C) The side that sent the first FIN

**Explanation:** The active closer enters TIME_WAIT after acknowledging the peer's FIN.

</details>

### P2. Name the states

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** closing states

The server closes first. Give the server's and the client's state after each of: server sends FIN; client ACKs; client sends FIN; server ACKs.

<details>
<summary>Answer</summary>

1. Server FIN-WAIT-1, client CLOSE-WAIT.
2. Server FIN-WAIT-2, client CLOSE-WAIT.
3. Server TIME-WAIT, client LAST-ACK.
4. Server TIME-WAIT (for 2 × MSL), client CLOSED.

</details>

### P3. Diagnose the state

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** CLOSE-WAIT, TIME-WAIT

`ss -tan` on an app server shows (a) 3,000 sockets in TIME-WAIT to a payment API, (b) 800 in CLOSE-WAIT from a reporting service that keeps growing. Interpret each.

<details>
<summary>Answer</summary>

(a) The app opens and closes many short connections to the payment API (it closes first) — use keep-alive/connection pooling. (b) The reporting service closed connections but our application never closes its side — a connection leak in our code that will eventually exhaust file descriptors.

</details>

### P4. Three or four?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** FIN-ACK

A capture shows only three segments when a connection closes: FIN, FIN-ACK, ACK. Is that valid?

<details>
<summary>Answer</summary>

Yes. The passive side had no more data, so it combined its ACK of the first FIN with its own FIN.

</details>

### P5. Why wait?

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** purpose of TIME_WAIT

Suppose the active closer skipped TIME_WAIT and its final ACK was lost. What would the passive side experience?

<details>
<summary>Answer</summary>

The passive side, in LAST-ACK, would retransmit its FIN. The active closer no longer knows the connection, so it would reply with RST, and the passive side would see an error ("connection reset") instead of a clean close. Also, delayed segments from the old connection could be accepted by a new connection reusing the same 4-tuple.

</details>
