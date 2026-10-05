# DDL: CREATE, ALTER, DROP and TRUNCATE — Practice

### P1. Pick the command

**Difficulty:** Easy · **Type:** MCQ

You must remove all 50 million rows of `click_events` (no table references it) as fast as possible and keep the table. Which command?

- A) `DELETE FROM click_events;`
- B) `DROP TABLE click_events;`
- C) `TRUNCATE click_events;`
- D) `ALTER TABLE click_events DROP COLUMN *;`

<details>
<summary>Answer</summary>

**Answer:** C) `TRUNCATE click_events;`

**Explanation:** It empties the table in near-constant time and frees space immediately. `DELETE` would be slow and leave dead rows; `DROP` removes the table; D is not valid SQL.

</details>

### P2. Create a table with constraints

**Difficulty:** Easy · **Type:** Query · **Concepts:** CREATE TABLE

Create `reviews` with: `review_id` integer primary key; `product_id` required, referencing `products`; `rating` required, between 1 and 5; `comment` optional; `created_on` date defaulting to `2026-04-01`. Insert `(1, 2, 5, 'Great mouse')` with the default date and show the row.

**Expected output:**

```text
 review_id | product_id | rating |   comment   | created_on
-----------+------------+--------+-------------+------------
         1 |          2 |      5 | Great mouse | 2026-04-01
(1 row)
```

<details>
<summary>Solution</summary>

```sql
CREATE TABLE reviews (
    review_id  integer PRIMARY KEY,
    product_id integer NOT NULL REFERENCES products (product_id),
    rating     integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    text,
    created_on date NOT NULL DEFAULT DATE '2026-04-01'
);
INSERT INTO reviews (review_id, product_id, rating, comment) VALUES (1, 2, 5, 'Great mouse');
SELECT * FROM reviews;
```

**Explanation:** The omitted `created_on` takes its default. In a real table you would use `DEFAULT CURRENT_DATE`; a fixed date keeps this output reproducible.

</details>

### P3. Convert a text column

**Difficulty:** Medium · **Type:** Query · **Concepts:** ALTER COLUMN TYPE, USING

A table stores prices as text with a currency prefix: `('Pen', 'Rs 20')`, `('Bag', 'Rs 750')`. Convert `price` to `numeric(10,2)` in place and show the result.

**Expected output:**

```text
 item | price
------+--------
 Bag  | 750.00
 Pen  |  20.00
(2 rows)
```

<details>
<summary>Hint</summary>

`USING` can be any expression of the old value — strip the prefix, then cast.

</details>

<details>
<summary>Solution</summary>

```sql
CREATE TABLE shop_items (item text PRIMARY KEY, price text NOT NULL);
INSERT INTO shop_items VALUES ('Pen', 'Rs 20'), ('Bag', 'Rs 750');

ALTER TABLE shop_items
    ALTER COLUMN price TYPE numeric(10,2) USING replace(price, 'Rs ', '')::numeric;

SELECT item, price FROM shop_items ORDER BY item;
```

**Explanation:** Without `USING`, PostgreSQL cannot cast `'Rs 20'` to numeric. The type change rewrites the table — fine here, but plan for it on large tables.

</details>

### P4. Predict the identity values

**Difficulty:** Medium · **Type:** Output · **Concepts:** TRUNCATE, identity

```sql
CREATE TABLE tokens (id integer GENERATED ALWAYS AS IDENTITY, v text);
INSERT INTO tokens (v) VALUES ('x'), ('y');
DELETE FROM tokens;
INSERT INTO tokens (v) VALUES ('after delete');
TRUNCATE tokens;
INSERT INTO tokens (v) VALUES ('after truncate');
SELECT * FROM tokens;
```

<details>
<summary>Answer</summary>

**Output:**

```text
 id |       v
----+----------------
  4 | after truncate
(1 row)
```

`id = 4`. Neither `DELETE` nor a plain `TRUNCATE` resets the identity sequence: 1 and 2 were used, then 3 ('after delete'), then 4. Only `TRUNCATE … RESTART IDENTITY` (or `ALTER TABLE … ALTER COLUMN id RESTART`) resets it.

</details>

### P5. Safe column addition plan

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** ALTER TABLE, locks

You must add a required column `country text NOT NULL` to a 200-million-row `users` table that serves live traffic, with value `'IN'` for existing users. Describe a safe PostgreSQL approach.

<details>
<summary>Answer</summary>

1. Set `lock_timeout` (e.g. `SET lock_timeout = '3s'`) so the `ALTER` gives up instead of queueing every query behind it while waiting for its lock; retry if it times out.
2. `ALTER TABLE users ADD COLUMN country text NOT NULL DEFAULT 'IN';` — in PostgreSQL 11+ a **constant** default is stored in the catalog, so there is no table rewrite; existing rows read the default, and `NOT NULL` is satisfied. This is quick.
3. If the default should not stay (new users must supply a country), `ALTER TABLE users ALTER COLUMN country DROP DEFAULT;` afterwards — also catalog-only.

If the value had to be computed per row (not a constant), add the column nullable, backfill in batches (`UPDATE … WHERE id BETWEEN …`), add `CHECK (country IS NOT NULL) NOT VALID`, `VALIDATE CONSTRAINT`, then `SET NOT NULL` (PostgreSQL 12+ uses the validated check to skip the scan).

</details>
