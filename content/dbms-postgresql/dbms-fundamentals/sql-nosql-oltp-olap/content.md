# SQL vs NoSQL, OLTP vs OLAP and Data Warehouses

**Module:** DBMS Fundamentals · **Interview priority:** Frequently asked

## What Is It?

- **SQL databases** are relational DBMSs: fixed table schemas, joins, constraints and ACID transactions (PostgreSQL, MySQL, Oracle, SQL Server).
- **NoSQL databases** use non-relational models — document, key-value, wide-column or graph — usually trading some relational features for flexible schemas or easier horizontal scaling (MongoDB, Redis, Cassandra, Neo4j).
- **OLTP** (online transaction processing) is the workload of running the business: many small, fast reads and writes ("place order 109").
- **OLAP** (online analytical processing) is the workload of analysing the business: few large read-heavy queries over history ("revenue per category per month for three years").
- A **data warehouse** is a database built for OLAP, loaded from the OLTP systems.

## Why It Matters

- "SQL or NoSQL for this system?" is a common backend and system-design question; the strong answer is about access patterns and guarantees, not fashion.
- Running heavy analytics on the production OLTP database can slow down customer-facing requests — knowing the OLTP/OLAP split explains why companies build warehouses and read replicas.

## Core Concept

### NoSQL families

| Family | Data shape | Strength | Example |
|--------|-----------|----------|---------|
| Document | JSON-like documents, nested | Flexible records read as a whole | MongoDB, Couchbase |
| Key-value | Opaque value per key | Very fast lookups, caching | Redis, DynamoDB (also document) |
| Wide-column | Rows with dynamic columns, partitioned by key | Massive write throughput across many nodes | Cassandra, HBase |
| Graph | Nodes and edges | Multi-hop relationship queries | Neo4j |

### SQL vs NoSQL

| Aspect | SQL (relational) | NoSQL (typical) |
|--------|------------------|-----------------|
| Schema | Declared up front, enforced on write | Flexible; often enforced by the application (schema-on-read) |
| Relationships | Joins and foreign keys | Embedding/denormalisation; joins limited or absent |
| Transactions | ACID, multi-row and multi-table | Varies: often single-document atomicity; some offer multi-document transactions |
| Consistency | Strong by default | Often tunable; many default to eventual consistency across replicas |
| Scaling | Vertical first; read replicas; sharding possible but harder | Designed for horizontal partitioning |
| Query language | SQL (standard, declarative) | Product-specific APIs/languages |
| Best for | Structured data with integrity needs: banking, orders, inventory | Huge scale with simple access patterns, flexible documents, caching, graphs |

> [!IMPORTANT]
> These are tendencies, not laws. PostgreSQL stores and indexes JSON documents (`jsonb`); MongoDB supports multi-document ACID transactions. Decide from the access patterns, the consistency required and the team's operational experience.

**ACID vs BASE.** Relational databases emphasise ACID (atomic, consistent, isolated, durable). Many distributed NoSQL stores describe themselves as **BASE**: basically available, soft state, eventually consistent — replicas converge over time instead of agreeing on every write immediately.

### OLTP vs OLAP

| Aspect | OLTP | OLAP |
|--------|------|------|
| Purpose | Run the business | Analyse the business |
| Typical query | Read/write a few rows by key | Scan and aggregate millions of rows |
| Users | Applications, many concurrent users | Analysts, dashboards, reports |
| Data | Current, detailed | Historical, often summarised |
| Design | Normalised (3NF) to avoid anomalies | Denormalised star/snowflake schemas for fast reads |
| Response time | Milliseconds | Seconds to minutes |
| Storage | Row-oriented (PostgreSQL heap) | Often column-oriented (Redshift, BigQuery, ClickHouse) |
| Example | `UPDATE accounts SET balance = …` | "Revenue by city by quarter" |

### Data warehouse basics

```text
 OLTP sources            ETL / ELT                Data warehouse              Consumers
 (PostgreSQL orders,  →  extract, clean,     →    fact + dimension tables  →  BI dashboards,
  CRM, payments)         transform, load          (history, read-optimised)   reports, ML
```

