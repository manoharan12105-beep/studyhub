# Schema Design Case Studies

**Module:** Database Design · **Interview priority:** Frequently asked

## What Is It?

Three complete, runnable designs that apply ER modeling, relationship mapping, constraints and PostgreSQL features to realistic requirements:

1. **Library** — weak entities, M:N with attributes, "only one active loan per copy".
2. **Hotel booking** — preventing overlapping bookings with an exclusion constraint.
3. **E-commerce orders** — price snapshots, status history and stock that cannot go negative.

Each follows the same path: requirements → entities and rules → tables → the queries the design must answer.

## Why It Matters

- "Design the database for X" is a standard round in backend interviews. Interviewers look for correct keys and relationships, constraints that enforce business rules, awareness of history and concurrency, and indexes for the main queries.
- The difference between a good and a weak answer is usually the rules: what the database itself guarantees.

## Core Concept

### A design checklist

| Area | Questions to answer |
|------|---------------------|
| Entities and keys | What are the things? Natural or surrogate keys? Which natural keys must still be `UNIQUE`? |
| Relationships | Cardinality and participation of each → FK placement, `NOT NULL`, junction tables |
| Rules | Which business rules can be `NOT NULL`, `CHECK`, `UNIQUE` (possibly partial), `FOREIGN KEY`, `EXCLUDE`? Which need triggers or application logic? |
| History | Do we need past values (prices, statuses, addresses)? Snapshot them or keep history tables |
| Time | `timestamptz` for events; who created/updated rows and when |
| Deletes | Hard delete, `ON DELETE CASCADE`, or soft delete (`deleted_at`)? |
| Queries | The top 3–5 queries and the indexes they need (including FK columns) |
| Concurrency | What happens when two users act at once (double booking, overselling, duplicate sign-up)? |
| Growth | `bigint` keys, partitioning candidates (large time-series tables), archiving |

### Patterns used below

- **Partial unique index** — uniqueness only among rows matching a condition: `CREATE UNIQUE INDEX … (copy_id) WHERE returned_on IS NULL` means "at most one *open* loan per copy".
- **Exclusion constraint** — generalises `UNIQUE` to other operators: `EXCLUDE USING gist (room_id WITH =, stay WITH &&)` means "no two rows with the same room and overlapping stays". Requires the `btree_gist` extension for the `=` on a scalar column.
- **Range types** — `daterange('2026-03-10', '2026-03-12')` is half-open `[from, to)`: check-out day is free for the next guest.
- **Price snapshot** — copy the price into the order line at purchase time; product prices change, invoices must not.
- **Status history** — current status on the row plus an append-only history table.
- **`CHECK` for invariants** — `stock >= 0` turns overselling into an error instead of negative stock.

## Syntax

```sql
-- Illustrative
CREATE UNIQUE INDEX one_open_loan ON loans (copy_id) WHERE returned_on IS NULL;

CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE bookings ADD EXCLUDE USING gist (room_id WITH =, stay WITH &&);
```

## Examples

### Case 1: Library

Requirements: *members borrow copies of books; a book has several copies and several authors; a copy can be on loan to only one member at a time; loans record borrow, due and return dates.*

