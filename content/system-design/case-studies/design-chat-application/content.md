# Case Study: Design a Chat Application

**Module:** Case Studies · **Interview priority:** Frequently asked

How to use this case study: a chat app combines almost every topic in this subject — persistent connections, routing between servers, ordering, delivery guarantees, idempotency, storage at scale and presence. Decide each answer before reading on.

## Problem

Design a WhatsApp- or Messenger-like service: users send one-to-one and small-group messages that arrive in real time when the recipient is online, are stored for offline recipients, and appear on all of a user's devices.

## Requirements

**Functional:** one-to-one and group chat (groups up to a few hundred members); real-time delivery to online users; offline delivery when they reconnect, plus a push notification; delivery states (sent, delivered, read); message history on multiple devices; online/last-seen presence.

**Non-functional:**

- Low latency: an online recipient sees a message within a few hundred milliseconds.
- **A message the sender sees as "sent" is never lost.**
- **Order is preserved within a conversation**; no duplicates shown.
- Highly available; tens of millions of concurrent connections.

## Assumptions

- 50 million daily active users, 20 million online at peak.
- 40 messages sent per user per day; ~300 bytes stored per message with metadata.
- Most messages are one-to-one; groups average 20 members.

## Scale Estimation

```text
Messages:   50 M × 40 = 2 billion/day ≈ 23,000/s average, ≈ 70,000/s peak
Storage:    2 B × 300 B = 600 GB/day ≈ 220 TB/year (before replication)
Connections: 20 M concurrent; at ~100,000 connections per gateway server ≈ 200 gateways (+ headroom)
```

**Think about it:** which of these numbers shapes the design most?

<details>
<summary>Answer</summary>

The **20 million persistent connections** — they force stateful gateway servers and routing between them — and the **write rate of tens of thousands of messages per second** with hundreds of terabytes per year, which calls for a horizontally partitioned, write-optimised store. Compute per message is trivial; this is a data- and connection-intensive system.

</details>

## APIs

Messages flow over a persistent **WebSocket** connection ([Real-Time Communication](../../communication/real-time-communication/content.md)); history and management use REST.

```text
WebSocket frames (JSON or a compact binary format)
client → server  {"type":"send","clientMsgId":"c-7f3a","conversationId":"c-991","body":"hi"}
server → client  {"type":"ack","clientMsgId":"c-7f3a","msgId":"m-55102","seq":1042,"ts":…}   ← now "sent"
server → client  {"type":"message","conversationId":"c-991","seq":1042,"from":"bea","body":"hi"}
client → server  {"type":"delivered","conversationId":"c-991","upToSeq":1042}
client → server  {"type":"read","conversationId":"c-991","upToSeq":1042}

REST
GET  /api/v1/conversations/{id}/messages?beforeSeq=1042&limit=50     (history, cursor by sequence)
POST /api/v1/conversations                                            (create group)
```

## Data Model

```text
messages        partition key: conversation_id   clustering: seq DESC
                (seq, msg_id, sender_id, client_msg_id, body, created_at)
conversations   (id, type, members…)          membership: (user_id → conversation_ids) for "my chats"
receipts        (conversation_id, user_id, delivered_up_to_seq, read_up_to_seq)
connections     (user_id/device_id → gateway_id)    in Redis with TTL (ephemeral)
```

The dominant queries are "append a message to a conversation" and "latest N messages of a conversation" — exactly the shape of a **wide-column store** (Cassandra, ScyllaDB) partitioned by conversation ([NoSQL](../../data-and-storage/nosql-databases/content.md)). Users, groups and membership can live in a relational database.

## Basic Architecture

```text
Clients ══WebSocket══► Gateway servers (hold connections) ──► Chat service ──► Message store
                              ▲                                    │
                              └──── connection registry (Redis) ◄──┘
```

**Think about it:** Bea (connected to gateway 2) sends Alan (connected to gateway 7) a message. Trace it.

<details>
<summary>Answer</summary>

1. Gateway 2 receives the frame and passes it to the chat service.
2. The chat service assigns the next sequence number for conversation c-991, **persists** the message, then acks Bea ("sent", single tick).
3. It looks up Alan's devices in the connection registry → gateway 7.
4. It publishes the message to gateway 7 (pub/sub channel or a per-gateway queue); gateway 7 pushes it down Alan's socket.
5. Alan's client acks "delivered"; the receipt flows back to Bea (double tick).
6. If Alan is offline, the message stays stored and a push notification is sent through the phone platform's service; Alan's app fetches missed messages on reconnect.

</details>

## Bottlenecks

