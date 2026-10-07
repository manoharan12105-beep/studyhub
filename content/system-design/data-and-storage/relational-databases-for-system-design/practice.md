# Relational Databases in System Design — Practice

### P1. Constraint choice

**Difficulty:** Easy · **Type:** Comparison · **Concepts:** constraints

Choose a constraint: (a) emails must not repeat, (b) every order must reference an existing customer, (c) quantity must be at least 1, (d) new accounts get plan "free" if none is given.

<details>
<summary>Answer</summary>

(a) UNIQUE, (b) FOREIGN KEY, (c) CHECK, (d) DEFAULT.

</details>

### P2. Atomicity

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** transactions

A server crashes halfway through a transaction that moved money between two accounts. After restart, what does the database contain?

- A) The debit but not the credit
- B) Neither change
- C) The credit but not the debit
- D) Both changes

<details>
<summary>Answer</summary>

**Answer:** B) Neither change

An uncommitted transaction is rolled back during recovery.

</details>

### P3. Where it strains

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** scaling SQL

A PostgreSQL primary serves 2,000 writes/s and 40,000 reads/s and is at 85 % CPU, mostly from reads. What do you do first?

<details>
<summary>Answer</summary>

Offload reads: add read replicas and a cache for the hottest queries, and check indexes and slow queries. The write rate (2,000/s) is well within one primary's capacity, so sharding is not needed.

</details>

### P4. Model it

**Difficulty:** Medium · **Type:** Design · **Concepts:** relationships

Model "users can join many groups; a group has many members; each membership has a role (admin or member)".

<details>
<summary>Answer</summary>

`users(id, …)`, `groups(id, name, …)`, and the junction table `memberships(user_id → users.id, group_id → groups.id, role CHECK (role IN ('admin','member')), joined_at, PRIMARY KEY (user_id, group_id))`, with an index on `(group_id)` to list a group's members.

</details>
