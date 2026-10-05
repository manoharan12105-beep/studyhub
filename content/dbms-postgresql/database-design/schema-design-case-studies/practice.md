# Schema Design Case Studies — Practice

### P1. Choose the mechanism

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** constraints for business rules

"A customer can have many addresses, but at most one marked as default." Which mechanism enforces this best?

- A) `UNIQUE (customer_id)`
- B) `UNIQUE (customer_id, is_default)`
- C) A partial unique index on `(customer_id) WHERE is_default`
- D) A `CHECK (is_default IN (true, false))`

<details>
<summary>Answer</summary>

**Answer:** C)

**Explanation:** A allows only one address per customer. B also limits non-default addresses to one per customer (`(1, false)` twice is a duplicate). D checks nothing useful. The partial index applies uniqueness only to default rows.

</details>

### P2. One default address

**Difficulty:** Medium · **Type:** Query · **Concepts:** partial unique index

Create `customer_addresses (address_id, customer_id, line, is_default)` for the sample customers with the partial unique index, insert two addresses for Anil (one default), then show that a second default for Anil fails.

**Expected output:**

```text
ERROR:  duplicate key value violates unique constraint "one_default_address"
DETAIL:  Key (customer_id)=(1) already exists.
```

<details>
<summary>Solution</summary>

```sql
CREATE TABLE customer_addresses (
    address_id  int PRIMARY KEY,
    customer_id int NOT NULL REFERENCES customers,
    line        text NOT NULL,
    is_default  boolean NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX one_default_address ON customer_addresses (customer_id) WHERE is_default;

INSERT INTO customer_addresses VALUES (1, 1, '12 Anna Salai', true), (2, 1, '5 Beach Road', false);
INSERT INTO customer_addresses VALUES (3, 1, '9 Mount Road', true);
```

</details>

### P3. Non-overlapping price periods

**Difficulty:** Hard · **Type:** Design · **Concepts:** exclusion constraint, range types

Prices are valid for date ranges; a product must not have two prices valid on the same day. Design `product_prices`, insert a valid history for product 2, and show that an overlapping period is rejected. Then query the price valid on 2026-03-15.

**Expected output:**

```text
ERROR:  conflicting key value violates exclusion constraint "product_prices_product_id_valid_excl"
DETAIL:  Key (product_id, valid)=(2, [2026-02-15,2026-04-01)) conflicts with existing key (product_id, valid)=(2, [2026-01-01,2026-03-01)).
 price
--------
 520.00
(1 row)
```

<details>
<summary>Hint</summary>

Use `daterange` with an `EXCLUDE USING gist (product_id WITH =, valid WITH &&)` constraint; an open-ended current period is `daterange('2026-03-01', NULL)`. Find the price with `valid @> DATE '2026-03-15'`.

</details>

<details>
<summary>Solution</summary>

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE product_prices (
    product_id int NOT NULL REFERENCES products,
    valid      daterange NOT NULL,
    price      numeric(10,2) NOT NULL,
    EXCLUDE USING gist (product_id WITH =, valid WITH &&)
);
INSERT INTO product_prices VALUES
    (2, daterange('2026-01-01', '2026-03-01'), 500),
    (2, daterange('2026-03-01', NULL),         520);
INSERT INTO product_prices VALUES (2, daterange('2026-02-15', '2026-04-01'), 480);

SELECT price FROM product_prices WHERE product_id = 2 AND valid @> DATE '2026-03-15';
```

**Explanation:** The rejected period overlaps both existing ones. A `NULL` upper bound means "until further notice".

</details>

### P4. Why did we oversell?

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** lost update, atomic UPDATE

An application sells concert tickets with this logic, in a transaction at the default isolation level:

```text
1. SELECT remaining FROM events WHERE id = 7;         -- reads 1
2. if remaining >= 1: UPDATE events SET remaining = <value read - 1> WHERE id = 7;
3. INSERT INTO tickets …;
```

Two buyers ran it at the same moment and both got the last ticket. Explain and fix it in SQL.

<details>
<summary>Answer</summary>

Both transactions read `remaining = 1` before either wrote, both computed 0 and both inserted a ticket — a lost update. Make the check and the decrement one atomic statement, so the row lock serializes buyers and the second sees the first's change:

```sql
CREATE TABLE events (id int PRIMARY KEY, remaining int NOT NULL CHECK (remaining >= 0));
INSERT INTO events VALUES (7, 1);

UPDATE events SET remaining = remaining - 1 WHERE id = 7 AND remaining >= 1 RETURNING remaining;
UPDATE events SET remaining = remaining - 1 WHERE id = 7 AND remaining >= 1 RETURNING remaining;
```

**Output:**

```text
 remaining
-----------
         0
(1 row)

 remaining
-----------
(0 rows)
```

The first buyer gets a row back (0 remaining); the second updates nothing (0 rows), so the application refuses the sale. Alternatives: `SELECT … FOR UPDATE` in step 1, or the `REPEATABLE READ`/`SERIALIZABLE` isolation levels with retry — see [Locking and Deadlocks](../../concurrency-and-mvcc/locking-and-deadlocks/content.md).

</details>
