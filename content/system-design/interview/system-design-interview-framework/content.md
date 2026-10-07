# The System Design Interview Framework

**Module:** Interview Preparation · **Interview priority:** Core

## What Is It?

A repeatable, fourteen-step flow for any "Design X" interview question. It is not a script to recite or a diagram to memorise; it is an order of **reasoning** that makes sure you cover what interviewers assess — requirements, numbers, data, architecture, scaling, reliability and trade-offs — and that every component you draw has a reason.

## Why It Matters

Most candidates who struggle do not lack knowledge; they jump to a memorised architecture, forget to ask about scale, spend 20 minutes on one box, or never mention failures. Interviewers grade the **process** and the **trade-offs** you state out loud. A framework keeps you moving, shows structured thinking, and lets the interviewer steer you to the parts they care about.

## Core Concept

### The flow at a glance (45-minute interview)

| # | Step | Time | Output |
|---|------|------|--------|
| 1 | Clarify requirements | 3–5 min | Scope agreed |
| 2 | Functional requirements | (with 1) | 3–5 core features |
| 3 | Non-functional requirements | (with 1) | Numbers: scale, latency, availability, consistency |
| 4 | Estimate scale | 3–5 min | RPS, peak, storage, bandwidth |
| 5 | Define APIs | 3 min | Main endpoints |
| 6 | Design the data model | 3–5 min | Entities, keys, access patterns |
| 7 | Draw the high-level architecture | 5 min | Simplest design that works |
| 8 | Choose database and storage | (with 6–7) | Store per data type, with reasons |
| 9 | Add caching | 3 min | What, where, TTL/invalidation |
| 10 | Scale it | 5 min | Load balancing, replicas, shards, queues |
| 11 | Make it reliable | 3–5 min | Redundancy, failover, retries, degradation |
| 12 | Identify bottlenecks | 3 min | What breaks first and the fix |
| 13 | Discuss trade-offs | throughout | Alternatives and why not |
| 14 | Future improvements | 2 min | 10× scale, features, operations |

### Each step, and what to say

**1. Clarify requirements.** Ask before drawing ([Clarifying Requirements](../../foundations/clarifying-requirements/content.md)).
> "Before I design anything, can I ask a few questions about scope and scale?"

**2. Functional requirements.** List the few features in scope and name what is out of scope.
> "I'll focus on shortening, redirecting and basic click stats; user accounts and custom domains are out of scope unless you'd like them."

**3. Non-functional requirements.** Put numbers on qualities and rank them ([Requirements](../../foundations/functional-and-non-functional-requirements/content.md)).
> "Redirects must be fast and highly available — that matters more than strong consistency on click counts."

**4. Estimate scale.** Round numbers, then a conclusion ([Estimation](../../foundations/back-of-the-envelope-estimation/content.md)).
> "About 40 writes and 4,000 reads per second, 6 TB over ten years — so writes are easy; the work is in the read path."

**5. APIs.** A handful of endpoints with methods, key parameters and responses ([REST API Design](../../communication/rest-api-design/content.md)).

**6. Data model.** Entities, keys and the access pattern each serves ([Data Modeling](../../data-and-storage/data-modeling-and-access-patterns/content.md)).
> "The hot path is a lookup by short code, so the code is the primary key."

**7. High-level architecture.** Start with the simplest thing that works; say why it is fine for now.
> "Client, load balancer, stateless app servers, one database. Then I'll scale it based on the numbers."

**8. Database and storage.** Choose per data type with reasons and what you give up ([Choosing a Database](../../data-and-storage/choosing-a-database/content.md)).

**9. Caching.** What to cache, where, how it stays fresh ([Caching](../../caching/caching-fundamentals/content.md)).
> "I'm adding a cache because reads outnumber writes 100 to 1 and links never change."

**10. Scaling.** Walk through the components the numbers require — load balancer, replicas, partitioning, queues, CDN — one reason at a time.

**11. Reliability.** Remove single points of failure, plan failover, timeouts and retries, and graceful degradation ([Failures](../../reliability/failures-and-single-points-of-failure/content.md)).
> "If the primary database fails, redirects still work from the cache and replicas; only link creation pauses until failover."

**12. Bottlenecks.** Say what breaks first as load grows and how you would detect and fix it.

**13. Trade-offs.** For each major decision: the alternative, and why not. Mention the trap answer before the interviewer does.
> "I chose 302 over 301 so every click reaches us for analytics, at the cost of more traffic."

**14. Future improvements.** 10× scale, multi-region, new features, monitoring.

### How to communicate

- **Think out loud.** Silence hides your reasoning, which is what is being assessed.
- **Check in** at transitions: "Does this level of detail work, or should I go deeper into storage?"
- **Tie decisions to requirements:** "because we said…".
- **Use numbers** whenever possible.
- **Admit trade-offs and unknowns:** "I'd measure this before deciding" is a strong answer.
- **Draw incrementally;** don't erase and restart.
- **Let the interviewer steer:** if they push on one area, go deep there; the framework is a default path, not a cage.

### Common mistakes

| Mistake | Better |
|---------|--------|
| Drawing a memorised architecture immediately | Requirements and numbers first |
| Components with no reason ("and Kafka") | Every box answers a requirement |
| One area for 20 minutes | Time-box; offer to go deeper later |
| Ignoring failures | Name single points of failure and failover |
| "It depends" without deciding | Decide, state the condition that would change your mind |
| Never quantifying | Estimate, and use the estimate |

## Practice Run: Design a URL Shortener

The simulator below walks the whole flow on a classic prompt. At each step, choose what you would say or decide; wrong choices are explained, right ones show the consequence and what the interviewer is likely to ask next. The full written design is in [Case Study: URL Shortener](../../case-studies/design-url-shortener/content.md).

## Key Takeaways

- Requirements → estimates → APIs → data → simple architecture → storage → caching → scaling → reliability → bottlenecks → trade-offs → future work.
- Say your reasoning out loud and tie every component to a requirement or a number.
- Start simple, then scale one failure or requirement at a time.
- Name trade-offs and failure modes yourself; let the interviewer steer the depth.
