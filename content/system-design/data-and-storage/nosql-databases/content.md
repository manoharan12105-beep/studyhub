# NoSQL Databases

**Module:** Data and Storage · **Interview priority:** Core

## What Is It?

**NoSQL** ("not only SQL") is an umbrella term for databases that do not use the relational table-and-join model. Like saying "not Java", it names what they are not, and covers very different designs. Four families matter in system design:

| Family | Data model | Examples |
|--------|-----------|----------|
| **Key-value** | A unique key maps to an opaque value | Redis, DynamoDB, Riak |
| **Document** | A key maps to a JSON-like document with nested fields, queryable by field | MongoDB, Couchbase, Firestore |
| **Wide-column** | Rows identified by a partition key, each holding many columns, sorted within a partition | Cassandra, HBase, ScyllaDB, Bigtable |
| **Graph** | Nodes and edges, both with properties | Neo4j, Amazon Neptune |

## Why It Exists

Relational databases keep related data consistent through joins and transactions on one primary, which makes them hard to spread across many machines for very large write volumes and data sets. NoSQL stores give up some of that (joins, multi-record transactions, rigid schemas) to gain:

- **Horizontal scaling** built in: data is partitioned by key across many nodes, and nodes can be added.
- **Flexible schemas:** records of different shapes in one collection.
- **Data models that match specific access patterns** — a key lookup, a whole document, a time-ordered partition, a graph traversal — without joins.

## How It Works

### Key-value

`GET session:8f3a` → value. The store knows nothing about the value's contents, so lookups are by key only, extremely fast and easy to partition. Used for caches, sessions, shopping carts, feature flags, rate-limit counters. Cannot efficiently answer "find all carts containing product 7".

### Document

```json
{ "_id": "course-17", "title": "System Design", "lessons": [
    { "title": "Caching", "comments": [ { "user": "ravi", "text": "Great" } ] } ] }
```

A whole aggregate (a course with its lessons and comments, a user profile, a product with variable attributes) is read and written as one document — no joins. Fields can be indexed and queried. Good for content, catalogues, profiles and data whose shape varies. Weak at relationships between documents (no or limited joins) and at updates that must span many documents atomically (support exists but is costlier).

### Wide-column

Data is grouped by a **partition key** and sorted by a **clustering key** inside the partition:

```text
partition key: chat_id = 991       clustering key: message_time (descending)
  2026-10-07 10:15:03 → {sender: alan, text: "hi"}
  2026-10-07 10:14:58 → {sender: bea,  text: "hello"}
```

"Latest 50 messages of chat 991" reads one partition in order — extremely fast at enormous scale with very high write throughput. You must design tables **per query**: a query not based on the partition key is expensive or impossible. Used for messaging, time series, activity feeds, IoT, event logs.

### Graph

Nodes (people, products) and edges (FOLLOWS, BOUGHT) are first-class, and **both carry properties** (an `ENROLLED` edge with `year` and `grade`). Traversals like "friends of friends who like jazz" are natural and fast, where SQL would need many self-joins. Used for social graphs, recommendations, fraud rings, knowledge graphs. Query languages include Cypher and Gremlin.

### Columnar analytics stores are a different thing

Column-oriented **analytical** databases (BigQuery, Redshift, Snowflake, ClickHouse) store each column separately, so "average order value across a billion rows" reads only one column. They are usually queried with SQL and serve analytics (OLAP), not application traffic (OLTP). Do not confuse them with wide-column stores like Cassandra.

### BASE vs ACID

Many NoSQL systems favour availability and partition tolerance and describe themselves as **BASE**: *Basically Available, Soft state, Eventual consistency* — replicas converge over time instead of agreeing on every write. Many now offer tunable or stronger consistency per operation (see [Quorum](../../scaling-and-distribution/quorum-reads-and-writes/content.md)), and some (DynamoDB, MongoDB) support transactions with extra cost.

**Think about it:** a chat app stores billions of messages and almost always reads "the latest messages in one conversation". Which family fits, and what is the partition key?

<details>
<summary>Answer</summary>

A wide-column store such as Cassandra: partition by `conversation_id`, cluster by message time (or a sequence number) descending. The common query reads one partition in sorted order, writes are fast appends, and conversations spread across nodes. The cost: queries such as "all messages by a user across conversations" need a separate table.

</details>

## When Not to Use

When data is highly relational, needs multi-record transactions (payments, inventory), or will be queried in ways you cannot predict (ad-hoc reporting), a relational database is usually simpler and safer. Choosing NoSQL "because it scales" for a workload one PostgreSQL server could handle adds complexity with no benefit.

## Comparison

| Aspect | Relational | Key-value | Document | Wide-column | Graph |
|--------|-----------|-----------|----------|-------------|-------|
| Query flexibility | High (SQL, joins) | Key only | Fields within documents | Partition + clustering key | Traversals |
| Schema | Fixed | None | Flexible | Per table, flexible columns | Flexible |
| Horizontal write scaling | Hard (sharding) | Easy | Built in | Excellent | Hard for large graphs |
| Transactions | Full ACID | Single key | Single document (multi-document costlier) | Single partition (lightweight) | Varies |
| Sweet spot | Business records | Caches, sessions | Content, catalogues, profiles | Messages, time series, events | Relationships |

## Common Traps

> [!WARNING]
> **Common trap:** "NoSQL is faster than SQL." It is faster for the access patterns it was modelled for (a key lookup, one document, one partition) and often slower or impossible for others (ad-hoc filters, joins, aggregates).

## Interview Follow-up

- *"Why not store everything in MongoDB?"* Payments, orders and inventory need multi-record transactions and relational integrity; a relational database fits better. MongoDB suits flexible, document-shaped data accessed as a whole.

## Key Takeaways

- NoSQL is a family: key-value, document, wide-column, graph — each fits different access patterns.
- They trade joins, rigid schemas and (often) strong consistency for built-in horizontal scaling and flexible models.
- Design NoSQL data around queries, especially the partition key.
- Columnar analytics warehouses are not wide-column stores.
