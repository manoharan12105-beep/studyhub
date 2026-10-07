# Choosing a Database — Practice

### P1. First question

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** decision process

What should you establish first when choosing a database?

- A) Which database is most popular this year
- B) The access patterns the system needs to serve
- C) Whether the database is open source
- D) The number of tables

<details>
<summary>Answer</summary>

**Answer:** B) The access patterns the system needs to serve

</details>

### P2. Match the store

**Difficulty:** Medium · **Type:** Design · **Concepts:** polyglot persistence

For a ride-hailing app choose a store for: (a) trips and payments, (b) drivers' latest locations updated every 4 s, (c) "restaurants or places matching 'biryani' near me", (d) historical trip analytics.

<details>
<summary>Answer</summary>

(a) Relational database (transactions, consistency). (b) In-memory key-value store with geospatial indexing (such as Redis geo commands) — small, hot, frequently overwritten data. (c) A search engine with geo queries. (d) A columnar data warehouse fed from the operational stores.

</details>

### P3. Justify a choice

**Difficulty:** Medium · **Type:** Trade-off · **Concepts:** stating trade-offs

Complete the sentence for a URL shortener choosing a key-value store: "We use a key-value store because …, and we give up …".

<details>
<summary>Answer</summary>

"…the dominant access pattern is a lookup of the long URL by short code at very high read volume, with no joins, and it partitions easily by key; we give up flexible queries (such as analytics by user or date), which we serve from a separate store or warehouse."

</details>

### P4. Too many stores

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** operational cost

A 6-person team runs PostgreSQL, MongoDB, Cassandra, Redis, Elasticsearch and Neo4j for an app with 20,000 users. What would you recommend and why?

<details>
<summary>Answer</summary>

Consolidate. At 20,000 users, PostgreSQL (with JSONB for flexible fields and its full-text search for basic search) plus Redis for caching and sessions covers the needs. Each extra store adds backups, upgrades, monitoring, failure modes and sync code that a six-person team cannot afford. Reintroduce a specialised store only when a measured requirement exceeds what the simpler stack handles.

</details>
