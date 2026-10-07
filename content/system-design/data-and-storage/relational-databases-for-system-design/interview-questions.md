# Relational Databases in System Design — Interview Questions

## Beginner

### Q1. What does ACID stand for?

**Style:** Direct

<details>
<summary>Answer</summary>

Atomicity (a transaction's changes all happen or none do), Consistency (the database moves from one valid state to another, respecting constraints), Isolation (concurrent transactions do not interfere, per the isolation level), Durability (committed changes survive crashes).

</details>

### Q2. How do you model a many-to-many relationship in SQL?

**Style:** How

<details>
<summary>Answer</summary>

With a junction table containing foreign keys to both sides, usually with a composite primary key or unique constraint on the pair — for example `students_courses(student_id, course_id)` — plus extra columns describing the relationship (enrolled_at, grade).

</details>

### Q3. What is the difference between a primary key and a unique constraint?

**Style:** Comparison

<details>
<summary>Answer</summary>

Both forbid duplicate values. A table has one primary key, which identifies each row, cannot be NULL and is what foreign keys normally reference. A table can have several unique constraints on other columns (email, username), which in PostgreSQL allow NULLs.

</details>

## Intermediate

### Q4. Give an example where a transaction prevents inconsistent data.

**Style:** Scenario

<details>
<summary>Answer</summary>

Transferring money: debit account A and credit account B. If the server crashes after the debit but before the credit, money disappears. Wrapping both updates in one transaction means either both commit or neither does. Similarly, deleting a photo together with its likes and comments.

</details>

### Q5. Which part of a relational database is hardest to scale, and why?

**Style:** Why

<details>
<summary>Answer</summary>

Writes. All writes go to one primary to keep transactions and constraints simple, so write throughput and data size are bounded by one machine. Reads can be spread across replicas and caches, but scaling writes requires sharding, which breaks cross-shard joins, transactions and unique constraints, or a distributed SQL database.

</details>

### Q6. Why are foreign keys sometimes dropped in very large systems?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Foreign keys require checks against the referenced table on every insert and delete, which costs time and locks, and they cannot span shards or separate databases. Large sharded systems sometimes enforce references in application code or through asynchronous cleanup instead, accepting the risk of orphaned rows in exchange for write throughput and independence.

</details>

## Advanced

### Q7. When would you still choose a relational database at very large scale?

**Style:** Design

<details>
<summary>Answer</summary>

When correctness and flexible querying matter more than raw write throughput: payments, orders, inventory, accounts, anything needing multi-row transactions or ad-hoc reporting. You scale with read replicas, caching, careful indexing, vertical scaling, partitioning large tables, and sharding by a key that keeps related data together (such as tenant or user), or with distributed SQL databases that keep SQL and transactions across nodes.

</details>