Connection capacity per gateway; the message store's write throughput; fan-out for groups; the connection registry (looked up on every message); reconnect storms after gateway deployments or network blips.

## Scaling Strategy

- **Gateways:** horizontally scaled, event-driven I/O, balanced by **least connections**; drained gradually during deployments; clients reconnect with **exponential backoff and jitter** ([Retries](../../reliability/timeouts-retries-and-backoff/content.md)).
- **Chat service:** stateless; messages for a conversation routed by `conversation_id` (for example a partitioned log keyed by conversation) so one writer orders each conversation ([Ordering](../../messaging/message-ordering-and-consumer-groups/content.md)).
- **Groups:** fan-out on write to members' devices for small groups; for very large groups or channels, members pull from the conversation's log (fan-out on read).
- **Message store:** partitioned by conversation ID; time-bucket very long conversations to keep partitions bounded.

## Caching

- Connection registry and presence in Redis (TTLs refreshed by heartbeats).
- Recent messages of active conversations cached for fast "open chat" — though the wide-column store already serves "latest N" efficiently.
- Group membership cached for fan-out.

## Database Strategy

- **Messages:** wide-column store, replication factor 3, quorum writes (W = 2, R = 2) for durability across nodes ([Quorum](../../scaling-and-distribution/quorum-reads-and-writes/content.md)); TTL or archival for old media references.
- **Users, groups, membership:** relational database with replicas.
- **Media** (photos, voice notes) in object storage; messages carry links; delivered via CDN.

## Reliability

### Never lose a "sent" message

Ack the sender **only after the message is durably stored** (quorum write). If the ack is lost, the client resends with the same **client message ID**; the server deduplicates (unique `(conversation_id, client_msg_id)`) — an idempotent send ([Idempotency](../../reliability/idempotency-in-distributed-systems/content.md)).

### Ordering and gaps

Each conversation has an increasing **sequence number** assigned by one writer per conversation. Clients render by sequence, detect **gaps** ("I have 1040, received 1042") and fetch the missing range; on reconnect they send their last seen sequence and receive everything newer. Delivery to devices is at-least-once; sequence numbers make duplicates harmless.

### Presence

Clients send heartbeats every ~30 s; presence is a Redis key with a TTL slightly longer than the interval. Broadcasting every status change to every contact is expensive, so presence updates are throttled and often fetched only when a chat is opened.

## Failure Scenarios

| Scenario | Handling |
|----------|----------|
| Gateway crashes | Its clients reconnect (with jitter) to other gateways; registry entries expire; missed messages fetched by last sequence |
| Recipient offline for days | Messages stored; push notification; sync on reconnect |
| Sender's ack lost | Client resends with the same client message ID; server dedupes |
| Message store node down | Quorum writes and reads continue with RF 3 |
| Network partition between regions | Users keep chatting within regions (AP for delivery); cross-region messages queue and deliver later |

## Trade-offs

- WebSockets vs long polling: real-time and efficient, but stateful gateways and reconnection logic.
- One writer per conversation gives clean ordering but makes that writer a per-conversation bottleneck (fine — one conversation's rate is human-scale).
- Store-then-deliver adds a few milliseconds but guarantees durability.
- Presence accuracy vs cost: throttled, approximate presence.
- End-to-end encryption (awareness): servers then route ciphertext and cannot read, search or moderate content; key management moves to devices.

## Final Architecture

```text
Clients ══WSS══► Load balancer (least connections) ══► Gateways (stateful, ~100k conns each)
                                                          │  ▲
                                         publish/route    │  │ push to device
                                                          ▼  │
            Chat service (stateless; per-conversation ordering via partitioned log keyed by conversation_id)
              ├──► Message store (wide-column, partition = conversation_id, RF 3, quorum)
              ├──► Redis: connection registry, presence, receipts cache
              ├──► Relational DB: users, groups, membership
              ├──► Object storage + CDN: media
              └──► Push notification service (offline users)
```

## What Changes at 10x Scale

Hundreds of millions of concurrent connections across regions: regional gateway clusters with a global routing layer, cross-region message relay, data residency per region, more efficient binary protocols and connection handling, larger-group features (channels) built on fan-out on read, and multi-device sync with per-device sequence tracking.

## Key Takeaways

- Persistent connections make gateways stateful: a connection registry routes messages to the right gateway; clients reconnect with jitter.
- Persist before acknowledging; deduplicate resends by client message ID.
- Per-conversation sequence numbers give ordering, gap detection and resumable sync.
- A wide-column store partitioned by conversation fits the append-and-read-latest pattern; media goes to object storage.
- Small groups fan out on write; very large ones on read; presence is approximate and throttled.
