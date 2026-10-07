# Functional and Non-Functional Requirements

**Module:** Foundations · **Interview priority:** Core

## What Is It?

- **Functional requirements** describe **what** the system does: the features a user can see and test. "Users can upload a photo." "Users can follow other users."
- **Non-functional requirements (NFRs)** describe **how well** it does them: speed, uptime, durability, security, scale and cost. "The feed loads in under 200 ms." "An uploaded photo is never lost."

A useful test: you can write an acceptance test for a functional requirement by clicking through the app. A non-functional requirement is felt rather than seen, and is checked with measurements.

## Why It Exists

Users never ask for a cache, a replica or a queue. They ask for an app that is fast, never loses their photos and is up on Saturday night. **Every component in an architecture exists to meet a non-functional requirement.** That is why two apps with almost the same feature list — a family photo album and Instagram — need completely different designs: ten patient users versus a billion who leave after two seconds of lag.

Pinning down both kinds of requirement before drawing anything gives each later decision a reason: "I'm adding a cache *because* the feed must load in under 200 ms and reads dominate."

## How It Works

### Example: an online store

| Functional | Non-functional |
|------------|----------------|
| Register and log in | 1 million daily active users |
| Browse, search and filter products | Search responds in < 200 ms at the 99th percentile |
| Add to cart, apply coupons | 99.9 % monthly availability |
| Place an order and pay | No paid order is ever lost |
| Track the order | Payment and personal data encrypted in transit and at rest |
| | Survive 10× normal traffic on sale days |

### The standard quality attributes

| Attribute | Question it answers | Typical way to state it |
|-----------|--------------------|-------------------------|
| **Scalability** | Can it handle growth in users, data and traffic? | "Handle 50k requests/s at peak" |
| **Availability** | What fraction of time does it work? | "99.9 % per month" (see [SLA, SLO, SLI](../sla-slo-sli-and-availability/content.md)) |
| **Reliability / durability** | Does it do the right thing and keep data safe? | "Zero loss of committed orders" |
| **Performance (latency, throughput)** | How fast, how much? | "P99 < 300 ms" (see [Latency Percentiles](../../observability/latency-percentiles/content.md)) |
| **Consistency** | Do all users see the same, latest data? | "Balance reads always reflect the last transfer" |
| **Security** | Who can do what; is data protected? | Authentication, authorisation, encryption |
| **Maintainability / observability** | Can we change and debug it? | Logs, metrics, traces, alerts |
| **Cost** | What does it cost to run? | Budget per month or per user |

### Requirements fight each other

Non-functional requirements trade against one another, which is what makes design interesting:

- **Faster costs more:** more caches, more replicas, servers closer to users.
- **Never down costs more:** standby machines you pay for while they sit idle.
- **Strongly consistent everywhere is slower:** every write must reach several machines before it is acknowledged (see [CAP](../../consistency-and-coordination/cap-theorem/content.md)).
- **More secure can be slower:** encryption, extra checks, extra hops.

So requirements must be **prioritised per feature**: payments need consistency and durability above speed; a like counter can be a few seconds stale.

**Think about it:** a photo app says "uploads may take 2–3 seconds, but the feed must load in under 200 ms". What does that tell you about where to do heavy work?

<details>
<summary>Answer</summary>

Do expensive work (resizing, generating thumbnails, updating followers' feeds) on the **write path**, at upload time or asynchronously afterwards, so that the read path — the feed — only fetches precomputed results. A slow write is acceptable; a slow read is not.

</details>

## When Not to Use

Do not invent non-functional requirements the problem does not have. "Five nines" and "multi-region active-active" for an internal tool with 50 users wastes money and complexity. Ask, then design for the stated numbers with some headroom.

## Common Traps

> [!WARNING]
> **Common trap:** listing NFRs as adjectives — "fast, scalable, secure". Without numbers they cannot guide a decision. "P99 under 200 ms at 20k requests/s" can.

- **"Availability and reliability are the same."** A system can be up (available) and still return wrong data (unreliable).
- **"Non-functional requirements are optional extras."** They are what separates a prototype from a product, and they decide the architecture.

## Interview Follow-up

- *"Give three non-functional requirements for a payment system and how they shape the design."* Durability (synchronous replication, write-ahead logs, backups), consistency (relational database with transactions, idempotency keys), security (encryption, audit logs, least privilege). Latency is relaxed relative to correctness.

## Key Takeaways

- Functional = features (what). Non-functional = qualities (how well), stated with numbers.
- Components exist to meet non-functional requirements; justify every box with one.
- Requirements conflict: speed, availability, consistency and security all cost money or each other. Prioritise per feature.
