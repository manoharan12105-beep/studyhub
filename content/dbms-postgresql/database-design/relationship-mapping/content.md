# Mapping Relationships to Tables

**Module:** Database Design · **Interview priority:** Core

## What Is It?

**Relationship mapping** is the step that turns an ER model into tables: deciding, for each relationship, where the foreign key goes, whether a separate table is needed, and which constraints (`NOT NULL`, `UNIQUE`, `ON DELETE …`) express its cardinality and participation.

| Relationship | Implementation |
|--------------|----------------|
| One-to-many | Foreign key on the "many" side |
| One-to-one | Foreign key + `UNIQUE` (or a shared primary key) |
| Many-to-many | Junction table with two foreign keys |
| Self-referencing | Foreign key to the same table |

## Why It Matters

- "How do you implement a many-to-many relationship?" is one of the most common database interview questions.
- Constraints placed correctly let the database enforce the rules (a profile belongs to exactly one user, an enrollment cannot be duplicated) instead of hoping every code path does.
- ORMs such as JPA/Hibernate (`@OneToMany`, `@ManyToMany`, `@JoinTable`, `@Inheritance`) generate or expect exactly these table shapes.

## Core Concept

### One-to-many (1:N)

Put the foreign key in the table on the **many** side, referencing the **one** side:

```text
departments (dept_id PK)  1 ────< N  employees (emp_id PK, dept_id FK → departments)
```

- Total participation of the many side → `dept_id NOT NULL`. Partial → nullable.
- Index the foreign key column: PostgreSQL does not create one automatically, and joins plus parent deletes/updates need it.
- Choose `ON DELETE` behaviour: `RESTRICT`/`NO ACTION` (default), `CASCADE` (children cannot exist alone), `SET NULL` (optional relationship).

### One-to-one (1:1)

Options:

| Option | How | When |
|--------|-----|------|
| Foreign key + `UNIQUE` | `user_profiles.user_id REFERENCES users UNIQUE` | Optional side refers to the mandatory side |
| Shared primary key | `user_profiles.user_id` is both PK and FK | Profile is a strict extension of the user |
| Same table | Merge the columns | No reason to separate |

Reasons to split a 1:1: optional data that most rows lack, large or rarely read columns, different access permissions, or a different lifecycle. The side whose rows may not exist should hold the foreign key.

### Many-to-many (M:N)

Relational tables cannot store a list in a column (1NF), so an M:N relationship becomes a **junction table** (also called associative, bridge, link or cross-reference table):

```text
orders (order_id PK) 1 ──< order_items (order_id FK, product_id FK, quantity, unit_price) >── 1 products (product_id PK)
                              PRIMARY KEY (order_id, product_id)
```

- Primary key: the pair of foreign keys (prevents duplicates), **or** a surrogate id plus `UNIQUE (a_id, b_id)` if the link itself is referenced elsewhere or the same pair may legitimately repeat (e.g. a student retaking a course in a different semester → include the semester in the key).
- Relationship attributes (quantity, role, enrolled_on) are columns of the junction table.
- The composite PK `(a_id, b_id)` serves lookups by `a_id`; add an index on `b_id` for the other direction.

### Self-referencing relationships

A foreign key to the same table models hierarchies (employee → manager, category → parent category, comment → reply):

```text
employees (emp_id PK, manager_id FK → employees.emp_id)       1:N, unary
```

An M:N self-relationship (user follows user, product is similar to product) uses a junction table with two foreign keys to the same table, plus a `CHECK (a_id <> b_id)` when self-links make no sense.

### Ternary relationships

A relationship among three entity sets becomes a table with three foreign keys; the primary key depends on the rules. For DOCTOR *prescribes* MEDICINE to PATIENT on a visit, the key might be `(visit_id, medicine_id)`, with the doctor and patient determined by the visit.

### Attributes

