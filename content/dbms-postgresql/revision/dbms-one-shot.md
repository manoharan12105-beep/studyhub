# DBMS One-Shot Revision

All of DBMS theory on one page: definitions, keys, constraints, design, normalization, transactions and storage.

## DBMS Basics

- **DBMS** — software that stores, retrieves and protects shared data: integrity, concurrency control, recovery, security, a query language and data independence.
- **File system vs DBMS** — files duplicate data, have no concurrency control, recovery, fine-grained security or ad-hoc queries.
- **Data model** — how data is structured: hierarchical, network, relational, document, key-value, graph.
- **Schema vs instance** — structure (changes rarely, DDL) vs current data (changes constantly).
- **Three-schema architecture** — external (views) → conceptual (tables, constraints) → internal (files, indexes); gives logical and physical **data independence**.
- **DBMS components** — query processor (parser, planner, executor), storage manager (buffer pool, files, access methods), transaction manager (concurrency, recovery), catalog (metadata).
- **OLTP vs OLAP** — many short reads/writes on current, normalised data vs few large analytical reads on historical, denormalised (star schema) data.
- **SQL vs NoSQL** — relational schema, joins, ACID vs flexible models built for scale-out and specific access patterns; PostgreSQL's `jsonb` covers many document needs.

## Relational Model

- **Relation / tuple / attribute / domain** — table / row / column / allowed values.
- A relation is a **set**: no duplicate tuples, no order; SQL tables relax this, so declare keys and use `ORDER BY`.
- **Relational algebra** — selection σ (`WHERE`), projection π (`SELECT` list), join ⋈, union, difference (`EXCEPT`), intersection, product (`CROSS JOIN`), rename (aliases).

## Keys

| Key | Meaning |
|-----|---------|
| Super key | Any column set that uniquely identifies rows |
| Candidate key | Minimal super key |
| Primary key | Chosen candidate key; unique + not null; one per table |
| Alternate key | Other candidate keys (`UNIQUE`) |
| Foreign key | References a candidate key of another (or the same) table |
| Composite key | Key with several columns |
| Surrogate vs natural | Generated id vs real-world identifier |

## Constraints and Integrity

- **Entity integrity** — primary key unique and not null.
- **Referential integrity** — foreign keys point to existing rows; `ON DELETE` actions: `NO ACTION` (default), `RESTRICT`, `CASCADE`, `SET NULL`, `SET DEFAULT`.
- **Domain integrity** — types, `NOT NULL`, `CHECK`, `DEFAULT`.
- `UNIQUE` allows several `NULL`s (unless `NULLS NOT DISTINCT`, PostgreSQL 15+).

## Database Design

- **ER model** — entities (rectangles), attributes, relationships with cardinality (1:1, 1:N, M:N) and participation (total/partial); weak entities depend on an owner's key.
- **Mapping** — 1:N → foreign key on the N side; M:N → junction table with a composite key; 1:1 → unique foreign key; multivalued attribute → separate table.
- **Surrogate keys** for most tables; natural keys enforced with `UNIQUE`.

## Normalization

- **Functional dependency** X → Y: equal X values imply equal Y values.
- **Closure** X⁺ finds what X determines; a candidate key's closure is all attributes.
- **1NF** — atomic values, no repeating groups.
- **2NF** — 1NF + no partial dependency on part of a composite key.
- **3NF** — 2NF + no transitive dependency (non-key → non-key).
- **BCNF** — every non-trivial determinant is a super key.
- **Anomalies** — insertion, update and deletion problems caused by redundancy.
- Decompositions should be **lossless** (always) and **dependency-preserving** (when possible; BCNF may lose it).
- **Denormalization** — deliberate redundancy (stored totals, summary tables, materialized views) for reads, kept in sync by triggers, jobs or code.

## Transactions and Concurrency

- **ACID** — atomicity (all or nothing), consistency (constraints hold), isolation (concurrent transactions don't interfere), durability (committed = survives a crash).
- **Anomalies** — dirty read, non-repeatable read, phantom, lost update, write skew.
- **Isolation levels** — Read Uncommitted, Read Committed, Repeatable Read, Serializable; PostgreSQL: RC default, RR = snapshot, Serializable = SSI.
- **Locking** — shared/exclusive, row vs table, two-phase locking in classic theory; deadlock = cycle of waits → victim aborted.
- **MVCC** — readers see a snapshot; writers create new row versions; readers and writers don't block each other.

## Storage, Indexes and Recovery

- Data lives in fixed-size **pages** (8 kB in PostgreSQL); a **buffer pool** caches them.
- **Indexes** — B-tree (default; equality, range, order), hash, bitmap/GIN/GiST/BRIN; speed reads, slow writes.
- **Clustered vs non-clustered** — table stored in index order vs separate index; PostgreSQL tables are heaps, all indexes secondary.
- **WAL / recovery** — log changes before data pages; redo committed work after a crash; checkpoints limit replay.
- **Query processing** — parse → rewrite → plan (cost-based, statistics) → execute.

## Last Lines to Remember

Keys identify, constraints protect, normalization removes redundancy, transactions make change safe, indexes make reads fast, and WAL makes commits durable.
