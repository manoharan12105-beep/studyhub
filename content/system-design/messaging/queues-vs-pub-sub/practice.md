# Point-to-Point Queues vs Publish-Subscribe — Practice

### P1. Which model?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** pub/sub

A "PaymentCompleted" event must reach the invoicing, analytics and loyalty services. Which model fits?

- A) A single point-to-point queue shared by all three services
- B) Publish-subscribe (a topic with one subscription per service)
- C) Direct HTTP calls from the payment service to each
- D) A database trigger

<details>
<summary>Answer</summary>

**Answer:** B) Publish-subscribe (a topic with one subscription per service)

</details>

### P2. Count deliveries

**Difficulty:** Medium · **Type:** Output · **Concepts:** fan-out

A topic has three subscribing services; service A runs 4 instances sharing one queue, B runs 2, C runs 1. 100 events are published. How many times is each event processed in total, and how many events does each A instance handle on average?

<details>
<summary>Answer</summary>

Each event is processed **3 times** (once per service), 300 processings in total. A's 4 instances share 100 events → about **25 each**.

</details>

### P3. Design

**Difficulty:** Medium · **Type:** Design · **Concepts:** combining models

Design messaging for video uploads: when a video is uploaded, it must be transcoded (heavy, many workers), its thumbnail generated, and subscribers notified.

<details>
<summary>Answer</summary>

Publish "VideoUploaded" to a topic. Subscriptions: a transcoding queue consumed by a large worker fleet (competing consumers, autoscaled on depth), a thumbnail queue with its own workers, and a notification queue (perhaps triggered later by "VideoReady" after transcoding). Each service scales and fails independently.

</details>
