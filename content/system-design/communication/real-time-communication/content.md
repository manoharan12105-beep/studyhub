# Polling, Long Polling, SSE and WebSockets

**Module:** Communication and APIs · **Interview priority:** Frequently asked

## What Is It?

Plain HTTP is **client-initiated**: the server can only answer when asked. Chat messages, notifications, live scores and ride locations need the server to tell the client when something happens. Four techniques exist:

- **Short polling:** the client asks "anything new?" every few seconds.
- **Long polling:** the client asks, and the server holds the request open until there is news (or a timeout), then the client immediately asks again.
- **Server-Sent Events (SSE):** one long-lived HTTP response through which the server streams events to the client. One direction only: server → client.
- **WebSockets:** an HTTP request upgraded into a persistent, full-duplex connection; either side can send messages at any time.

```text
Short polling   C: new? S: no   C: new? S: no   C: new? S: yes(msg)      many empty requests
Long polling    C: new? ............ S: yes(msg)   C: new? ......         one request per event
SSE             C: subscribe ═══ S: event ══ event ══ event ══►           server → client stream
WebSocket       C ◄══════════ messages both ways at any time ══════════► S
```

## Why It Exists

Delay and waste trade off against each other. Polling every second gives fresh data but sends millions of empty requests; polling every minute is cheap but stale. Push techniques deliver updates within milliseconds with no wasted requests — at the cost of holding open connections.

## How It Works

| Technique | Latency of updates | Server cost | Direction | Works through proxies | Typical use |
|-----------|--------------------|-------------|-----------|-----------------------|-------------|
| Short polling | Up to the interval | Many requests, mostly empty | Client pulls | Yes | Infrequent updates, simple dashboards |
| Long polling | Near real-time | One held request per client | Server → client (per request) | Yes | Fallback when others are blocked |
| SSE | Real-time | One open connection per client | Server → client | Yes (plain HTTP) | Notifications, live feeds, progress updates |
| WebSocket | Real-time | One open connection per client | Both ways | Usually (needs upgrade support) | Chat, multiplayer games, collaborative editing |

### What persistent connections change in the design

- **Stateful gateways.** A WebSocket server holds connections, so it is stateful. A **connection registry** (for example in Redis) records which gateway holds each user, so a message for Alan can be routed to the right server.
- **Load balancing.** Connections are long-lived, so balance by **least connections** rather than round robin, and expect uneven load after deployments (all clients reconnect to new servers). See [Load-Balancing Algorithms](../../scaling-and-distribution/load-balancing-algorithms/content.md).
- **Fan-out between servers.** When Bea (on gateway 2) messages Alan (on gateway 7), gateway 2 publishes to a pub/sub channel or a queue that gateway 7 consumes.
- **Reconnects.** Mobile networks drop connections constantly. Clients reconnect with backoff and resume from the last message ID they received, so nothing is missed.
- **Heartbeats.** Idle connections are silently dropped by NATs and proxies; periodic pings keep them alive and detect dead peers.

**Think about it:** a sports site shows live scores to 2 million viewers. Updates happen every few seconds and only flow from server to client. Which technique, and why not WebSockets?

<details>
<summary>Answer</summary>

**Server-Sent Events** (or even short polling against a CDN-cached endpoint every few seconds). Updates are one-way, SSE is plain HTTP so it works through proxies and supports automatic reconnection with `Last-Event-ID`, and nothing needs to flow from viewers to the server. WebSockets would work but add bidirectional machinery nobody uses.

</details>

## When Not to Use

Do not hold persistent connections for data that changes rarely or that users check occasionally (an order status checked twice a day) — a normal request, or a push notification through the mobile OS, is cheaper.

## Common Traps

> [!WARNING]
> **Common trap:** "WebSockets are always better than polling." They cost one open connection per online user, need stateful routing and reconnection logic, and some proxies block them. Choose by update frequency and direction.

## Interview Follow-up

- *"How does a message reach a user connected to a different WebSocket server?"* Look up the user's gateway in a connection registry, then deliver through pub/sub or a queue to that gateway, which pushes it down the socket; if the user is offline, store it and send a push notification.

## Key Takeaways

- Short polling: simple, wasteful or stale. Long polling: near real-time over plain HTTP.
- SSE: one-way server push over HTTP, with built-in reconnection. WebSockets: full-duplex, for chat and collaboration.
- Persistent connections make gateways stateful: you need a connection registry, cross-server fan-out, least-connections balancing, heartbeats and reconnects.