```sql
CREATE TABLE authors (author_id int PRIMARY KEY, name text NOT NULL);
CREATE TABLE books (
    book_id int PRIMARY KEY,
    isbn    text NOT NULL UNIQUE,
    title   text NOT NULL
);
CREATE TABLE book_authors (
    book_id   int NOT NULL REFERENCES books ON DELETE CASCADE,
    author_id int NOT NULL REFERENCES authors,
    PRIMARY KEY (book_id, author_id)
);
CREATE TABLE copies (                      -- weak entity: identified by book + copy number
    book_id int NOT NULL REFERENCES books ON DELETE CASCADE,
    copy_no int NOT NULL,
    PRIMARY KEY (book_id, copy_no)
);
CREATE TABLE members (member_id int PRIMARY KEY, name text NOT NULL);
CREATE TABLE loans (
    loan_id     int  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    book_id     int  NOT NULL,
    copy_no     int  NOT NULL,
    member_id   int  NOT NULL REFERENCES members,
    borrowed_on date NOT NULL,
    due_on      date NOT NULL,
    returned_on date,
    FOREIGN KEY (book_id, copy_no) REFERENCES copies,
    CHECK (due_on > borrowed_on),
    CHECK (returned_on IS NULL OR returned_on >= borrowed_on)
);
CREATE UNIQUE INDEX one_open_loan_per_copy ON loans (book_id, copy_no) WHERE returned_on IS NULL;
CREATE INDEX loans_member_idx ON loans (member_id);

INSERT INTO authors VALUES (1, 'Silberschatz'), (2, 'Korth'), (3, 'Date');
INSERT INTO books VALUES (10, '978-0078022159', 'Database System Concepts'), (11, '978-0321197849', 'An Introduction to Database Systems');
INSERT INTO book_authors VALUES (10, 1), (10, 2), (11, 3);
INSERT INTO copies VALUES (10, 1), (10, 2), (11, 1);
INSERT INTO members VALUES (1, 'Anil'), (2, 'Bhavna');
INSERT INTO loans (book_id, copy_no, member_id, borrowed_on, due_on, returned_on) VALUES
    (10, 1, 1, '2026-03-01', '2026-03-15', '2026-03-10'),
    (10, 1, 2, '2026-03-11', '2026-03-25', NULL),
    (11, 1, 1, '2026-03-05', '2026-03-19', NULL);
```

A copy already on loan cannot be lent again:

```sql
INSERT INTO loans (book_id, copy_no, member_id, borrowed_on, due_on)
VALUES (10, 1, 1, '2026-03-20', '2026-04-03');
```

**Output:**

```text
ERROR:  duplicate key value violates unique constraint "one_open_loan_per_copy"
DETAIL:  Key (book_id, copy_no)=(10, 1) already exists.
```

Overdue loans on 2026-03-22:

```sql
SELECT m.name, b.title, l.copy_no, l.due_on, DATE '2026-03-22' - l.due_on AS days_overdue
FROM loans l
JOIN members m ON m.member_id = l.member_id
JOIN books b   ON b.book_id = l.book_id
WHERE l.returned_on IS NULL AND l.due_on < DATE '2026-03-22'
ORDER BY days_overdue DESC;
```

**Output:**

```text
 name |                title                | copy_no |   due_on   | days_overdue
------+-------------------------------------+---------+------------+--------------
 Anil | An Introduction to Database Systems |       1 | 2026-03-19 |            3
(1 row)
```

Available copies per book:

```sql
SELECT b.title,
       count(*) AS copies,
       count(*) FILTER (WHERE NOT EXISTS (
           SELECT 1 FROM loans l
           WHERE l.book_id = c.book_id AND l.copy_no = c.copy_no AND l.returned_on IS NULL
       )) AS available
FROM books b
JOIN copies c ON c.book_id = b.book_id
GROUP BY b.book_id
ORDER BY b.title;
```

**Output:**

```text
                title                | copies | available
-------------------------------------+--------+-----------
 An Introduction to Database Systems |      1 |         0
 Database System Concepts            |      2 |         1
(2 rows)
```

Design notes: `isbn` is a natural key kept `UNIQUE` even though `book_id` is the primary key; the copy is a weak entity; loan history is kept (returned loans stay) while the partial unique index enforces the "one open loan" rule — something a plain `UNIQUE (book_id, copy_no)` could not do. A rule such as "at most 5 open loans per member" needs a trigger with locking (see [Triggers](../../functions-procedures-triggers/postgresql-triggers/content.md)).

### Case 2: Hotel booking without double booking

Requirements: *guests book rooms for date ranges; a room must never have two overlapping active bookings, even when two requests arrive at the same moment.*

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE rooms (room_id int PRIMARY KEY, room_type text NOT NULL, nightly_rate numeric(10,2) NOT NULL);
CREATE TABLE bookings (
    booking_id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    room_id    int NOT NULL REFERENCES rooms,
    guest      text NOT NULL,
    stay       daterange NOT NULL,
    status     text NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED')),
    CHECK (NOT isempty(stay)),
    EXCLUDE USING gist (room_id WITH =, stay WITH &&) WHERE (status = 'CONFIRMED')
);

