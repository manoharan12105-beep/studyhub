# Databases and DBMS

**Module:** DBMS Fundamentals · **Interview priority:** Core

## What Is It?

A **database** is an organised, persistent collection of related data — for example, every customer, product and order of an online shop. A **database management system (DBMS)** is the software that stores that data and controls all access to it: it answers queries, enforces rules, handles many users at once and recovers after crashes. A **relational DBMS (RDBMS)** is a DBMS that stores data as related tables and is queried with SQL. PostgreSQL, MySQL, Oracle and SQL Server are RDBMSs.

## Why It Matters

- Almost every backend application stores its state in a database. A Spring Boot service is usually a thin layer of logic in front of PostgreSQL or MySQL.
- "What is a DBMS?", "DBMS vs RDBMS" and "Why not just use files?" open most DBMS interviews. Answering them precisely shows you know what the database does *for* you — concurrency, integrity, recovery — instead of thinking of it as a place to dump rows.

## Core Concept

### Data, information and the database

- **Data** — raw facts: `42`, `'Chennai'`, `2026-03-15`.
- **Information** — data with meaning: "order 107 was placed on 2026-03-15 by a customer in Chennai".
- **Database** — the stored, organised data plus its description (**metadata**: table names, column types, constraints). The database is the *data*; it is not a program.

### What a DBMS does

The DBMS sits between applications and the stored data. Applications never read the data files directly; they send requests (SQL) and the DBMS does the work.

```text
 Application (Java/Spring)   psql / pgAdmin   Reporting tool
            \                     |                /
             \                    |               /
              +-------- SQL over a connection ---+
                                  |
                    +-------------v--------------+
                    |            DBMS            |
                    | parser, planner, executor  |
                    |  transactions, locking/MVCC|
                    |  constraints, permissions  |
                    |  buffer cache, WAL, backup |
                    +-------------+--------------+
                                  |
                         data files on disk
```

Its responsibilities:

| Responsibility | What it means | PostgreSQL example |
|----------------|---------------|--------------------|
| Data definition | Create and change structure | `CREATE TABLE`, `ALTER TABLE` |
| Data manipulation and querying | Insert, update, delete, retrieve | `INSERT`, `SELECT` with joins |
| Integrity | Reject invalid data | `PRIMARY KEY`, `FOREIGN KEY`, `CHECK`, `NOT NULL` |
| Concurrency control | Many users at once without corrupting data | MVCC, row locks |
| Transactions | All-or-nothing units of work | `BEGIN … COMMIT / ROLLBACK` |
| Recovery and durability | Survive crashes | Write-ahead log (WAL) |
| Security | Who may see or change what | Roles, `GRANT`, `REVOKE` |
| Performance | Fast access to large data | Indexes, the query planner |
| Metadata management | A catalog describing every object | `pg_catalog`, `information_schema` |

### Database vs DBMS vs RDBMS

| Term | What it is | Example |
|------|-----------|---------|
| Database | The organised data itself | The `studyhub` database with its 7 tables |
| DBMS | Software that manages databases (any data model) | PostgreSQL, MongoDB, Redis, Neo4j |
| RDBMS | A DBMS based on the relational model: tables, keys, SQL | PostgreSQL, MySQL, Oracle, SQL Server |

Every RDBMS is a DBMS; not every DBMS is relational. One PostgreSQL server (a **cluster** in PostgreSQL terminology) can hold many databases.

### File system vs DBMS

Before DBMSs, programs kept data in their own files. Imagine the HR team and the payroll team each keeping a CSV of employees:

| Problem with plain files | What goes wrong | How a DBMS solves it |
|--------------------------|-----------------|----------------------|
| Redundancy | The same employee is stored in both files | One shared database, normalised tables |
| Inconsistency | HR updates an address; payroll's copy is stale | One copy of each fact |
| Hard to query | Every new question needs a new program | Declarative SQL queries |
| No integrity rules | Nothing stops a negative salary | Constraints enforced on every write |
| No atomicity | A crash halfway through a transfer leaves money missing | Transactions roll back incomplete work |
| Concurrent access | Two programs overwrite each other's changes | Locking and MVCC |
| Weak security | File-level permissions only | Per-table, per-column privileges |
| Data dependence | Changing the file layout breaks every program | Programs depend on the schema, not storage |

Files are still the right tool for unstructured blobs (images, logs, backups) — even then, the database usually stores the *path* or metadata.

### Advantages of a DBMS

