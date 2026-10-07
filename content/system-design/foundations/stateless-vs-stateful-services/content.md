# Stateless vs Stateful Services

**Module:** Foundations · **Interview priority:** Core

## What Is It?

- A **stateful** server remembers something about a client between requests in its own memory or local disk — a login session, a shopping cart, an uploaded file, an open game.
- A **stateless** server keeps nothing between requests. Each request carries (or points to) everything needed, and any state lives in shared external stores: a database, a cache, object storage, or a signed token held by the client.

## Why It Exists

Scale from one server to ten and users start getting logged out at random. The cause is state kept inside servers:

```text
Stateful (sessions in server memory)          Stateless (shared session store)
Alan ─ login ─► Server 1 (session: alan ✓)     Alan ─► Server 1 ─┐
Alan ─ next  ─► Server 5 ("who are you?") ✗    Alan ─► Server 5 ─┴─► Redis: session alan ✓
                → random logouts                  any server finds the session
```

Stateless servers are **interchangeable**: the load balancer can send any request anywhere, servers can be added or removed at any time, and a crash loses nothing but in-flight requests. That is what makes horizontal scaling, autoscaling and rolling deployments easy.

## How It Works

### Making a service stateless

| State | Where it goes instead |
|-------|----------------------|
| Login sessions | Shared session store (Redis), or a signed token (e.g. a JWT) the client sends with each request |
| Shopping carts, drafts | Database or cache keyed by user ID |
| Uploaded files | Object storage (S3 and similar) |
| In-memory caches | Fine to keep — as long as losing them only costs speed, not correctness |
| Scheduled jobs, locks | A scheduler or a distributed lock, not "whichever server runs this cron" |

Note that storing data **outside** the server does not make the server stateful. A server that writes photos to object storage and rows to a database is still stateless — the state lives in systems designed to keep it.

### Session store vs tokens

- **Server-side sessions in Redis:** the client holds a random session ID; servers look it up. Easy to revoke (delete the key); one extra lookup per request; Redis must be highly available.
- **Signed tokens (JWT):** the client holds a token containing its identity and expiry, signed by the server; any server verifies the signature without a lookup. No shared store needed; revoking before expiry is hard, so keep lifetimes short and use refresh tokens.

### Sticky sessions: a trap

**Sticky sessions** (session affinity) make the load balancer pin a user to the server holding their session. It hides the problem rather than fixing it:

- load becomes uneven — popular users and long sessions pile onto some servers,
- when the pinned server dies or is redeployed, its users are logged out anyway,
- autoscaling down is awkward because servers hold users.

Use them only as a temporary workaround for legacy applications.

### Some services must be stateful

Databases, caches, message brokers, and connection-holding services (WebSocket gateways, game servers) are stateful by nature. The design goal is to **concentrate state in a few components built to manage it** (with replication and failover) and keep everything else stateless.

**Think about it:** a test for any server — "if this server vanished right now, would any user lose anything other than the request in progress?" What does a "yes" tell you?

<details>
<summary>Answer</summary>

That the server holds state that belongs somewhere durable and shared. Find it (sessions, carts, temporary uploads, scheduled tasks) and move it to a database, cache, object storage or token, so servers become disposable.

</details>

## Comparison

| Aspect | Stateless | Stateful |
|--------|-----------|----------|
| Where state lives | External stores / client tokens | Server memory or disk |
| Load balancing | Any server, any request | Must route to the right server |
| Scaling out / in | Trivial | Requires moving or draining state |
| Server crash | Loses only in-flight requests | Loses sessions or data |
| Examples | REST API servers, web front ends | Databases, caches, WebSocket gateways, game servers |

## Common Traps

> [!WARNING]
> **Common trap:** "Our servers use a database, so they are stateful." Statefulness is about what the *server itself* remembers between requests, not whether it talks to a database.

## Interview Follow-up

- *"You scaled from 2 to 5 servers and users get logged out randomly. Why?"* Sessions are stored in each server's memory and the next request lands on a server that has never seen the user. Move sessions to Redis or use signed tokens.

## Key Takeaways

- Stateless servers keep nothing between requests; state lives in shared stores or client tokens.
- Statelessness makes servers interchangeable: easy scaling, autoscaling, deployments and failure recovery.
- Sticky sessions are a workaround with uneven load and lost sessions on failure.
- Keep state in a few components designed for it, and keep the rest stateless.
