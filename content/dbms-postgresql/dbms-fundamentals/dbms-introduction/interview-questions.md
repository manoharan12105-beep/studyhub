# Databases and DBMS — Interview Questions

## Beginner

### Q1. What is a DBMS?

<details>
<summary>Answer</summary>

A database management system is software that stores data and controls every access to it. Beyond storage, it provides a query language, integrity rules, concurrency control for many simultaneous users, transactions, crash recovery and security. Examples: PostgreSQL, MySQL, Oracle, MongoDB.

</details>

### Q2. What is the difference between a database and a DBMS?

<details>
<summary>Answer</summary>

The database is the organised data itself (plus its metadata); the DBMS is the software that manages it. "PostgreSQL" is a DBMS; the `studyhub` database with its tables is a database managed by PostgreSQL. One DBMS server can manage many databases.

</details>

### Q3. What is the difference between a DBMS and an RDBMS?

<details>
<summary>Answer</summary>

An RDBMS is a DBMS built on the relational model: data is stored in tables, relationships are expressed with keys and foreign keys, integrity is declared with constraints and data is queried with SQL. A DBMS in general may use other models — documents (MongoDB), key-value (Redis), graphs (Neo4j), hierarchies (IMS). Every RDBMS is a DBMS; not every DBMS is relational.

</details>

### Q4. Why use a DBMS instead of storing data in files?

<details>
<summary>Answer</summary>

Files give no help with the hard problems: duplicated and inconsistent data, integrity rules, atomic updates, safe concurrent access, security and ad-hoc querying. A DBMS solves all of them centrally — for example, a transaction guarantees that a money transfer either fully happens or not at all, even if the server crashes halfway.

</details>

### Q5. What is metadata in a database?

<details>
<summary>Answer</summary>

Data about the data: table and column names, data types, constraints, indexes, views, users and privileges. The DBMS stores it in the **system catalog**. PostgreSQL exposes it through `pg_catalog` tables and the standard `information_schema` views, which can be queried with SQL.

</details>

## Intermediate

### Q6. List the main advantages and disadvantages of a DBMS.

<details>
<summary>Answer</summary>

Advantages: controlled redundancy, consistency, integrity constraints, concurrent access, transactions and recovery, security, data independence, declarative querying, backup tools.

Disadvantages: cost and complexity, performance overhead for very small applications, need for tuning and administration, a single point of failure unless replicated, and some data shapes (large binary files, some graph workloads) fit other systems better.

</details>

### Q7. What does a DBA do?

<details>
<summary>Answer</summary>

Installs, configures and upgrades the DBMS; manages users and privileges; plans and tests backups and recovery; monitors and tunes performance (queries, indexes, configuration, vacuuming in PostgreSQL); manages replication and high availability; and reviews schema changes. In many teams developers own schema migrations and query tuning, and managed cloud services handle part of the operations.

</details>

### Q8. What is data independence and why does it matter?

<details>
<summary>Answer</summary>

Applications should not have to change when the way data is stored or organised changes. **Physical data independence**: adding an index or moving files to faster disks does not change any query. **Logical data independence**: adding a column or a new table does not break applications that do not use it (views can hide larger changes). It matters because storage and schemas evolve for years while applications must keep working.

</details>

## Advanced

### Q9. Is "DBMS = single-user, RDBMS = multi-user" a correct distinction?

<details>
<summary>Answer</summary>

No — it is a simplification found in some textbooks, based on early file-like systems. Many non-relational DBMSs (MongoDB, Cassandra, Redis) are multi-user, networked and support transactions to some degree. The defining difference is the **data model**: an RDBMS uses relations (tables), keys and SQL.

</details>

### Q10. Which DBMS responsibilities does PostgreSQL implement with which mechanisms?

<details>
<summary>Answer</summary>

- Concurrency: **MVCC** (readers do not block writers) plus row-level locks.
- Atomicity and durability: transactions and the **write-ahead log (WAL)**; committed changes are in the WAL before the commit returns.
- Integrity: constraints (`PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `CHECK`, `NOT NULL`, exclusion constraints).
- Performance: cost-based query planner, indexes (B-tree, hash, GIN, GiST, BRIN), buffer cache.
- Security: roles, privileges, row-level security.
- Metadata: the system catalog (`pg_catalog`, `information_schema`).

</details>
