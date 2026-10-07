# Message Queues — Practice

### P1. Queue or direct call

**Difficulty:** Easy · **Type:** Comparison · **Concepts:** sync vs async

Queue (Q) or synchronous call (S)? (a) generating a monthly PDF statement, (b) checking a password at login, (c) sending an OTP SMS, (d) resizing an uploaded image, (e) getting the current price at checkout.

<details>
<summary>Answer</summary>

(a) Q, (b) S, (c) Q, (d) Q, (e) S.

</details>

### P2. Delivery guarantee

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** acknowledgements

A consumer processes a message, writes to the database, then crashes before acknowledging. What does a typical broker do?

- A) Deletes the message anyway
- B) Redelivers the message later, so it may be processed twice
- C) Sends it to the dead-letter queue immediately
- D) Stops the queue

<details>
<summary>Answer</summary>

**Answer:** B) Redelivers the message later, so it may be processed twice

</details>

### P3. Backlog

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** throughput

A queue receives 1,200 messages/s at peak for 30 minutes. Each consumer handles 100 messages/s. You run 8 consumers. How large is the backlog after the peak, and how long does it take to clear if arrivals then drop to 400/s?

<details>
<summary>Answer</summary>

Capacity 800/s, arrivals 1,200/s → backlog grows 400/s × 1,800 s = **720,000 messages**. Afterwards net drain = 800 − 400 = 400/s → 720,000 ÷ 400 = 1,800 s = **30 minutes** to clear (or add consumers to clear faster).

</details>

### P4. Strict FIFO trade-off

**Difficulty:** Medium · **Type:** Trade-off · **Concepts:** ordering

A strictly ordered queue holds 10,000 notification messages. Message #3 fails every time. What happens, and what would you change?

<details>
<summary>Answer</summary>

Messages after #3 cannot be processed in strict order, so all 9,997 wait (head-of-line blocking). Notifications rarely need global ordering: use an unordered queue (or per-user ordering), and after a few failed attempts move #3 to a dead-letter queue so the rest continue.

</details>
