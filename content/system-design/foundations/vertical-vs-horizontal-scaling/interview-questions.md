# Vertical vs Horizontal Scaling — Interview Questions

## Beginner

### Q1. What is the difference between vertical and horizontal scaling?

**Style:** Comparison

<details>
<summary>Answer</summary>

Vertical scaling adds resources (CPU, RAM, disk, network) to one machine. Horizontal scaling adds more machines and distributes the load across them. Vertical is simple but limited and leaves a single point of failure; horizontal has no practical ceiling and adds redundancy but needs load balancing and shared state.

</details>

### Q2. Your app is slow. Why not just buy a bigger server?

**Style:** Why not

<details>
<summary>Answer</summary>

You can, and often should first — it needs no code change. But vertical scaling has a hard ceiling (the largest machine), becomes disproportionately expensive near the top, usually requires a restart, and the machine remains a single point of failure. Beyond that point you must scale horizontally.

</details>

## Intermediate

### Q3. What new problems does horizontal scaling create?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Routing traffic across servers (a load balancer, which itself needs redundancy), keeping servers stateless (sessions and uploads moved to shared stores), shared data access (one database becomes the bottleneck, leading to caching, replication and sharding), consistency between copies, and more complex deployment and monitoring.

</details>

### Q4. Why is the database usually the hardest component to scale horizontally?

**Style:** Why

<details>
<summary>Answer</summary>

Application servers can be identical, interchangeable copies. A database holds state that must stay correct: copies must be kept in sync (replication lag, conflicts) and splitting data (sharding) breaks joins and transactions across shards and needs a shard key. So teams scale the database vertically as long as possible, add read replicas, and shard last.

</details>

### Q5. What is autoscaling and which scaling direction does it rely on?

**Style:** Direct

<details>
<summary>Answer</summary>

Automatically adding or removing instances based on metrics such as CPU, request rate or queue depth. It relies on horizontal scaling of stateless instances behind a load balancer, so capacity can follow daily and seasonal load and cost drops during quiet periods.

</details>

## Advanced

### Q6. A team scaled from 1 to 4 app servers but throughput barely improved. What might be wrong?

**Style:** Debugging

<details>
<summary>Answer</summary>

The bottleneck is elsewhere: most likely the shared database (CPU, locks, connection limit — four servers with large connection pools may even exhaust it), a shared cache or downstream service, sticky sessions concentrating load on one server, or a global lock. Measure each tier; scaling a tier that is not the bottleneck does not raise throughput.

</details>

### Q7. Why do large systems typically use both kinds of scaling?

**Style:** Design

<details>
<summary>Answer</summary>

Different tiers have different properties. Stateless application servers scale out cheaply and gain redundancy. Data stores are scaled up first (fewer, larger nodes simplify consistency), then scaled out with replicas and shards when needed. Even scaled-out nodes are sized vertically to the most cost-effective machine type.

</details>
