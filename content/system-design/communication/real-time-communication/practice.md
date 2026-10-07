# Polling, Long Polling, SSE and WebSockets — Practice

### P1. Bidirectional

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** WebSockets

Which technique lets both client and server send messages at any time on one connection?

- A) Short polling
- B) Long polling
- C) Server-Sent Events
- D) WebSockets

<details>
<summary>Answer</summary>

**Answer:** D) WebSockets

</details>

### P2. Wasted requests

**Difficulty:** Medium · **Type:** Estimation · **Concepts:** polling cost

1 million clients poll every 5 seconds for notifications; on average each client receives 10 notifications per day. How many requests per second does polling generate, and what fraction return something new?

<details>
<summary>Answer</summary>

1,000,000 ÷ 5 = **200,000 requests/s**. Per client per day: 86,400 ÷ 5 = 17,280 polls for 10 notifications, so about 10 ÷ 17,280 ≈ **0.06 %** return news. Push (SSE/WebSockets) or long polling would remove almost all of that load.

</details>

### P3. Choose the technique

**Difficulty:** Medium · **Type:** Design · **Concepts:** technique selection

Choose one: (a) collaborative document editing, (b) a CI build page showing progress, (c) an order-status page users refresh occasionally, (d) a multiplayer game.

<details>
<summary>Answer</summary>

(a) WebSockets, (b) Server-Sent Events, (c) a normal request (or short polling at a slow interval), (d) WebSockets (or UDP-based protocols for fast-paced games).

</details>

### P4. Cross-server delivery

**Difficulty:** Hard · **Type:** Design · **Concepts:** connection registry

Alan is connected to gateway 7, Bea to gateway 2. Bea sends Alan a message. Describe the path.

<details>
<summary>Answer</summary>

Gateway 2 receives the message, the chat service stores it (with a sequence number) and looks up Alan's gateway in the connection registry (gateway 7). It publishes the message to gateway 7's channel (pub/sub or a queue); gateway 7 pushes it down Alan's WebSocket, and Alan's client acknowledges. If Alan were offline, the message stays stored and a mobile push notification is sent.

</details>
