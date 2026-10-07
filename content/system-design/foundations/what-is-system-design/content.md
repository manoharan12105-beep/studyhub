# What Is System Design?

**Module:** Foundations · **Interview priority:** Core

## What Is It?

A **system** is a set of components working together toward a common goal. A banking app's goal is "move money correctly"; its components are phone apps, servers, databases, caches, queues and the network between them.

**System design** is choosing those components, deciding where each one lives, and deciding how they talk to each other, so that the system keeps meeting its goal as users, data and failures grow.

The code for "transfer money" can be identical in an app with 10 users and one with 10 million. What changes is everything around the code: how many servers run it, where the data lives, what happens when a machine dies, and how fast the answer comes back.

## Why It Exists

A program that works on your laptop answers one person at a time and never loses its disk. A real service must:

- answer **many users at the same time** (millions for WhatsApp, YouTube, Instagram or Amazon),
- stay **fast** when data grows from megabytes to petabytes,
- keep working when **machines, networks and people fail**,
- do all of this at a **cost** the business can afford.

No single component achieves all four. System design is the discipline of combining components so the whole does.

## How It Works

### The bank-counter story

The clearest way to see system design is to watch a bank grow. Every step below is a real design move.

```text
Day 1     one counter, one cashier            10 min per customer → 6 customers/hour
Fix 1     train the cashier                    5 min per customer   (better code)
Fix 2     bigger desk, cash-counting machine   3 min per customer   (vertical scaling)
Problem   the 10th person in line waits 27 minutes
Fix 3     open a second counter                                     (horizontal scaling)
Problem   each counter keeps its own ledger → records disagree
Fix 4     one shared ledger                                         (central database)
Problem   everyone queues at counter 1 by the door; counter 2 idles
Fix 5     a greeter sends each customer to the freer counter,
          and away from a counter that has closed                   (load balancer + health checks)
```

Why 27 minutes: at 3 minutes each, the 10th person waits for the 9 people ahead of them (27 minutes) before their own turn starts.

| Bank | System |
|------|--------|
| Customer | Request |
| Queue | Traffic |
| Counter | Server |
| Cashier | Application code |
| Ledger | Database |
| Greeter | Load balancer |

Two lessons hide in the story:

1. **Every fix creates a new problem.** A second counter fixed waiting but broke the records; a shared ledger fixed the records but left the load uneven. Real systems behave the same way.
2. **The order matters.** Make the work cheaper first, then make the machine bigger, and only then add machines, because adding machines is the step that brings new problems.

### The $10 server and its three failures

Most products should start on **one cheap server** that runs the web application, the database and the uploaded files. It is easy to build, easy to debug, and cheap. Then the product gets featured somewhere and 10,000 people arrive in a day.

| Failure | Symptom | Design response |
|---------|---------|-----------------|
| CPU and memory run out | Pages go from 200 ms to 10 s | More servers behind a **load balancer** |
| The database is overloaded | Everyone asks for the same trending items | Keep popular answers in memory: a **cache** |
| The machine dies | A disk fails; the app is down and files may be gone | Remove the **single point of failure**: a database **replica**, files in **object storage** |

Notice that the application code barely changed. What changed was **where each piece lives** and **what each choice costs**.

**Think about it:** the team adds a load balancer, a cache and a replica. Name one new way the system can now fail that it could not fail before.

<details>
<summary>Answer</summary>

Any of these: the load balancer itself can fail (it is now a single point of failure unless it is redundant); the cache can serve stale data after the database changes; the replica can lag behind the primary, so a user reads old data. Every component removes one risk and adds another, which is why designs are discussed as trade-offs.

</details>

### What a design decision looks like

Every decision has the same shape:

```text
requirement  →  option A vs option B  →  choose  →  name the cost  →  name what can fail
"feed < 200 ms"   query DB each time vs cache    cache    stale data for up to 30 s    cache node dies → DB load spikes
```

Interviewers care far more about this reasoning than about the final diagram.

## Comparison

| Role | What they are handed | What they decide |
|------|----------------------|------------------|
| Junior engineer | A defined feature: known input, known output | How to implement it well |
| Mid-level / senior engineer | A problem | The approach, and how it fits the existing system |
| Senior / staff engineer | A business goal | The system: components, technologies and trade-offs |

System design questions appear in interviews because they test the third kind of thinking.

## Common Traps

> [!WARNING]
> **Common trap:** "System design means drawing the biggest architecture you know." A design is good when every component is there for a stated reason. Extra components add cost, latency and new failure modes.

- **"Scaling means adding servers."** Adding servers is usually the *third* move, after making the work cheaper and the machine bigger.
- **"A good design has no weaknesses."** Every design has failure modes; a strong answer names them.

## Interview Follow-up

- *"What is system design?"* Choosing components and how they connect so a system meets its functional goal and its quality goals (scale, speed, availability, cost) as it grows.
- *"What is a single point of failure?"* One component whose failure takes the whole system down, such as a single server holding the app, database and files.

## Key Takeaways

- A system is components plus a common goal; system design chooses and arranges the components.
- The same code must keep working at 10 users and 10 million; design decides how.
- Scale in order: cheaper work, bigger machine, more machines (with a shared database and a load balancer).
- Every fix creates a new problem. Name the cost and the failure mode of every choice.
