# DBMS Fundamentals Interview Questions — Interview Questions

## Beginner

### Q1. What are the main components of a DBMS?

<details>
<summary>Answer</summary>

- **Query processor** — parses SQL, rewrites it, plans (optimiser) and executes it.
- **Storage manager** — files, pages, buffer pool (cache) and access methods (heap, indexes).
- **Transaction manager** — concurrency control (locks, MVCC) and recovery (logging, checkpoints).
- **Catalog** — metadata about tables, columns, types, indexes, users and privileges.

In PostgreSQL these map to the parser/planner/executor, shared buffers and storage, MVCC with WAL, and the `pg_catalog` system tables.

</details>

### Q2. What is the difference between a database, a DBMS and a database system?

<details>
<summary>Answer</summary>

The **database** is the organised collection of data. The **DBMS** is the software that manages it (PostgreSQL). The **database system** is both together, plus the applications and users around them. Saying "PostgreSQL is a database" is common, but in a theory round, "PostgreSQL is a DBMS (an RDBMS)" is the precise answer.

</details>

### Q3. Explain schema versus instance.

<details>
<summary>Answer</summary>

The **schema** is the structure: tables, columns, types, constraints. It changes rarely, through DDL. An **instance** (database state) is the data at a given moment, and it changes with every insert, update or delete. Analogy: a class definition versus the objects that exist right now.

</details>

### Q4. What are DDL, DML, DCL and TCL?

<details>
<summary>Answer</summary>

