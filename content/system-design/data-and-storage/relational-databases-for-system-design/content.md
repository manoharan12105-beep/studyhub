# Relational Databases in System Design

**Module:** Data and Storage · **Interview priority:** Core

## What Is It?

A **relational (SQL) database** — PostgreSQL, MySQL, Oracle, SQL Server — stores data as **tables** of rows and columns with a fixed **schema**, links tables through **keys**, and answers questions with SQL, including **joins** across tables. Its defining strengths are **constraints** that keep data valid and **transactions** that keep changes all-or-nothing.

Servers lose their memory when restarted; databases keep data durably on disk. For most systems a relational database is the default first store.

For SQL itself, see the DBMS subject: [SQL Constraints](../../../dbms-postgresql/relational-model/sql-constraints/content.md) and [Database Transactions](../../../dbms-postgresql/transactions/database-transactions/content.md).

## Why It Exists

Most business data is **structured** (every order has the same fields) and **related** (orders belong to customers and contain products). Relational databases enforce that structure and those relationships so application bugs cannot silently corrupt data, and transactions keep multi-step changes consistent even when servers crash mid-way.

## How It Works

### Tables, keys and constraints

```text
users
 id (PRIMARY KEY) │ username (UNIQUE) │ name (NOT NULL) │ phone (CHECK: digits) │ role (DEFAULT 'student')
 1                │ ash               │ Aksha           │ 9876543210            │ student
 2                │ gaurav            │ Gaurav          │ 9123456780            │ trainer
```

| Constraint | Guarantees | Example |
|------------|-----------|---------|
| PRIMARY KEY | Each row is uniquely identifiable | `id = 3` returns exactly one row |
| UNIQUE | No duplicates in a column | Usernames, emails |
| NOT NULL | A value must be present | First name |
| CHECK | Values follow a rule | Price ≥ 0, phone is digits |
| FOREIGN KEY | A reference points to an existing row | `posts.author_id → users.id` |
| DEFAULT | A value is filled in if omitted | `plan = 'free'` |

### Relationships

```text
1 → N   one user, many posts            posts.author_id → users.id
N ↔ N   students and courses            junction table students_courses(student_id, course_id)
1 → 1   split rarely-used or heavy data  user_profiles.user_id → users.id (unique)
```

A many-to-many relationship always needs a **junction table** holding both foreign keys.

### Transactions and ACID

A **transaction** groups changes into one unit. Deleting a photo also deletes its likes and comments — either all three changes happen or none do, so you never keep likes on a deleted photo.

```sql
-- Illustrative
BEGIN;
DELETE FROM comments WHERE photo_id = 42;
DELETE FROM likes    WHERE photo_id = 42;
DELETE FROM photos   WHERE id = 42;
COMMIT;
```

- **Atomicity:** all changes or none.
- **Consistency:** constraints hold before and after.
- **Isolation:** concurrent transactions do not see each other's half-finished work (at the configured isolation level).
- **Durability:** once committed, the change survives a crash (written to the write-ahead log).

### What relational databases do well — and where they strain

| Strength | Strain at scale |
|----------|-----------------|
| Flexible queries, joins, aggregations on any column | Joins and transactions across machines are hard, so scaling **writes** beyond one primary needs sharding |
| Strong consistency and transactions | One primary handles all writes; it is the scaling ceiling |
| Mature tooling, well understood | Schema changes on huge tables need care (online migrations) |
| Constraints protect data | Very high write rates of simple records may be cheaper elsewhere |

Reads scale well with **read replicas** and **caches**; writes scale with **vertical scaling** first and **sharding** last. A single well-tuned PostgreSQL primary on modern hardware handles thousands to tens of thousands of simple writes per second, which covers most products.

**Think about it:** why does a photo app's core data (users, photos, likes, follows) fit a relational database well?

<details>
<summary>Answer</summary>

It is structured (every photo has the same fields), heavily related (follows link users; likes link users and photos), needs joins for questions like "photos by people I follow", and benefits from constraints (one like per user per photo) and transactions (deleting a photo with its likes and comments). Volume is large but the metadata write rate is modest; the heavy bytes (images) live in object storage.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** "SQL databases don't scale." They scale reads easily with replicas and caches, and a single primary handles far more writes than most products ever need. They become hard to scale only for very high write volumes or data sizes beyond one machine — then sharding or a distributed SQL database is needed.

## Interview Follow-up

- *"Why choose PostgreSQL here?"* Because the data is structured and relational, the feed and profile queries need joins and secondary indexes, and likes, follows and payments benefit from constraints and transactions — at a write rate one primary can handle.

## Key Takeaways

- Relational databases store structured data in tables linked by keys and enforce validity with constraints.
- Relationships: 1→N via foreign keys, N↔N via junction tables, 1→1 to split data.
- Transactions give ACID guarantees: all-or-nothing, valid, isolated, durable.
- Reads scale with replicas and caches; writes are bound to one primary until you shard.