| ER element | Table design |
|------------|--------------|
| Composite attribute (address) | Separate columns (`street`, `city`, `pincode`) — or a separate table if shared/multiple |
| Multi-valued attribute (phone numbers) | Separate table `(owner_id, value)` with PK on both |
| Derived attribute (age, order total) | Not stored; compute in queries/views, or a generated column if it depends only on the same row |
| Weak entity | Table with PK `(owner_id, partial_key)`, FK to owner `ON DELETE CASCADE` |

### Inheritance (specialization)

Three standard strategies (JPA names in brackets):

| Strategy | Tables | Pros | Cons |
|----------|--------|------|------|
| Single table (`SINGLE_TABLE`) | One table with a type column and nullable sub-type columns | Fast, no joins, simple polymorphic queries | Many `NULL`s; sub-type `NOT NULL` rules need `CHECK` constraints |
| Table per sub-type with shared PK (`JOINED`) | Parent table + one table per sub-type, PK = FK to parent | Normalized, constraints per sub-type | Joins for every full read |
| Table per concrete class (`TABLE_PER_CLASS`) | One complete table per sub-type, no parent table | No joins for one type | Polymorphic queries need `UNION`; ids must be unique across tables |

## Syntax

```sql
-- Illustrative
-- 1:N
child.parent_id integer NOT NULL REFERENCES parent (parent_id) ON DELETE CASCADE
-- 1:1
profile.user_id integer NOT NULL UNIQUE REFERENCES users (user_id)
-- M:N
CREATE TABLE a_b (a_id int REFERENCES a, b_id int REFERENCES b, PRIMARY KEY (a_id, b_id));
-- self
employees.manager_id integer REFERENCES employees (emp_id)
```

## Examples

### One-to-one with a shared primary key

```sql
CREATE TABLE app_users (
    user_id integer PRIMARY KEY,
    email   text NOT NULL UNIQUE
);
CREATE TABLE user_profiles (
    user_id integer PRIMARY KEY REFERENCES app_users (user_id) ON DELETE CASCADE,  -- shared PK
    bio     text,
    avatar  bytea
);
INSERT INTO app_users VALUES (1, 'anil@mail.com'), (2, 'meera@mail.com');
INSERT INTO user_profiles (user_id, bio) VALUES (1, 'Backend developer');
INSERT INTO user_profiles (user_id, bio) VALUES (1, 'Second profile');
```

**Output:**

```text
ERROR:  duplicate key value violates unique constraint "user_profiles_pkey"
DETAIL:  Key (user_id)=(1) already exists.
```

The shared primary key makes a second profile for user 1 impossible; user 2 simply has none (partial participation).

### Many-to-many: students and courses

```sql
CREATE TABLE students (student_id int PRIMARY KEY, name text NOT NULL);
CREATE TABLE courses  (course_id  text PRIMARY KEY, title text NOT NULL);
CREATE TABLE enrollments (
    student_id  int  NOT NULL REFERENCES students (student_id) ON DELETE CASCADE,
    course_id   text NOT NULL REFERENCES courses (course_id),
    enrolled_on date NOT NULL DEFAULT CURRENT_DATE,
    grade       char(1),
    PRIMARY KEY (student_id, course_id)
);
CREATE INDEX enrollments_course_idx ON enrollments (course_id);

INSERT INTO students VALUES (1, 'Asha'), (2, 'Ravi'), (3, 'Meena');
INSERT INTO courses VALUES ('DB101', 'Databases'), ('JV201', 'Java'), ('OS301', 'Operating Systems');
INSERT INTO enrollments (student_id, course_id, grade) VALUES
    (1, 'DB101', 'A'), (1, 'JV201', 'B'), (2, 'DB101', NULL), (3, 'OS301', 'A');

SELECT s.name, c.title, e.grade
FROM enrollments e
JOIN students s ON s.student_id = e.student_id
JOIN courses c  ON c.course_id = e.course_id
ORDER BY s.name, c.title;
```

**Output:**