INSERT INTO rooms VALUES (101, 'DELUXE', 6000), (102, 'DELUXE', 6000), (201, 'SUITE', 12000);
INSERT INTO bookings (room_id, guest, stay) VALUES
    (101, 'Anil',   daterange('2026-03-10', '2026-03-13')),
    (101, 'Bhavna', daterange('2026-03-13', '2026-03-15')),     -- starts on Anil's check-out day: allowed
    (102, 'Chirag', daterange('2026-03-11', '2026-03-12'));
```

An overlapping booking is rejected by the database:

```sql
INSERT INTO bookings (room_id, guest, stay) VALUES (101, 'Deepa', daterange('2026-03-12', '2026-03-14'));
```

**Output:**

```text
ERROR:  conflicting key value violates exclusion constraint "bookings_room_id_stay_excl"
DETAIL:  Key (room_id, stay)=(101, [2026-03-12,2026-03-14)) conflicts with existing key (room_id, stay)=(101, [2026-03-10,2026-03-13)).
```

Cancelled bookings do not block (the constraint has `WHERE (status = 'CONFIRMED')`). The new booking gets id 5 because the rejected insert had already consumed id 4:

```sql
UPDATE bookings SET status = 'CANCELLED' WHERE guest = 'Bhavna';
INSERT INTO bookings (room_id, guest, stay) VALUES (101, 'Deepa', daterange('2026-03-13', '2026-03-14'))
RETURNING booking_id, room_id, guest, stay;
```

**Output:**

```text
 booking_id | room_id | guest |          stay
------------+---------+-------+-------------------------
          5 |     101 | Deepa | [2026-03-13,2026-03-14)
(1 row)
```

Rooms free for 11–13 March, with the cost of the stay:

```sql
SELECT r.room_id, r.room_type,
       r.nightly_rate * (DATE '2026-03-13' - DATE '2026-03-11') AS total
FROM rooms r
WHERE NOT EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.room_id = r.room_id
      AND b.status = 'CONFIRMED'
      AND b.stay && daterange('2026-03-11', '2026-03-13')
)
ORDER BY r.room_id;
```

**Output:**

```text
 room_id | room_type |  total
---------+-----------+----------
     201 | SUITE     | 24000.00
