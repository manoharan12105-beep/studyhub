# 30 Minutes: Important Concepts

Block 1 of 5. One line per concept across DBMS theory, design and transactions.

## DBMS

- **DBMS** — manages shared data with integrity, concurrency, recovery, security and a query language.
- **Three-schema architecture** — external / conceptual / internal → logical and physical data independence.
- **Schema vs instance** — structure vs current data.
- **OLTP vs OLAP** — many small transactions vs large analytical reads.
- **SQL vs NoSQL** — relational + ACID + joins vs flexible models for scale-out.

## Relational Model and Keys

- **Relation / tuple / attribute** — table / row / column; a relation has no duplicates and no order.
- **Super ⊇ candidate → primary (+ alternate)** keys; **foreign key** references a candidate key.
- **Composite key** — several columns; **surrogate** (generated) vs **natural** key.
- **Integrity** — entity (PK), referential (FK), domain (types, `CHECK`, `NOT NULL`).
- **`ON DELETE`** — `NO ACTION` (default), `RESTRICT`, `CASCADE`, `SET NULL`, `SET DEFAULT`.

## Design and Normalization

- **ER** — entities, attributes, relationships (1:1, 1:N, M:N), weak entities.
- **M:N** → junction table; **1:N** → FK on the N side.
- **FD** X → Y; closure X⁺; candidate key = minimal X with X⁺ = all attributes.
- **1NF** atomic · **2NF** no partial dependency · **3NF** no transitive dependency · **BCNF** every determinant a super key.
- **Anomalies** — insert, update, delete — caused by redundancy.
- **Denormalization** — redundancy on purpose for reads, kept in sync.

## Transactions

- **ACID** — atomic, consistent, isolated, durable.
- **Anomalies** — dirty read, non-repeatable read, phantom, lost update, write skew.
- **Isolation** — Read Committed (PG default), Repeatable Read (snapshot), Serializable (SSI).
- **Locks** — row (`FOR UPDATE`), table; **deadlock** = wait cycle → one aborted.
- **MVCC** — versions + snapshots; readers and writers don't block each other.
- **WAL** — log before data; durability and recovery.

## Storage and Indexes

- **Page** 8 kB; **buffer pool** caches pages; tables are **heaps** in PostgreSQL.
- **B-tree** — balanced, O(log n), equality + range + order; other types: hash, GIN, GiST, BRIN.
- **Indexes** speed reads, slow writes; FK columns need their own index.

## Self-Check (answer aloud)

1. Candidate vs primary vs super key?
2. Why is 2NF only about composite keys?
3. What does Repeatable Read prevent that Read Committed does not?
4. What does MVCC give readers?
5. Why does a foreign key column need an index?
