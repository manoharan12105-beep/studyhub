# The System Design Interview Framework — Interview Questions

These are questions about **how you approach** a system design interview — interviewers sometimes ask them directly, and they are worth rehearsing aloud.

## Beginner

### Q1. How do you start a system design interview?

**Style:** How

<details>
<summary>Answer</summary>

By clarifying requirements rather than drawing: confirm the core features in scope, the scale (users, growth), the read/write mix, latency and availability targets, what data must never be lost, and constraints. I state assumptions where answers are missing, then estimate scale before designing.

</details>

### Q2. Why estimate numbers in a design interview?

**Style:** Why

<details>
<summary>Answer</summary>

Because numbers decide the architecture: whether one database handles the writes, whether a cache or CDN is needed, whether data must be sharded, how many servers are required. Estimates also show quantitative reasoning, and I always finish each estimate with what it implies for the design.

</details>

### Q3. How much time would you spend on each part of a 45-minute interview?

**Style:** Direct

<details>
<summary>Answer</summary>

Roughly: 5 minutes on requirements, 5 on estimation, 5 on APIs and data model, 5–10 on the high-level design, 10–15 on deep dives (scaling, caching, storage, the hardest component), and 5 on reliability, bottlenecks, trade-offs and future improvements — adjusting to where the interviewer wants depth.

</details>

## Intermediate

### Q4. The interviewer says "just design it". Should you still ask questions?

**Style:** Scenario

<details>
<summary>Answer</summary>

Yes, briefly — or state assumptions explicitly: "I'll assume 10 million daily users and a read-heavy workload; tell me if that's off." The design depends on scale and priorities, and stating assumptions shows that I know it does, without stalling.

</details>

### Q5. How do you justify adding a component?

**Style:** How

<details>
<summary>Answer</summary>

Link it to a requirement or estimate and name its cost: "Reads are 100× writes and the target is under 50 ms, so I'll add a Redis cache in front of the database; the cost is possible staleness, which is acceptable because links rarely change, and I'll invalidate on delete."

</details>

### Q6. What do interviewers mean by "trade-offs", and how do you show them?

**Style:** Direct

<details>
<summary>Answer</summary>

Every choice gives something up — latency vs consistency, cost vs availability, simplicity vs scalability. I show them by naming the alternative I didn't choose, why, what my choice costs, and under what conditions I would switch: "Fan-out on write makes feeds fast but celebrities' posts are expensive, so I'd use a hybrid."

</details>

### Q7. What would you do if you don't know a specific technology the interviewer mentions?

**Style:** Scenario

<details>
<summary>Answer</summary>

Say so honestly, then reason from fundamentals: describe the properties I'd need (for example "a durable, partitioned log with consumer groups") and how a component with those properties would fit, or ask a quick clarifying question about what it provides. Interviewers value reasoning over brand names.

</details>

### Q8. How do you handle a requirement change halfway through the interview?

**Style:** Scenario

<details>
<summary>Answer</summary>

Restate the new requirement, identify which earlier decisions it affects (for example strong consistency now required for payments), adjust those parts explicitly — keeping the rest — and explain the new trade-off. Changing requirements is often deliberate, to see whether the design reasoning is connected to requirements.

</details>

## Advanced

### Q9. How do you identify bottlenecks in your own design?

**Style:** How

<details>
<summary>Answer</summary>

Walk the request path with the estimated load: compare each component's expected load to its capacity (database writes, connection limits, cache memory, bandwidth), look for shared or single components (one primary, one partition, a hot key), and ask what happens at 10× load and when each component fails. Then propose the fix and how I would detect the problem in production (metrics, alerts).

</details>

### Q10. What are the most common mistakes in system design interviews?

**Style:** Trap

<details>
<summary>Answer</summary>

Jumping into a memorised architecture without requirements; adding components without reasons; not estimating, or estimating and never using the numbers; going deep on one box and running out of time; ignoring failure modes and single points of failure; saying "it depends" without deciding; and choosing technologies by popularity ("NoSQL because it scales").

</details>

### Q11. How do you end a system design interview well?

**Style:** How

<details>
<summary>Answer</summary>

Summarise the design in a few sentences tied to the requirements, list the main trade-offs and known weaknesses, explain what would change at 10× scale, and mention operations — what I'd monitor and alert on. It shows ownership of the design rather than just a drawing.

</details>

### Q12. The interviewer keeps pushing on one component. What does that signal?

**Style:** Follow-up

<details>
<summary>Answer</summary>

That they want depth there — often because it's the hardest part of the problem (the feed, ID generation, consistency of payments) or because an answer was vague. Go deep: data structures, failure modes, numbers, alternatives. The framework is a default path; following the interviewer's lead matters more.

</details>