```text
 name  |       title       | grade
-------+-------------------+-------
 Asha  | Databases         | A
 Asha  | Java              | B
 Meena | Operating Systems | A
 Ravi  | Databases         | NULL
(4 rows)
```

The composite primary key rejects a duplicate enrollment:

```sql
INSERT INTO enrollments (student_id, course_id) VALUES (1, 'DB101');
```

**Output:**

```text
ERROR:  duplicate key value violates unique constraint "enrollments_pkey"
DETAIL:  Key (student_id, course_id)=(1, DB101) already exists.
```

Both directions of the relationship are simple joins:

```sql
SELECT c.title, count(e.student_id) AS students
FROM courses c
LEFT JOIN enrollments e ON e.course_id = c.course_id
GROUP BY c.course_id
ORDER BY c.title;
```

**Output:**

```text
       title       | students
-------------------+----------
 Databases         |        2
 Java              |        1
 Operating Systems |        1
(3 rows)
```

### Multi-valued attribute

```sql
CREATE TABLE contacts (contact_id int PRIMARY KEY, name text NOT NULL);
CREATE TABLE contact_phones (
    contact_id int  NOT NULL REFERENCES contacts ON DELETE CASCADE,
    phone      text NOT NULL,
    label      text NOT NULL DEFAULT 'mobile',
    PRIMARY KEY (contact_id, phone)
);
INSERT INTO contacts VALUES (1, 'Anil');
INSERT INTO contact_phones VALUES (1, '+91-90000-00001', 'mobile'), (1, '+91-44-2000-0000', 'office');

SELECT c.name, string_agg(p.label || ': ' || p.phone, ', ' ORDER BY p.label) AS phones
FROM contacts c JOIN contact_phones p ON p.contact_id = c.contact_id
GROUP BY c.contact_id;
```

**Output:**

```text
 name |                      phones
------+---------------------------------------------------
 Anil | mobile: +91-90000-00001, office: +91-44-2000-0000
(1 row)
```

`REFERENCES contacts` without a column list references the primary key.

### Self-referencing many-to-many: followers

```sql
SET TIME ZONE 'UTC';
CREATE TABLE members (member_id int PRIMARY KEY, handle text NOT NULL UNIQUE);
CREATE TABLE follows (
    follower_id int NOT NULL REFERENCES members,
    followee_id int NOT NULL REFERENCES members,
    followed_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, followee_id),
    CHECK (follower_id <> followee_id)
);
INSERT INTO members VALUES (1, 'anil'), (2, 'bhavna'), (3, 'chirag');
INSERT INTO follows (follower_id, followee_id) VALUES (1, 2), (2, 1), (3, 1);
INSERT INTO follows VALUES (2, 2, '2026-03-01 10:00+00');
```

**Output:**

```text
ERROR:  new row for relation "follows" violates check constraint "follows_check"
DETAIL:  Failing row contains (2, 2, 2026-03-01 10:00:00+00).
```

Mutual follows ("friends") are pairs that exist in both directions:

```sql
SELECT a.handle AS member, b.handle AS mutual_with
FROM follows f
JOIN follows back ON back.follower_id = f.followee_id AND back.followee_id = f.follower_id
JOIN members a ON a.member_id = f.follower_id
JOIN members b ON b.member_id = f.followee_id
WHERE f.follower_id < f.followee_id;
```

**Output:**

```text
 member | mutual_with
--------+-------------
 anil   | bhavna
(1 row)
```

### Inheritance: single table vs joined

Single table with a discriminator and `CHECK`s for sub-type rules:

```sql
CREATE TABLE payments (
    payment_id   int PRIMARY KEY,
    kind         text NOT NULL CHECK (kind IN ('CARD', 'UPI')),
    amount       numeric(12,2) NOT NULL,
    card_last4   char(4),
    upi_handle   text,
    CHECK ((kind = 'CARD' AND card_last4 IS NOT NULL AND upi_handle IS NULL)
        OR (kind = 'UPI'  AND upi_handle IS NOT NULL AND card_last4 IS NULL))
);
INSERT INTO payments VALUES (1, 'CARD', 1500, '4242', NULL), (2, 'UPI', 250, NULL, 'anil@okbank');
INSERT INTO payments VALUES (3, 'UPI', 99, '4242', NULL);
```

