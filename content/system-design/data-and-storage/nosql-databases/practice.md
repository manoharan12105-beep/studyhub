# NoSQL Databases — Practice

### P1. Match the family

**Difficulty:** Easy · **Type:** Comparison · **Concepts:** NoSQL families

Match the workload to a family: (a) login sessions, (b) product catalogue with varying attributes, (c) IoT readings per device over time, (d) "people you may know".

<details>
<summary>Answer</summary>

(a) Key-value, (b) document, (c) wide-column, (d) graph.

</details>

### P2. True or false

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** NoSQL myths

Which statement is accurate?

- A) NoSQL databases are always faster than SQL databases
- B) NoSQL databases never support transactions
- C) NoSQL stores are fast for the access patterns their data model was designed for
- D) NoSQL means the database cannot be queried

<details>
<summary>Answer</summary>

**Answer:** C) NoSQL stores are fast for the access patterns their data model was designed for

</details>

### P3. Partition key

**Difficulty:** Medium · **Type:** Design · **Concepts:** wide-column modeling

In Cassandra you store sensor readings and must answer "readings of device X between two times". Choose the partition and clustering keys. What problem appears after years of data, and how do you fix it?

<details>
<summary>Answer</summary>

Partition by `device_id`, cluster by `reading_time`. After years, one device's partition grows unbounded, which hurts performance. Bucket the partition key by time: `(device_id, month)`, so each partition holds one device-month; range queries touch a few partitions.

</details>

### P4. Wrong tool

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** choosing NoSQL

A team stores all data in Redis as key-value pairs. Product managers now want "all orders over ₹5,000 placed last week in Mumbai". Why is that hard, and what should change?

<details>
<summary>Answer</summary>

A key-value store can only fetch by key; filtering by amount, date and city would require scanning every value. Keep Redis for caching and sessions, and store orders in a database that supports secondary indexes and ad-hoc queries (relational), with an analytics warehouse for reporting.

</details>