- **Controlled redundancy** and **consistency** — each fact is stored once.
- **Integrity** — rules are declared once and enforced for every application.
- **Concurrency** — thousands of users read and write safely at the same time.
- **Atomic transactions and crash recovery** — no half-finished updates survive.
- **Security** — fine-grained access control and auditing.
- **Data independence** — storage can change (new index, new disk layout) without changing applications.
- **Powerful querying** — SQL answers new questions without new programs.
- **Backup and restore** — tools such as `pg_dump` and point-in-time recovery.

### Limitations of a DBMS

- **Cost and complexity** — installation, tuning, upgrades, backups and expertise.
- **Overhead** — for a tiny single-user tool, a file or SQLite may be simpler.
- **Performance tuning is needed** at scale — indexes, query design, connection pools.
- **Single point of failure** unless replicated — high availability adds more complexity.
- **Not ideal for every data shape** — huge unstructured blobs or some graph workloads fit other systems better.

### Role of the database administrator (DBA)

A **DBA** is responsible for the database as a running system:

- Installing, configuring and upgrading the DBMS.
- Designing (with developers) and changing schemas safely.
- Managing users, roles and privileges.
- Backups, restore testing and disaster recovery.
- Monitoring performance, tuning queries, indexes and configuration (e.g. `shared_buffers`, autovacuum).
- Capacity planning, replication and high availability.

On many modern teams, backend developers do part of this work (schema migrations with Flyway/Liquibase, query tuning) and a cloud service (Amazon RDS, Cloud SQL, Azure Database for PostgreSQL) does part of the operations.

## Examples

### Asking the DBMS for metadata

The DBMS stores a description of itself — the **system catalog**. In PostgreSQL you can query it like any table:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Output:**

```text
 table_name
-------------
 accounts
 customers
 departments
 employees
 order_items
 orders
 products
(7 rows)
```

### The DBMS enforcing an integrity rule

The sample `employees` table declares `CHECK (salary > 0)`. Every application that writes to it gets the same protection:

```sql
INSERT INTO employees (emp_id, name, dept_id, salary, hire_date)
VALUES (99, 'Test', 10, -500, '2026-01-01');
```

**Output:**

```text
ERROR:  new row for relation "employees" violates check constraint "employees_salary_check"
DETAIL:  Failing row contains (99, Test, null, 10, null, -500, null, 2026-01-01).
```

With plain files, every program writing employee data would have to remember this rule — and one of them eventually would not.

## Comparison

### DBMS vs RDBMS

| Aspect | DBMS (general) | RDBMS |
|--------|----------------|-------|
| Data model | Any: hierarchical, network, document, key-value, graph, relational | Relational: tables of rows and columns |
| Relationships | Model-specific (pointers, nesting, references) | Keys and foreign keys |
| Query language | Varies (APIs, custom languages) | SQL |
| Integrity | Varies | Declarative constraints (PK, FK, UNIQUE, CHECK) |
| Normalisation | Not applicable to every model | Central design principle |
| Transactions | Varies by product | ACID transactions standard |
| Examples | MongoDB, Redis, Cassandra, Neo4j, early IMS | PostgreSQL, MySQL, Oracle, SQL Server |

> [!NOTE]
> Older textbooks describe "DBMS" as single-user, file-like systems without relationships and "RDBMS" as multi-user and relational. That is a historical teaching contrast, not a law: many modern non-relational DBMSs are multi-user and transactional. In interviews, lead with the data model difference.

## Common Mistakes

- Saying "a database is software like MySQL". MySQL is a DBMS; a database is the data it manages.
- Treating DBMS and RDBMS as synonyms. Redis and MongoDB are DBMSs but not relational.
- Listing only "storage" as the DBMS's job. Interviewers want concurrency, integrity, transactions, recovery and security.
- Claiming files are "always worse". For unstructured blobs and logs, files or object storage are often the right choice.

## Revision

- Database = organised persistent data + metadata. DBMS = the software that manages it. RDBMS = DBMS using tables, keys and SQL.
- DBMS jobs: definition, querying, integrity, concurrency, transactions, recovery, security, performance, catalog.
- Files suffer redundancy, inconsistency, no integrity, no atomicity, unsafe concurrency, weak security, data dependence.
- Limitations: cost, complexity, overhead for tiny apps, tuning, single point of failure without replication.
- DBA: install, configure, secure, back up, tune, monitor, plan capacity.

## Quick Revision

A DBMS is the gatekeeper software for a database: it enforces rules, runs queries, isolates concurrent users and recovers from crashes. RDBMS = relational DBMS (tables + SQL), e.g. PostgreSQL.
