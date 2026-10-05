# SQL vs NoSQL, OLTP vs OLAP and Data Warehouses — Interview Questions

## Beginner

### Q1. What is the difference between SQL and NoSQL databases?

<details>
<summary>Answer</summary>

SQL databases are relational: tables with a declared schema, joins, constraints and ACID transactions. NoSQL databases use other models — document, key-value, wide-column, graph — usually with flexible schemas and designs that scale horizontally, often with weaker or tunable consistency. Choose relational for structured data with integrity requirements and complex queries; choose a NoSQL store when its data model fits the access pattern (caching, huge write volume, flexible documents, graph traversal).

</details>

### Q2. What are OLTP and OLAP?

<details>
<summary>Answer</summary>

OLTP systems process day-to-day transactions: many concurrent, short reads and writes on current data (placing orders, transfers). OLAP systems analyse data: complex, read-heavy aggregate queries over large historical datasets (sales trends). OLTP schemas are normalised; OLAP schemas are usually denormalised (star schema) and often column-oriented.

</details>

### Q3. What is a data warehouse?

<details>
<summary>Answer</summary>

A central database designed for analysis, loaded periodically from operational systems through ETL/ELT. It stores integrated, historical, non-volatile data organised for querying — typically fact tables (events with measures) surrounded by dimension tables (who, what, when, where).

</details>

## Intermediate

### Q4. What is a star schema? How does a snowflake schema differ?

<details>
<summary>Answer</summary>

A star schema has one central fact table (e.g. `fact_sales`) with foreign keys to denormalised dimension tables (`dim_date`, `dim_product`, `dim_customer`). Queries need only one join per dimension. A snowflake schema normalises dimensions into sub-dimensions (`dim_product → dim_category`), saving space but adding joins.

</details>

### Q5. Explain ACID vs BASE.

<details>
<summary>Answer</summary>

ACID: atomicity, consistency, isolation, durability — each transaction is all-or-nothing, preserves rules, is isolated from concurrent ones and survives crashes once committed. BASE: basically available, soft state, eventual consistency — common in distributed NoSQL systems, which prefer staying available and let replicas converge later. Many modern systems offer a configurable mix.

</details>

### Q6. Why not run analytics directly on the production database?

<details>
<summary>Answer</summary>

Large scans and aggregations compete for CPU, memory, I/O and buffer cache with latency-sensitive customer transactions, and long-running queries in PostgreSQL can also hold back vacuum cleanup. A normalised OLTP schema also makes analytics queries join-heavy. Use a read replica for moderate reporting, and a warehouse for heavy historical analysis.

</details>

### Q7. You need to store user profiles where each user can have arbitrary custom fields. SQL or NoSQL?

<details>
<summary>Answer</summary>

Either can work; the deciding factors are the rest of the system. If users also have orders, payments and relationships needing integrity, keep PostgreSQL and store the custom fields in a `jsonb` column (indexable with GIN). If the profiles are an isolated, document-shaped dataset at very large scale, a document database is natural. Mention the trade-off: flexibility vs database-enforced integrity.

</details>

## Advanced

### Q8. Why are OLAP databases often column-oriented?

<details>
<summary>Answer</summary>

Analytical queries read a few columns of very many rows (`sum(amount)` grouped by `date`). Column storage reads only the needed columns, compresses well because values in a column are similar, and enables vectorised processing. Row storage (PostgreSQL's heap) suits OLTP, where whole rows are read and written by key.

</details>

### Q9. What does eventual consistency mean for an application developer?

<details>
<summary>Answer</summary>

A read may return stale data for a while after a write, because replicas have not yet received it. The application must tolerate this — for example, read-your-own-writes by routing a user's reads to the primary after a write, idempotent operations, and conflict resolution. For money movements or inventory reservations, strong consistency (ACID transactions) is usually required.

</details>
