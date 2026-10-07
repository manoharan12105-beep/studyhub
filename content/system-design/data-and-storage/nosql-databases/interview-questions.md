# NoSQL Databases — Interview Questions

## Beginner

### Q1. What are the main types of NoSQL databases?

**Style:** Direct

<details>
<summary>Answer</summary>

Key-value stores (Redis, DynamoDB) map keys to opaque values; document stores (MongoDB) store JSON-like documents queryable by field; wide-column stores (Cassandra, HBase) store rows grouped by partition key and sorted by clustering key; graph databases (Neo4j) store nodes and edges with properties for traversals.

</details>

### Q2. What advantages do NoSQL databases offer over relational ones?

**Style:** Comparison

<details>
<summary>Answer</summary>

Built-in horizontal partitioning for large data and high write throughput, flexible schemas for records of varying shape, data models that serve specific access patterns without joins (a document, a partition, a key), and often high availability through replication with tunable consistency.

</details>

## Intermediate

### Q3. What does BASE mean?

**Style:** Direct

<details>
<summary>Answer</summary>

Basically Available, Soft state, Eventual consistency: the system prioritises staying available, data may be temporarily inconsistent across replicas, and replicas converge if no new writes arrive. It contrasts with ACID's strict transactional guarantees.

</details>

### Q4. Why must you design wide-column tables per query?

**Style:** Why

<details>
<summary>Answer</summary>

Data is distributed by partition key and sorted by clustering key, so only queries that specify the partition key (and filter or sort on the clustering key) are efficient; anything else requires scanning many nodes. Different access patterns therefore get separate, denormalised tables, written together.

</details>

### Q5. When is a graph database the right choice?

**Style:** Scenario

<details>
<summary>Answer</summary>

When the questions are about relationships several hops deep: friends-of-friends recommendations, fraud rings connecting accounts through shared devices, permission inheritance, knowledge graphs. Graph stores traverse edges directly instead of repeated self-joins, and edges carry properties.

</details>

### Q6. What is the difference between a wide-column store and a columnar analytics database?

**Style:** Trap

<details>
<summary>Answer</summary>

A wide-column store (Cassandra, HBase) is an operational NoSQL database organised by partition key, optimised for high-throughput reads and writes of rows by key. A columnar analytics database (BigQuery, Redshift, ClickHouse) stores each column separately on disk so aggregations over billions of rows read only the needed columns; it serves analytics with SQL, not per-request application traffic.

</details>

## Advanced

### Q7. A team picked MongoDB for orders and payments and now sees inconsistent balances. What went wrong?

**Style:** Debugging

<details>
<summary>Answer</summary>

The workload needed multi-record atomic updates and relational integrity (debit one account, credit another, record the order), but updates were done as separate single-document writes without transactions, so concurrent or failed operations left partial results. Either use multi-document transactions consistently (with their cost) or move this data to a relational database designed for it.

</details>

### Q8. How would you store user profiles with very different optional fields for different user types?

**Style:** Design

<details>
<summary>Answer</summary>

A document store fits naturally: each profile is one document read and written as a whole, with optional fields only where present and indexes on the fields used for lookups. Alternatively, a relational table with core columns plus a JSONB column for variable attributes gives similar flexibility while keeping relational data alongside.

</details>
