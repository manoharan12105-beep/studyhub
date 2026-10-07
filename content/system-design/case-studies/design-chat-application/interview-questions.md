# Case Study: Design a Chat Application — Interview Questions

## Beginner

### Q1. Why does a chat app use WebSockets rather than plain HTTP requests?

**Style:** Why

<details>
<summary>Answer</summary>

Messages must be pushed to recipients the moment they arrive. Plain HTTP is client-initiated, so the client would have to poll constantly (wasteful and slow). A WebSocket keeps a bidirectional connection open so the server can push messages, receipts and presence instantly with little overhead per message.

</details>

### Q2. How does a message reach a recipient connected to a different server?

**Style:** How

<details>
<summary>Answer</summary>

The chat service looks up the recipient's current gateway (and devices) in a connection registry, typically Redis, then routes the message to that gateway through pub/sub or a per-gateway queue; the gateway pushes it down the recipient's WebSocket. If the recipient is offline, the message stays stored and a push notification is sent.

</details>

## Intermediate

### Q3. How do you guarantee a message is not lost once the sender sees it as sent?

**Style:** Design

<details>
<summary>Answer</summary>

Acknowledge the sender only after the message is durably written (for example a quorum write to a replicated store). If the acknowledgement is lost, the client resends with the same client-generated message ID, and the server deduplicates on it, so retries never create duplicates.

</details>

### Q4. How do you keep messages in order within a conversation?

**Style:** How

<details>
<summary>Answer</summary>

Assign a monotonically increasing sequence number per conversation from a single writer (route all messages of a conversation to one partition or owner), store messages clustered by that sequence, and have clients display by sequence. Clients detect gaps and fetch missing ranges, and resume from their last sequence after reconnecting.

</details>

### Q5. Which database would you use for messages, and why?

**Style:** Trade-off

<details>
<summary>Answer</summary>

A wide-column store such as Cassandra or ScyllaDB, partitioned by conversation ID and clustered by sequence/time: the dominant operations are appending messages and reading the latest N for one conversation, at tens of thousands of writes per second and hundreds of terabytes per year, which these stores handle with horizontal scaling and tunable replication. Relational storage remains a good fit for users and group membership.

</details>

### Q6. How would you implement online presence?

**Style:** Design

<details>
<summary>Answer</summary>

Clients send heartbeats periodically; each heartbeat refreshes a Redis key with a TTL slightly longer than the interval, so a user appears offline shortly after heartbeats stop. "Last seen" is stored on disconnect or expiry. Broadcast changes only to contacts who are viewing that user (or throttle broadcasts), because pushing every change to every contact is very expensive.

</details>

## Advanced

### Q7. How do group messages differ from one-to-one at scale?

**Style:** Trade-off

<details>
<summary>Answer</summary>

A group message must reach every member's devices. For small groups, fan out on write: store once, then push to each online member's gateway and track per-member receipts. For very large groups or channels, fanning out to every member per message is too expensive, so members pull new messages from the conversation's log when they open it (fan-out on read), with notifications batched or summarised.

</details>

### Q8. A gateway deployment disconnects 2 million clients at once. What happens and how do you prevent damage?

**Style:** What happens if

<details>
<summary>Answer</summary>

All clients try to reconnect immediately, overwhelming the remaining gateways, the load balancer and the authentication service (a reconnect storm), and then all fetch missed messages. Prevent it with gradual, rolling drains of gateways, client reconnection using exponential backoff with jitter, connection rate limits per gateway, spare capacity before deployments, and efficient resume using last-seen sequence numbers.

</details>
