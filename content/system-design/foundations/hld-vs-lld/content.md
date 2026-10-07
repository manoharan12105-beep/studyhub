# HLD vs LLD

**Module:** Foundations · **Interview priority:** Core

## What Is It?

Design happens at two altitudes.

- **High-level design (HLD)** is the zoomed-out blueprint: the major components (clients, load balancers, application servers, databases, caches, queues, CDNs), how a request flows between them, where data is stored, and what breaks first as load grows.
- **Low-level design (LLD)** zooms into one component or feature: classes and interfaces, functions, data structures, method signatures and the rules each piece enforces.

```text
HLD   Client → Load balancer → App servers → Cache → Database
                                   │
                                   └→ Queue → Notification workers
LLD   inside "App servers", the like feature:
      LikeService.like(userId, photoId)
        ├─ already liked?  → LikeRepository.exists(userId, photoId)
        ├─ save like       → LikeRepository.save(...)
        └─ update count    → PhotoStats.increment(photoId)   (once per user, never twice)
```

## Why It Exists

Both are needed, but they answer different questions. HLD decides whether the system *can* meet its scale, latency and availability goals. LLD decides whether a component is correct, readable and easy to change. Mixing them up wastes interview time: talking about class hierarchies when asked to design Instagram, or about load balancers when asked to design an in-memory cache, misses the question.

## How It Works

### Recognising the altitude

| Interview prompt | Altitude | Talk about |
|------------------|----------|------------|
| Design Instagram / a URL shortener / a chat app | HLD | Requirements, estimates, APIs, data model, components, scaling, failures, trade-offs |
| Design the like feature's logic | LLD | Classes, functions, validation rules, data structures |
| Design an in-memory LRU cache | LLD | Hash map + doubly linked list, class API, complexity, thread safety |
| Design a parking lot | LLD (object-oriented design) | Entities, responsibilities, relationships, patterns |
| Design a rate limiter | Either; ask | HLD: where it sits, shared counters in Redis. LLD: the token-bucket class |

### Moving between altitudes

A good HLD answer still dips into detail where the detail decides the design: the shard key, the cache key format, the ID-generation scheme. A good LLD answer still mentions the system around it: "this cache will be shared by several threads, so methods must be synchronised".

> [!TIP]
> Say your altitude out loud in the first minute: "I'll stay at the high level — components, data flow and trade-offs — and we can zoom into any component later." Interviewers rarely stop a candidate who is at the wrong altitude; they just let the time run out.

## Comparison

| Aspect | HLD | LLD |
|--------|-----|-----|
| Unit of design | Services, stores, network paths | Classes, methods, data structures |
| Main questions | Where does data live? What scales? What fails? | Is this correct? Is it easy to extend? |
| Typical artefact | Box-and-arrow architecture diagram | Class diagram, interfaces, code |
| Quality focus | Scalability, availability, latency, cost | Correctness, cohesion, coupling, readability |
| Typical mistakes | Components without reasons, no failure analysis | God classes, ignoring concurrency and edge cases |

## Common Traps

> [!WARNING]
> **Common trap:** starting "Design Twitter" by listing Java classes. Classes appear only if the interviewer asks you to zoom into one service.

- **"HLD is easier because it has no code."** HLD answers must still be precise: numbers, keys, failure behaviour.
- **"LLD ignores the system."** Concurrency, persistence and failure handling are LLD concerns too.

## Interview Follow-up

- *"Which altitude is 'design a notification service'?"* HLD by default; confirm by asking whether they want the service architecture or the class design of the sender.

## Key Takeaways

- HLD: components, data flow, scale, failures and trade-offs. LLD: classes, functions and data structures of one part.
- Identify the altitude from the prompt and state it before you start.
- Zoom in only where a detail decides the design.
