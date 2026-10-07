# Clarifying Requirements

**Module:** Foundations · **Interview priority:** Core

## What Is It?

**Requirement clarification** is the first few minutes of any design: asking questions until you know what to build, for whom, at what scale, and which qualities matter most. A design prompt such as "Design a photo-sharing app" is deliberately vague; the answers you collect become the pillars every later decision rests on.

## Why It Exists

Two designs for the same prompt can both be correct for different requirements. Without clarification you either over-build (paying for scale nobody needs) or under-build (a design that collapses at the real load). In interviews, the first five minutes are watched closely: does the candidate start drawing boxes, or ask questions that will justify the boxes?

## How It Works

### The five questions to ask first

| # | Question | Photo-app answer | Design consequence |
|---|----------|------------------|--------------------|
| 1 | How many users, and how fast is it growing? | 10,000 today, doubling every few months | Design for millions; plan to scale out |
| 2 | Is it read-heavy or write-heavy? | People scroll thousands of photos, post a few a month | Invest in the read path: caches, precomputed feeds, CDN |
| 3 | What must never be lost? | Photos never; like counts may be off for a few seconds | Strong durability for photos only; counters can be approximate |
| 4 | How much latency is acceptable, and where? | Feed under 200 ms; upload can take 2–3 s | Heavy work at upload time or asynchronously |
| 5 | What can it cost? | Keep the bill reasonable | Fewest components that meet 1–4 |

### Narrow the functional scope

Real products have hundreds of features. Agree on the three to five that matter for this conversation and say what is out of scope:

```text
In scope:   upload photo, follow user, home feed, like, comment
Out of scope: stories, direct messages, ads, search, recommendations
```

### Questions that often change the design

- **Who are the clients?** Mobile apps (flaky networks, battery) vs browsers vs other services.
- **Global or one region?** Global users push you toward CDNs and multi-region data.
- **Consistency needs per feature.** "Must a user see their own post immediately?" (read-your-writes).
- **Data retention.** Keep everything forever, or expire after 30 days?
- **Peaks.** Sale days, live events and time zones create 3–10× bursts.
- **Existing constraints.** Must it use the company's existing database or cloud?

### Write the answers down

Keep a short list visible (on the whiteboard or shared document). Later you will point back at it: "I'm adding a read replica because we said reads outnumber writes 100 to 1."

**Think about it:** the interviewer answers "you decide" to "how many users?". What do you do?

<details>
<summary>Answer</summary>

State an assumption and its consequence, and move on: "I'll assume 10 million daily active users, which puts reads in the tens of thousands per second at peak, so I'll design for horizontal scaling. If it's much smaller, I'd simplify." Assumptions are fine as long as they are explicit and the design follows from them.

</details>

## What Can Fail

- **Asking forever.** Clarification should take about five minutes of a 45-minute interview. Ask what changes the design; assume the rest.
- **Asking without using the answers.** If the read/write ratio never appears in your reasoning, the question was wasted.

## Common Traps

> [!WARNING]
> **Common trap:** jumping straight to "We'll use microservices and Kafka" before knowing the scale. Technology choices with no requirement behind them are the most common reason designs are judged weak.

## Interview Follow-up

- *"Why ask whether the system is read-heavy?"* Because it decides where effort goes: read-heavy systems invest in caches, replicas and precomputation; write-heavy systems in partitioning, append-only storage and queues.

## Key Takeaways

- Ask before drawing: users and growth, read/write mix, what can never be lost, latency per path, cost.
- Narrow the scope to a few core features and say what is out of scope.
- When an answer is missing, state an assumption and its consequence.
- Write the answers down and justify later decisions with them.
