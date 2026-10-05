# PostgreSQL Data Types — Practice

### P1. Pick the type

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** numeric types

Which type should store an invoice amount such as 1249.99?

- A) `real`
- B) `double precision`
- C) `numeric(12,2)`
- D) `integer`

<details>
<summary>Answer</summary>

**Answer:** C)

**Explanation:** Money must be exact; `numeric` stores decimal values exactly. Floats are approximate; `integer` would drop the paise unless the amount is stored in minor units.

</details>

### P2. Average salary, exactly

**Difficulty:** Easy · **Type:** Query · **Concepts:** integer division, casting

`SELECT sum(salary) / count(*) FROM employees WHERE dept_id = 20` returns a whole number. Return the exact average of Sales salaries with two decimals instead.

**Expected output:**

```text
 avg_salary
------------
   65750.00
(1 row)
```

<details>
<summary>Solution</summary>

```sql
SELECT round(sum(salary)::numeric / count(*), 2) AS avg_salary
FROM employees
WHERE dept_id = 20;
```

**Explanation:** `sum(integer)` is `bigint` and `count(*)` is `bigint`, so the original division truncates (263000 / 4 = 65750 exactly here, but 263001 / 4 would also give 65750). `avg(salary)` would return `numeric` directly.

</details>

### P3. Will it insert?

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** numeric precision, varchar length

```sql
CREATE TABLE items (sku varchar(8), price numeric(6,2));
INSERT INTO items VALUES ('SKU-0001', 9999.995);
```

**Output:**

```text
ERROR:  numeric field overflow
DETAIL:  A field with precision 6, scale 2 must round to an absolute value less than 10^4.
```

Explain the error and change the column so the value is accepted.

<details>
<summary>Answer</summary>

The SKU fits exactly (8 characters). The price is first rounded to 2 decimals: 9999.995 → 10000.00, which needs 5 digits before the point, but `numeric(6,2)` allows only 4. Widen the column to `numeric(7,2)` (or more):

```sql
ALTER TABLE items ALTER COLUMN price TYPE numeric(7,2);
INSERT INTO items VALUES ('SKU-0001', 9999.995);
SELECT * FROM items;
```

**Output:**

```text
   sku    |  price
----------+----------
 SKU-0001 | 10000.00
(1 row)
```

</details>

### P4. Status as ENUM

**Difficulty:** Medium · **Type:** Query · **Concepts:** ENUM ordering

Create an ENUM `ticket_priority` with values `LOW`, `MEDIUM`, `HIGH`, `URGENT`, a table `tickets(id int, priority ticket_priority)` with four tickets of different priorities, and list them from most to least urgent.

**Expected output:**

```text
 id | priority
----+----------
  2 | URGENT
  4 | HIGH
  1 | MEDIUM
  3 | LOW
(4 rows)
```

<details>
<summary>Solution</summary>

```sql
CREATE TYPE ticket_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TABLE tickets (id int, priority ticket_priority);
INSERT INTO tickets VALUES (1, 'MEDIUM'), (2, 'URGENT'), (3, 'LOW'), (4, 'HIGH');

SELECT id, priority FROM tickets ORDER BY priority DESC;
```

**Explanation:** ENUM values sort by declaration order. As `text`, the order would be alphabetical (URGENT, MEDIUM, LOW, HIGH) and wrong.

</details>

### P5. Design the column types

**Difficulty:** Hard · **Type:** Design · **Concepts:** type choice

Choose PostgreSQL types (with constraints) for a `payments` table: internal id, public id shown in URLs, customer id (references `customers`), amount, currency code (ISO 4217, three letters), status (`PENDING`, `SUCCEEDED`, `FAILED`, `REFUNDED`, more may be added later), created time, and whether it was a test payment.

<details>
<summary>Answer</summary>

```sql
CREATE TABLE payments (
    payment_id  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id   uuid          NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    customer_id integer       NOT NULL REFERENCES customers (customer_id),
    amount      numeric(12,2) NOT NULL CHECK (amount > 0),
    currency    text          NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
    status      text          NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED')),
    created_at  timestamptz   NOT NULL DEFAULT now(),
    is_test     boolean       NOT NULL DEFAULT false
);
```

Reasons: `bigint` identity for a growing table; a `uuid` public id so URLs do not expose sequential ids (`uuidv7()` on PostgreSQL 18 for better index locality); `numeric` for exact money; `text` with a pattern check rather than `char(3)`; status as `text` + `CHECK` because the list will change (an `ENUM` would also work for adding values, a lookup table if statuses need attributes); `timestamptz` for an absolute moment; `customer_id` matches the referenced column's type.

</details>