**Output:**

```text
ERROR:  new row for relation "payments" violates check constraint "payments_check"
DETAIL:  Failing row contains (3, UPI, 99.00, 4242, null).
```

Joined (table per sub-type, shared key):

```sql
CREATE TABLE payments_base (payment_id int PRIMARY KEY, amount numeric(12,2) NOT NULL);
CREATE TABLE card_payments (payment_id int PRIMARY KEY REFERENCES payments_base ON DELETE CASCADE,
                            card_last4 char(4) NOT NULL);
CREATE TABLE upi_payments  (payment_id int PRIMARY KEY REFERENCES payments_base ON DELETE CASCADE,
                            upi_handle text NOT NULL);
INSERT INTO payments_base VALUES (1, 1500), (2, 250);
INSERT INTO card_payments VALUES (1, '4242');
INSERT INTO upi_payments VALUES (2, 'anil@okbank');

SELECT b.payment_id, b.amount,
       CASE WHEN c.payment_id IS NOT NULL THEN 'CARD' ELSE 'UPI' END AS kind,
       coalesce(c.card_last4, u.upi_handle) AS detail
FROM payments_base b
LEFT JOIN card_payments c ON c.payment_id = b.payment_id
LEFT JOIN upi_payments u  ON u.payment_id = b.payment_id
ORDER BY b.payment_id;
```

**Output:**

```text
 payment_id | amount  | kind |   detail
------------+---------+------+-------------
          1 | 1500.00 | CARD | 4242
          2 |  250.00 | UPI  | anil@okbank
(2 rows)
```

Sub-type columns can be `NOT NULL` here, but reading a full payment needs joins, and nothing stops a payment from being in both sub-tables (that needs a discriminator column with a composite foreign key, or a trigger).

## Comparison

### Where the foreign key goes

| Relationship | Foreign key in | Extra constraint |
|--------------|----------------|------------------|
| 1:N | The N-side table | `NOT NULL` if participation is total |
| 1:1 | The optional side | `UNIQUE` (or make it the PK) |
| M:N | A new junction table (two FKs) | Composite PK or `UNIQUE (a, b)` |
| Unary 1:N | The same table | Optional `CHECK (id <> parent_id)` |
| Weak entity | The weak entity's table | FK is part of the PK, `ON DELETE CASCADE` |

## Common Mistakes

- Storing comma-separated ids or an array instead of a junction table.
- Putting the foreign key on the "one" side of a 1:N (each department storing an employee id).
- A junction table without a primary key or unique constraint — duplicate links appear.
- Forgetting to index foreign keys, making joins and parent deletes slow.
- Using `ON DELETE CASCADE` on relationships where children should survive (orders when a product is discontinued).
- Splitting 1:1 data into separate tables without a reason, adding joins everywhere.
- Single-table inheritance without `CHECK` constraints, allowing invalid combinations.

## Revision

- 1:N → FK on the many side (`NOT NULL` for total participation, index it).
- 1:1 → FK + `UNIQUE`, or shared PK; FK on the optional side.
- M:N → junction table, two FKs, composite PK; relationship attributes live there.
- Self-referencing → FK to the same table; self M:N → junction with two FKs to it.
- Multi-valued attribute → own table; derived → not stored; weak entity → PK includes owner FK.
- Inheritance: single table, joined (shared PK), or table per concrete class.

## Quick Revision

1:N puts the FK on the many side, 1:1 uses an FK plus UNIQUE (or a shared primary key), and M:N needs a junction table with two FKs and a composite key. Self-relationships reference their own table, and multi-valued attributes and weak entities get their own tables.
