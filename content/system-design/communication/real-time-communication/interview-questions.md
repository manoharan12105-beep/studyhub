# Polling, Long Polling, SSE and WebSockets — Interview Questions

## Beginner

### Q1. Why can't plain HTTP push messages to a client?

**Style:** Why

<details>
<summary>Answer</summary>

HTTP is request–response and client-initiated: the server responds only to a request the client sent. Without an outstanding request or an open stream, the server has no channel to send data, so real-time features need polling, long polling, SSE or WebSockets.

</details>

### Q2. What is the difference between short polling and long polling?

**Style:** Comparison

<details>
<summary>Answer</summary>

Short polling sends requests at fixed intervals and gets an immediate answer, often "nothing new", wasting requests or delaying updates up to the interval. Long polling sends a request that the server holds open until an update is available or a timeout passes; the client then immediately re-polls, so updates arrive almost instantly with far fewer empty responses.

</details>

## Intermediate

### Q3. SSE vs WebSockets — when would you choose each?

**Style:** Comparison

<details>
<summary>Answer</summary>

SSE streams events one way, server to client, over ordinary HTTP with built-in reconnection and event IDs — good for notifications, live scores, progress and feeds. WebSockets provide a full-duplex channel where both sides send at any time — needed for chat, games and collaborative editing. If the client rarely sends data, SSE plus normal HTTP requests is simpler.

</details>

### Q4. Why are WebSocket servers harder to scale than REST servers?

**Style:** Why

<details>
<summary>Answer</summary>

They hold long-lived connections, so they are stateful: messages must reach the specific server holding the recipient's connection (requiring a connection registry and cross-server pub/sub), load balancing must consider connection counts, deployments disconnect clients en masse, and each server needs resources for many idle connections plus heartbeats.

</details>

### Q5. Which load-balancing algorithm suits WebSocket connections?

**Style:** Direct

<details>
<summary>Answer</summary>

Least connections, because connections last minutes or hours and differ in duration; round robin would spread new connections evenly but ignore how many each server already holds, creating imbalance over time.

</details>

## Advanced

### Q6. A user's phone loses its connection for 30 seconds. How do you make sure they don't miss messages?

**Style:** Design

<details>
<summary>Answer</summary>

Persist messages before delivery, give each one a per-conversation sequence number, and have the client remember the last sequence it received. On reconnect (with exponential backoff and jitter) the client sends that number, and the server replays everything newer. SSE supports this natively with `Last-Event-ID`. Delivery acknowledgements let the server know what was actually received.

</details>

### Q7. After a deployment, all WebSocket clients reconnect at once and overload the new servers. How do you prevent it?

**Style:** What happens if

<details>
<summary>Answer</summary>

Roll deployments gradually and drain servers slowly (close connections over minutes rather than all at once), make clients reconnect with randomised exponential backoff (jitter) so reconnections spread out, warm up new capacity before shifting traffic, and rate-limit connection attempts per server.

</details>