- **DDL** (definition): `CREATE`, `ALTER`, `DROP`, `TRUNCATE` — structure.
- **DML** (manipulation): `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `MERGE` — data (`SELECT` is sometimes called DQL).
- **DCL** (control): `GRANT`, `REVOKE` — permissions.
- **TCL** (transaction control): `BEGIN`, `COMMIT`, `ROLLBACK`, `SAVEPOINT`.

In PostgreSQL, DDL is transactional too: a `CREATE TABLE` inside a transaction can be rolled back.

</details>

### Q5. Name the types of keys with an example of each.

<details>
<summary>Answer</summary>

Using `employees(emp_id, email, dept_id, …)`:

- **Super key** — any set of columns that uniquely identifies a row: `{emp_id}`, `{emp_id, name}`.
- **Candidate key** — a minimal super key: `{emp_id}`, `{email}` (if unique and required).
- **Primary key** — the chosen candidate key: `emp_id`.
- **Alternate key** — the other candidate keys: `email`, enforced with `UNIQUE`.
- **Foreign key** — references a key of another (or the same) table: `dept_id → departments`, `manager_id → employees`.
- **Composite key** — a key of several columns: `order_items(order_id, product_id)`.
- **Surrogate vs natural key** — a generated id versus a real-world identifier such as a PAN or ISBN.

</details>

### Q6. What are a relation, a tuple and an attribute?

<details>
<summary>Answer</summary>

They are the formal relational-model names for a table, a row and a column. A **relation** is a set of tuples sharing the same attributes; a **tuple** is one ordered set of attribute values; an **attribute** has a name and a **domain** (the allowed values). Being a *set*, a relation has no duplicate tuples and no row order. SQL tables relax this (duplicates are allowed without a key, and `ORDER BY` is needed for order), which is why keys matter.

</details>

## Intermediate

### Q7. What is metadata, and where does PostgreSQL keep it?

<details>
<summary>Answer</summary>

Metadata is data about the data: table and column definitions, types, constraints, indexes, privileges and statistics. PostgreSQL stores it in the **system catalog**, tables in the `pg_catalog` schema (`pg_class`, `pg_attribute`, `pg_index`, `pg_constraint` …). It also exposes the SQL-standard `information_schema` views. `psql` commands such as `\d` simply query these catalogs.

</details>

### Q8. What is the difference between entity integrity and referential integrity?

<details>
<summary>Answer</summary>

**Entity integrity**: the primary key is unique and never `NULL`, so every row is identifiable. **Referential integrity**: foreign keys point to existing rows. The first is enforced by `PRIMARY KEY`, the second by `FOREIGN KEY`. **Domain integrity** (types, `CHECK`, `NOT NULL`) is the third classic category.

</details>

### Q9. How do you map a many-to-many relationship to tables?

<details>
<summary>Answer</summary>

With a **junction (associative) table** that holds a foreign key to each side, with a composite primary key or a unique constraint on the pair. Example: `order_items(order_id, product_id, quantity, unit_price)` connects orders and products. Attributes of the relationship itself (quantity, price at the time of the order) live in the junction table. One-to-many puts the foreign key on the "many" side; one-to-one puts a unique foreign key on either side.

</details>

### Q10. What is a weak entity?

<details>
<summary>Answer</summary>

An entity that cannot be identified by its own attributes alone, only together with its owner's key. An order line (line number 1, 2, 3) is identified by order id + line number; a dependent of an employee by employee id + dependent name. In tables, its primary key includes the owner's key, and the foreign key usually has `ON DELETE CASCADE`.

</details>

### Q11. Explain 1NF, 2NF, 3NF and BCNF with one example.

<details>
<summary>Answer</summary>

Start with `enrolment(student_id, course_id, student_name, course_title, instructor, instructor_phone)`, key `(student_id, course_id)`.

- **1NF** — atomic values, no repeating groups (no "courses" list column). Satisfied.
- **2NF** — no non-key attribute depends on part of a composite key. `student_name` depends only on `student_id`, `course_title` only on `course_id` → move them to `students` and `courses`.
- **3NF** — no transitive dependency through a non-key attribute. `course_id → instructor → instructor_phone` → move the phone to `instructors`.
- **BCNF** — every determinant is a superkey; it fixes the rare 3NF cases where a non-key attribute determines part of a key.

Result: `students`, `courses(course_id, title, instructor_id)`, `instructors`, `enrolments(student_id, course_id)`.

</details>

### Q12. What is relational algebra, and how does it relate to SQL?

<details>
<summary>Answer</summary>

A formal set of operations on relations that SQL is built on:

- **Selection σ** (filter rows) → `WHERE`
- **Projection π** (choose columns) → the `SELECT` list
- **Join ⋈** → `JOIN`
- **Union ∪, difference −, intersection ∩** → `UNION`, `EXCEPT`, `INTERSECT`
- **Cartesian product ×** → `CROSS JOIN`
- **Rename ρ** → aliases

Optimisers rewrite queries using algebraic equivalences, for example pushing a selection below a join so fewer rows are joined.

</details>

### Q13. OLTP versus OLAP?

<details>
<summary>Answer</summary>

**OLTP** (online transaction processing) handles many small, concurrent reads and writes of current data — orders, payments, logins. It uses normalised schemas, indexes and short transactions. **OLAP** (online analytical processing) runs fewer, large read-only queries over historical data — monthly revenue by region. It uses denormalised star schemas, columnar storage and bulk loads. PostgreSQL is primarily an OLTP database, and handles moderate analytics well.

</details>

## Advanced

### Q14. When would you choose a NoSQL database over PostgreSQL?

<details>
<summary>Answer</summary>

When a specific need outweighs relational strengths:

- massive horizontal write scale or global distribution with relaxed consistency (Cassandra, DynamoDB);
- a key-value cache or ephemeral data (Redis);
- graph traversals as the core workload (Neo4j);
- very variable document shapes with no cross-document joins (MongoDB).

PostgreSQL covers many "NoSQL" needs itself: `jsonb` with GIN indexes, arrays, full-text search and extensions. A common rule is to start relational and add a specialised store for a proven need.

</details>

### Q15. What does the CAP theorem say, and how does it relate to a single PostgreSQL server?

<details>
<summary>Answer</summary>

For a **distributed** data store, when a network partition happens, a system must choose between **consistency** (every read sees the latest write) and **availability** (every request gets a response). A single PostgreSQL server is not partitioned, so CAP does not really apply; it provides ACID transactions. With replicas, choices appear: synchronous replication favours consistency (commits wait for a standby), asynchronous replication favours availability and latency (a failover can lose recent commits).

</details>

### Q16. How does a DBMS guarantee durability after a crash?

<details>
<summary>Answer</summary>

Through **write-ahead logging (WAL)**: before a changed data page may be written to disk, the log record describing the change must be flushed. On `COMMIT`, PostgreSQL flushes the transaction's WAL (`fsync`) and only then reports success; data pages are written later by checkpoints. After a crash, recovery replays WAL from the last checkpoint, redoing committed changes. Changes of uncommitted transactions stay invisible, because MVCC visibility checks the commit status.

</details>

### Q17. Why is `NULL` controversial in relational theory?

<details>
<summary>Answer</summary>

`NULL` means "unknown or not applicable", which forces **three-valued logic** (true, false, unknown). That breaks intuitive rules: `x = x` is not true for `NULL`, `NOT IN` with a `NULL` returns nothing, and aggregates silently skip `NULL`s. Codd's model allowed it; critics (Date, Darwen) argue for avoiding it through design (separate tables for optional facts). In practice: use `NOT NULL` wherever a value is required, and handle `NULL` explicitly with `IS NULL`, `coalesce` and `IS DISTINCT FROM`.

</details>
