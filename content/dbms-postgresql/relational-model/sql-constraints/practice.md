# Constraints and Referential Integrity — Practice

### P1. Which insert succeeds?

**Difficulty:** Easy · **Type:** MCQ

`CREATE TABLE items (id integer PRIMARY KEY, qty integer CHECK (qty > 0));` Which insert succeeds?

- A) `INSERT INTO items VALUES (1, 0);`
- B) `INSERT INTO items VALUES (NULL, 5);`
- C) `INSERT INTO items VALUES (2, NULL);`
- D) `INSERT INTO items VALUES (3, -1);`

<details>
<summary>Answer</summary>

**Answer:** C) `INSERT INTO items VALUES (2, NULL);`

**Explanation:** `NULL > 0` is unknown, so the `CHECK` passes. A and D are false; B violates the primary key's implicit `NOT NULL`.

</details>

### P2. Choose the referential action

**Difficulty:** Easy · **Type:** Scenario

Pick `CASCADE`, `SET NULL` or `RESTRICT` for each foreign key: (1) `comments.post_id → posts` on a blog, (2) `orders.coupon_id → coupons` when an expired coupon is deleted, (3) `invoices.customer_id → customers` for an accounting system.

<details>
<summary>Answer</summary>

1. `CASCADE` — comments belong to the post.
2. `SET NULL` — the order remains valid without its coupon link (often you would keep the coupon and mark it inactive instead).
3. `RESTRICT` — invoices are legal records; never delete them implicitly.

</details>

### P3. Default or NULL?

**Difficulty:** Easy · **Type:** Output · **Concepts:** DEFAULT

Predict the output, then run it.

```sql
CREATE TABLE notes (id integer PRIMARY KEY, body text, pinned boolean DEFAULT false);
INSERT INTO notes (id, body) VALUES (1, 'a');
INSERT INTO notes VALUES (2, 'b', NULL);
INSERT INTO notes VALUES (3, 'c', DEFAULT);
SELECT * FROM notes ORDER BY id;
```

<details>
<summary>Answer</summary>

**Output:**

```text
 id | body | pinned
----+------+--------
  1 | a    | f
  2 | b    | NULL
  3 | c    | f
(3 rows)
```

Rows 1 and 3 get the default `false` (shown by psql as `f`); row 2 stores `NULL` because it was supplied explicitly. Use `pinned boolean NOT NULL DEFAULT false` to forbid it.

</details>

### P4. Add a business rule

**Difficulty:** Medium · **Type:** Query · **Concepts:** CHECK, ALTER TABLE

Add a named constraint `hire_after_founding` to the sample `employees` table so that `hire_date` cannot be before `2010-01-01`. Then show that inserting an employee hired on `2009-12-31` fails.

**Expected output:**

```text
ERROR:  new row for relation "employees" violates check constraint "hire_after_founding"
DETAIL:  Failing row contains (20, Old Timer, null, 10, null, 50000, null, 2009-12-31).
```

<details>
<summary>Hint</summary>

`ALTER TABLE … ADD CONSTRAINT name CHECK (…)`. Existing rows must already satisfy it.

</details>

<details>
<summary>Solution</summary>

```sql
ALTER TABLE employees
    ADD CONSTRAINT hire_after_founding CHECK (hire_date >= DATE '2010-01-01');

INSERT INTO employees (emp_id, name, dept_id, salary, hire_date)
VALUES (20, 'Old Timer', 10, 50000, '2009-12-31');
```

**Explanation:** All 12 existing rows satisfy the rule, so the `ALTER` succeeds; the insert then fails with the constraint's name in the message — one reason to name constraints.

</details>

### P5. Why did the delete fail?

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** foreign key, NO ACTION

`DELETE FROM customers WHERE customer_id = 3;` fails on the sample database. Explain the error and give two different fixes depending on the business requirement.

**Expected output:**

```text
ERROR:  update or delete on table "customers" violates foreign key constraint "orders_customer_id_fkey" on table "orders"
DETAIL:  Key (customer_id)=(3) is still referenced from table "orders".
```

<details>
<summary>Solution</summary>

```sql
DELETE FROM customers WHERE customer_id = 3;
```

**Explanation:** Customer 3 (Chirag) has order 104, and `orders.customer_id` references `customers` with the default `NO ACTION`. Fixes:

- Keep history (usual): do not delete; add an `is_active boolean` / `deleted_at timestamptz` column and mark the customer inactive (soft delete).
- Data must really go (e.g. a privacy erasure request): delete or anonymise the dependent rows first in one transaction, or — only if orders are truly owned by the customer — declare the foreign key `ON DELETE CASCADE`.

</details>

### P6. Cascade chain

**Difficulty:** Medium · **Type:** Query · **Concepts:** ON DELETE CASCADE

In the sample database, delete order 101 and show how many rows remain in `order_items` in total (there are 13 initially).

**Expected output:**

```text
 order_items_left
------------------
               11
(1 row)
```

<details>
<summary>Solution</summary>

```sql
DELETE FROM orders WHERE order_id = 101;
SELECT count(*) AS order_items_left FROM order_items;
```

**Explanation:** Order 101 had 2 items; `ON DELETE CASCADE` on `order_items.order_id` removed them with the order.

</details>

### P7. One active default address

**Difficulty:** Hard · **Type:** Design · **Concepts:** UNIQUE, partial unique index

Each customer can have many addresses, but at most one marked `is_default = true`. Create `addresses(address_id, customer_id, line1, is_default)` so the database enforces this, then show that a second default address for customer 1 is rejected.

**Expected output:**

```text
ERROR:  duplicate key value violates unique constraint "one_default_address"
DETAIL:  Key (customer_id)=(1) already exists.
```

<details>
<summary>Hint</summary>

A plain `UNIQUE (customer_id, is_default)` would also forbid two non-default addresses. Make the uniqueness apply only to rows where `is_default` is true.

</details>

<details>
<summary>Solution</summary>

```sql
CREATE TABLE addresses (
    address_id  integer PRIMARY KEY,
    customer_id integer NOT NULL REFERENCES customers (customer_id),
    line1       text    NOT NULL,
    is_default  boolean NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX one_default_address ON addresses (customer_id) WHERE is_default;

INSERT INTO addresses VALUES (1, 1, '12 Anna Salai', true);
INSERT INTO addresses VALUES (2, 1, '5 Beach Road', false);
INSERT INTO addresses VALUES (3, 1, '9 Mount Road', false);
INSERT INTO addresses VALUES (4, 1, '1 Lake View', true);
```

**Explanation:** A **partial unique index** enforces uniqueness only for rows matching its `WHERE`, so any number of non-default addresses is allowed but only one default per customer.

</details>
