# Clarifying Requirements — Interview Questions

## Beginner

### Q1. What questions do you ask before starting a system design?

**Style:** Direct

<details>
<summary>Answer</summary>

How many users and how fast they grow; whether traffic is read-heavy or write-heavy; what data must never be lost and what can be approximate; latency targets for the main paths; global or regional users; peak patterns; and cost or technology constraints. Also which features are in scope.

</details>

### Q2. Why does the read/write ratio matter so much?

**Style:** Why

<details>
<summary>Answer</summary>

It tells you where to invest. Read-heavy systems (feeds, catalogues, URL redirects) benefit from caching, read replicas, CDNs and precomputing results on write. Write-heavy systems (logging, metrics, chat ingestion) need partitioned writes, append-friendly storage and queues to absorb bursts. Optimising the wrong path adds cost without fixing latency.

</details>

## Intermediate

### Q3. The interviewer won't give numbers. How do you proceed?

**Style:** Scenario

<details>
<summary>Answer</summary>

State reasonable assumptions explicitly ("assume 10 M daily active users, 10 reads per write"), derive the consequences from them, and tell the interviewer how the design would change if the numbers were very different. Explicit assumptions are as good as given numbers for showing reasoning.

</details>

### Q4. Why should you narrow the feature scope early?

**Style:** Why

<details>
<summary>Answer</summary>

A 45-minute interview cannot cover a whole product. Agreeing on three to five core features lets you go deep on the parts that drive the architecture (for Instagram, upload and feed) instead of listing shallow boxes for everything. Saying what is out of scope also shows judgement.

</details>

### Q5. Give an example where asking "what can never be lost?" changes the design.

**Style:** Scenario

<details>
<summary>Answer</summary>

In a social app, photos must never be lost, so they go to replicated object storage with backups, and the upload is acknowledged only after the file is durably stored. Like counts can be off for a few seconds, so they can be incremented asynchronously, cached and even rebuilt from the likes table. Without the question you might pay for strong guarantees everywhere or, worse, nowhere.

</details>

## Advanced

### Q6. How much time should clarification take, and how do you avoid it becoming a stall?

**Style:** How

<details>
<summary>Answer</summary>

About five minutes. Ask only questions whose answers change the design (scale, read/write mix, durability, latency, scope), group them, and state assumptions for the rest. Write the answers down and move to estimation and APIs, returning to a requirement only when a decision depends on it.

</details>