- **ETL** — extract from sources, transform (clean, conform, aggregate), load into the warehouse. **ELT** loads first and transforms inside the warehouse.
- **Fact table** — measurable events, one row per event: `fact_sales(date_key, product_key, customer_key, quantity, amount)`.
- **Dimension tables** — descriptive context: `dim_date`, `dim_product`, `dim_customer`.
- **Star schema** — one fact table joined directly to denormalised dimensions. A **snowflake schema** normalises dimensions further.
- A warehouse is **subject-oriented, integrated, time-variant and non-volatile** (data is appended and kept as history rather than updated in place).
- A **data mart** is a smaller warehouse for one department.

```text
               dim_date
                  |
dim_customer — fact_sales — dim_product
                  |
               dim_store
```

## Examples

### OLTP-style query: one customer's orders

Small, selective and fast with the primary/foreign keys:

```sql
SELECT order_id, order_date, status
FROM orders
WHERE customer_id = 1
ORDER BY order_date;
```

**Output:**

```text
 order_id | order_date |  status
----------+------------+-----------
      101 | 2026-01-05 | DELIVERED
      103 | 2026-02-03 | SHIPPED
      107 | 2026-03-15 | DELIVERED
(3 rows)
```

### OLAP-style query: revenue per category per month

Scans every sale and aggregates — the kind of query a warehouse is built for:

```sql
SELECT date_trunc('month', o.order_date)::date AS month,
       p.category,
       sum(oi.quantity * oi.unit_price)       AS revenue
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
JOIN products p     ON p.product_id = oi.product_id
WHERE o.status <> 'CANCELLED'
GROUP BY month, p.category
ORDER BY month, p.category;
```

**Output:**

```text
   month    |  category   | revenue
------------+-------------+----------
 2026-01-01 | Electronics | 56000.00
 2026-01-01 | Furniture   | 17000.00
 2026-02-01 | Electronics |  2000.00
 2026-02-01 | Furniture   |  4500.00
 2026-03-01 | Electronics |  3450.00
 2026-03-01 | Furniture   | 12500.00
(6 rows)
```

On eight orders this is instant; on 500 million order lines it would compete with customer traffic on the OLTP server, which is why it belongs in a warehouse or at least on a read replica.

### PostgreSQL storing a document

A relational database can still hold flexible attributes when only part of the data is unstructured:

```sql
CREATE TABLE product_specs (
    product_id integer PRIMARY KEY REFERENCES products (product_id),
    specs      jsonb NOT NULL
);
INSERT INTO product_specs VALUES
    (1, '{"ram_gb": 16, "cpu": "8-core"}'),
    (4, '{"material": "oak", "width_cm": 140}');

SELECT p.name, s.specs ->> 'ram_gb' AS ram_gb
FROM products p
JOIN product_specs s ON s.product_id = p.product_id
ORDER BY p.product_id;
```

**Output:**

```text
  name  | ram_gb
--------+--------
 Laptop | 16
 Desk   | NULL
(2 rows)
```

Details: [JSON, JSONB and Arrays](../../postgresql-features/jsonb-and-arrays/content.md).

## Common Mistakes

- "NoSQL is faster than SQL." Speed depends on the access pattern, indexes and data model; a key lookup in PostgreSQL is also very fast.
- "NoSQL has no transactions" or "SQL cannot scale horizontally." Both are outdated generalisations.
- Running large analytical reports against the primary OLTP database during peak hours.
- Designing an OLTP schema as a denormalised star schema (update anomalies) or an analytics schema in strict 3NF (many expensive joins).

## Revision

- SQL = relational, enforced schema, joins, ACID. NoSQL = document, key-value, wide-column, graph; flexible schema, scale-out, often eventual consistency.
- Choose by access patterns, consistency needs and relationships, not by trend.
- OLTP: many short transactions, normalised, current data, ms latency. OLAP: few big scans, denormalised, historical data.
- Warehouse: ETL/ELT from OLTP sources into fact and dimension tables (star/snowflake), append-only history.

## Quick Revision

SQL for structured data with integrity and joins; NoSQL for flexible shapes and massive scale-out. OLTP runs the business (small fast transactions); OLAP analyses it (big scans) in a warehouse with star schemas.
