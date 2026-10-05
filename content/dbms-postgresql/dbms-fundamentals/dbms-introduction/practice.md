# Databases and DBMS — Practice

### P1. Database or DBMS?

**Difficulty:** Easy · **Type:** MCQ

Which of these is a database (not a DBMS)?

- A) PostgreSQL
- B) The `studyhub` collection of tables holding the shop's orders
- C) MongoDB
- D) Oracle

<details>
<summary>Answer</summary>

**Answer:** B) The `studyhub` collection of tables holding the shop's orders

**Explanation:** PostgreSQL, MongoDB and Oracle are software products (DBMSs). A database is the organised data a DBMS manages.

</details>

### P2. Relational or not?

**Difficulty:** Easy · **Type:** MCQ

Which DBMS is **not** relational?

- A) MySQL
- B) SQL Server
- C) Redis
- D) PostgreSQL

<details>
<summary>Answer</summary>

**Answer:** C) Redis

**Explanation:** Redis is a key-value store. The others store data in tables and are queried with SQL.

</details>

### P3. Name the file-system problem

**Difficulty:** Easy · **Type:** Conceptual

A college keeps student addresses in a hostel spreadsheet and in an exam-cell spreadsheet. A student moves; only the hostel sheet is updated. Name the two problems this shows and how a DBMS avoids them.

<details>
<summary>Hint</summary>

One problem is about storing the same fact twice; the other is about the two copies disagreeing.

</details>

<details>
<summary>Answer</summary>

**Redundancy** (the address is stored twice) leads to **inconsistency** (the copies disagree). A DBMS stores the address once in a shared `students` table that both departments query, so an update is seen by everyone.

</details>

### P4. Which DBMS feature?

**Difficulty:** Medium · **Type:** Scenario

For each situation, name the DBMS capability that handles it:

1. The server loses power after debiting account A but before crediting account B.
2. Two cashiers update the same account at the same moment.
3. An intern's account must read orders but never see salaries.
4. A buggy script tries to insert an order for a customer that does not exist.

<details>
<summary>Answer</summary>

1. **Transactions (atomicity) and crash recovery** — the incomplete transfer is rolled back using the write-ahead log.
2. **Concurrency control** — locking/MVCC prevents lost updates.
3. **Security / access control** — `GRANT SELECT` on `orders` only, no privilege on `employees`.
4. **Integrity constraints** — a `FOREIGN KEY` from `orders.customer_id` to `customers` rejects the insert.

</details>

### P5. Query the catalog

**Difficulty:** Medium · **Type:** Query · **Concepts:** metadata, information_schema

Using the [sample database](../../sql-fundamentals/dbms-sample-database/content.md), list the column names and data types of the `orders` table, in column order.

**Expected output:**

```text
 column_name | data_type
-------------+-----------
 order_id    | integer
 customer_id | integer
 order_date  | date
 status      | text
(4 rows)
```

<details>
<summary>Hint</summary>

`information_schema.columns` has `table_name`, `column_name`, `data_type` and `ordinal_position`.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
ORDER BY ordinal_position;
```

**Explanation:** The DBMS describes its own structure in the catalog, and the catalog is queryable with ordinary SQL. In psql, `\d orders` shows the same information plus constraints and indexes.

</details>

### P6. When is a DBMS overkill?

**Difficulty:** Medium · **Type:** Conceptual

Give one situation where a full client-server DBMS such as PostgreSQL is not the best choice, and say what you would use instead.

<details>
<summary>Answer</summary>

Examples (any one with a reason is fine):

- A single-user desktop or mobile app storing a few megabytes — an embedded database such as SQLite avoids running a server.
- Storing large videos or images — object storage or the file system, with only metadata and paths in the database.
- A cache of computed values that may be lost — an in-memory store such as Redis.

The DBMS's guarantees (concurrency, durability, integrity) cost administration and overhead; when they are not needed, simpler tools win.

</details>