(1 row)
```

Design notes: an application-level "check availability, then insert" has a race — two requests can both see the room free. The exclusion constraint is checked by the database with index-level locking, so the second concurrent booking fails (and can be retried or reported). `daterange` is half-open, so a check-out day and the next check-in day do not overlap.

### Case 3: E-commerce orders

Requirements: *orders keep the price paid even if the catalogue price changes; every status change is recorded; stock must never become negative.*

```sql
CREATE TABLE catalog (
    sku    text PRIMARY KEY,
    name   text NOT NULL,
    price  numeric(10,2) NOT NULL CHECK (price >= 0),
    stock  int NOT NULL CHECK (stock >= 0)
);
CREATE TABLE shop_orders (
    order_id   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer   text NOT NULL,
    status     text NOT NULL DEFAULT 'PLACED'
               CHECK (status IN ('PLACED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE shop_order_lines (
    order_id   bigint NOT NULL REFERENCES shop_orders ON DELETE CASCADE,
    sku        text   NOT NULL REFERENCES catalog,
    qty        int    NOT NULL CHECK (qty > 0),
    unit_price numeric(10,2) NOT NULL,                  -- snapshot of catalog.price
    PRIMARY KEY (order_id, sku)
);
CREATE TABLE order_status_history (
    order_id   bigint NOT NULL REFERENCES shop_orders ON DELETE CASCADE,
    status     text   NOT NULL,
    changed_at timestamptz NOT NULL,
    PRIMARY KEY (order_id, changed_at)
);
INSERT INTO catalog VALUES ('KB-1', 'Keyboard', 1500, 10), ('MS-1', 'Mouse', 500, 3);
```

Placing an order: lines copy the current price, stock is decremented, all in one transaction:

```sql
BEGIN;
INSERT INTO shop_orders (customer) VALUES ('Anil');
INSERT INTO shop_order_lines (order_id, sku, qty, unit_price)
SELECT 1, sku, 2, price FROM catalog WHERE sku = 'MS-1';
UPDATE catalog SET stock = stock - 2 WHERE sku = 'MS-1';
INSERT INTO order_status_history VALUES (1, 'PLACED', '2026-03-01 10:00+00');
COMMIT;

UPDATE catalog SET price = 550 WHERE sku = 'MS-1';          -- later price rise

SELECT l.sku, l.qty, l.unit_price AS paid, c.price AS current_price, c.stock
FROM shop_order_lines l JOIN catalog c ON c.sku = l.sku;
```

**Output:**

```text
 sku  | qty |  paid  | current_price | stock
------+-----+--------+---------------+-------
 MS-1 |   2 | 500.00 |        550.00 |     1
(1 row)
```

Bhavna buys the last mouse; then one more unit is requested:

```sql
BEGIN;
INSERT INTO shop_orders (customer) VALUES ('Bhavna');
UPDATE catalog SET stock = stock - 1 WHERE sku = 'MS-1';
INSERT INTO shop_order_lines VALUES (2, 'MS-1', 1, 550);
COMMIT;

UPDATE catalog SET stock = stock - 1 WHERE sku = 'MS-1';
```

**Output:**

```text
ERROR:  new row for relation "catalog" violates check constraint "catalog_stock_check"
DETAIL:  Failing row contains (MS-1, Mouse, 550.00, -1).
```

The second order took the last unit (stock 0); a further decrement violates `CHECK (stock >= 0)` instead of overselling. Because the `UPDATE … SET stock = stock - n` row-locks the catalog row, concurrent orders queue on it and each sees the latest stock.

Status history:

```sql
SET TIME ZONE 'UTC';
UPDATE shop_orders SET status = 'PAID' WHERE order_id = 1;
INSERT INTO order_status_history VALUES (1, 'PAID', '2026-03-01 10:05+00');

SELECT o.order_id, o.status AS current_status, h.status, h.changed_at
FROM shop_orders o JOIN order_status_history h ON h.order_id = o.order_id
WHERE o.order_id = 1
ORDER BY h.changed_at;
```

**Output:**

```text
 order_id | current_status | status |       changed_at
----------+----------------+--------+------------------------
        1 | PAID           | PLACED | 2026-03-01 10:00:00+00
        1 | PAID           | PAID   | 2026-03-01 10:05:00+00
(2 rows)
```

Design notes: `unit_price` in the order line is deliberate redundancy — it records a historical fact, not a copy that must stay in sync, so it does not violate normalization. Writing history rows is often automated with a trigger. Amounts use `numeric`, ids `bigint`.

## Comparison

### Enforcing a business rule

| Rule | Mechanism |
|------|-----------|
| Value present / in range / from a list | `NOT NULL`, `CHECK` |
| Unique among all rows | `UNIQUE` / primary key |
| Unique among some rows (open loans, active addresses) | Partial unique index |
| No overlapping ranges (bookings, price validity periods) | `EXCLUDE USING gist` with range types |
| Must reference an existing row | `FOREIGN KEY` |
| Cross-row counts ("max 5 loans"), cross-table conditions | Trigger with locking, or serializable transactions, or application logic |

## Common Mistakes

- Checking availability or stock in the application and then writing, without a constraint or lock — race conditions.
- Joining order lines to the current product price for invoices.
- Overwriting statuses with no history when the business needs an audit trail.
- Using `UNIQUE` where the rule applies only to active rows.
- Inclusive date ranges for stays, making check-out and check-in days collide.
- Missing indexes on foreign keys and on the columns of the main queries.

## Revision

- Design path: requirements → entities, keys, relationships → constraints for every rule → history and time → indexes for top queries → concurrency.
- Partial unique index: uniqueness among a subset (`WHERE returned_on IS NULL`).
- Exclusion constraint + `daterange` + `btree_gist`: no overlapping bookings, race-safe.
- Snapshot prices in order lines; keep status history; `CHECK (stock >= 0)` stops overselling.
- Cross-row rules need triggers, serializable isolation or application logic.

## Quick Revision

Turn every business rule into a constraint where possible — partial unique indexes for "one active", exclusion constraints for "no overlap", CHECK for invariants — snapshot values that must not change, keep history, and index the main queries.
