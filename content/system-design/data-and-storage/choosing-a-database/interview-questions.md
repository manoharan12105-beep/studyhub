# Choosing a Database — Interview Questions

## Beginner

### Q1. How do you decide between SQL and NoSQL?

**Style:** How

<details>
<summary>Answer</summary>

From the requirements, not from labels: the access patterns (joins and ad-hoc queries favour SQL; key or partition lookups at huge volume favour NoSQL), how related the data is, whether multi-record changes must be atomic and reads strongly consistent, the read/write volume and data size, how variable the schema is, latency needs, and what the team can operate. Then state what the choice gives up.

</details>

### Q2. Why is "SQL for structured, NoSQL for unstructured" an incomplete rule?

**Style:** Trap

<details>
<summary>Answer</summary>

Structure is only one factor. Highly structured data with enormous write volume and simple key-based access (chat messages, IoT readings) often fits a wide-column store; loosely structured data that needs transactions can live in a relational database with JSON columns. Access patterns, consistency, scale and operations decide more than structure.

</details>

## Intermediate

### Q3. Which database would you use for a payments ledger, and why?

**Style:** Scenario

<details>
<summary>Answer</summary>

A relational database such as PostgreSQL: transfers need atomic multi-row updates, constraints (no negative balance where required, valid account references), strong consistency on reads that drive decisions, and auditability with flexible queries. Durability through synchronous replication and backups; read replicas for reporting; idempotency keys for safe retries.

</details>

### Q4. Which database would you use to store chat messages for a messenger with billions of messages?

**Style:** Scenario

<details>
<summary>Answer</summary>

A wide-column store such as Cassandra (or ScyllaDB): partition by conversation ID, cluster by time or sequence number, so the dominant query — the latest messages of one conversation — reads one sorted partition, writes are fast appends, and data spreads across nodes. User accounts and memberships can stay in a relational database.

</details>

### Q5. What is polyglot persistence and what does it cost?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Using several kinds of data stores in one system, each for what it does best (relational for orders, Redis for sessions, a search engine for search, object storage for files). The cost is operational overhead — backups, upgrades and monitoring per store — and keeping derived copies in sync with the source of truth, typically through change events, accepting eventual consistency between them.

</details>

### Q6. Why shouldn't analytics queries run on the main production database?

**Style:** Why

<details>
<summary>Answer</summary>

Large scans and aggregations consume CPU, memory and I/O and can hold locks or snapshots, slowing user-facing transactions. Row-oriented OLTP databases are also inefficient at scanning a few columns over billions of rows. Copy data to a columnar warehouse (via replicas, change data capture or batch exports) and run analytics there.

</details>

## Advanced

### Q7. An interviewer asks, "Why not NoSQL because it scales?" How do you respond?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Ask what limit SQL would hit: estimate the write rate and data size and compare them to what one primary (plus replicas, caching and partitioning) can handle. If the numbers fit, the relational model's joins, constraints and transactions are worth keeping; if one part exceeds them (a high-volume event stream), move just that part to a store designed for it. "It scales" is not a requirement; a number is.

</details>

### Q8. How would you store and search a product catalogue with category-specific attributes?

**Style:** Design

<details>
<summary>Answer</summary>

Keep the source of truth in a document store or a relational table with a JSON attributes column (indexed on commonly filtered attributes). Publish changes as events to a search engine that powers full-text search, filters and facets, and cache hot product pages. Accept that search results lag the source by seconds, and re-check price and stock against the source at checkout.

</details>
