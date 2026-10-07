# Case Study: Design a Chat Application — Practice

### P1. Gateway count

**Difficulty:** Easy · **Type:** Estimation · **Concepts:** connection capacity

30 million users are online at peak. Each gateway handles 120,000 connections at a safe load. How many gateways do you need, with 25 % headroom?

<details>
<summary>Answer</summary>

30,000,000 ÷ 120,000 = 250 gateways; with 25 % headroom ≈ **313 gateways**.

</details>

### P2. Duplicate send

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** idempotent send

A phone sends a message, the server stores it, but the ack is lost on a flaky network. The phone resends. How does the system avoid showing the message twice?

<details>
<summary>Answer</summary>

Each message carries a client-generated message ID. The server keeps a unique constraint on `(conversation_id, client_msg_id)`: the resend matches the existing message, so the server returns the original sequence number and ack instead of storing a second copy.

</details>

### P3. Gap detection

**Difficulty:** Medium · **Type:** Output · **Concepts:** sequence numbers

A client has messages up to sequence 210 in a conversation and then receives 213. What should it do?

<details>
<summary>Answer</summary>

Detect the gap (211 and 212 missing), request the missing range from the server's history API, and display messages in sequence order once they arrive (holding or slotting 213 accordingly).

</details>

### P4. Choose the store

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** storage choice

Which storage layout best fits "show the latest 50 messages of conversation X" at billions of messages?

- A) One relational table with an index on message ID only
- B) A wide-column table partitioned by conversation ID and clustered by sequence descending
- C) A key-value store with one key per user containing all their messages
- D) Object storage with one file per message

<details>
<summary>Answer</summary>

**Answer:** B) A wide-column table partitioned by conversation ID and clustered by sequence descending

</details>
