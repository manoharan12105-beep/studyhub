# SERIAL, IDENTITY and Sequences — Practice

### P1. Which insert fails?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** GENERATED ALWAYS

For `CREATE TABLE t (id int GENERATED ALWAYS AS IDENTITY, v text)`, which statement fails?

- A) `INSERT INTO t (v) VALUES ('a');`
- B) `INSERT INTO t (id, v) VALUES (DEFAULT, 'b');`
- C) `INSERT INTO t (id, v) VALUES (5, 'c');`
- D) `INSERT INTO t (id, v) OVERRIDING SYSTEM VALUE VALUES (5, 'd');`

<details>
<summary>Answer</summary>

**Answer:** C)

**Explanation:** An explicit value for a `GENERATED ALWAYS` column is rejected unless `OVERRIDING SYSTEM VALUE` is given (D). A and B let the database generate the id.

</details>

### P2. Insert and read back the id

**Difficulty:** Easy · **Type:** Query · **Concepts:** RETURNING

Create a table `suppliers (supplier_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name text NOT NULL)`, insert `Acme` and `Globex` in one statement, and return the generated ids with the names.

**Expected output:**

```text
 supplier_id |  name
-------------+--------
           1 | Acme
           2 | Globex
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
CREATE TABLE suppliers (
    supplier_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        text NOT NULL
);
INSERT INTO suppliers (name) VALUES ('Acme'), ('Globex')
RETURNING supplier_id, name;
```

</details>

### P3. Predict the ids

**Difficulty:** Medium · **Type:** Output · **Concepts:** gaps, rollback, failed inserts

What ids do `A` and `C` have after this script?

```sql
CREATE TABLE codes (id int GENERATED ALWAYS AS IDENTITY, code text UNIQUE);
INSERT INTO codes (code) VALUES ('A');
BEGIN;
INSERT INTO codes (code) VALUES ('B');
ROLLBACK;
INSERT INTO codes (code) VALUES ('A');
INSERT INTO codes (code) VALUES ('C');
SELECT id, code FROM codes ORDER BY id;
```

<details>
<summary>Answer</summary>

**Output:**

```text
ERROR:  duplicate key value violates unique constraint "codes_code_key"
DETAIL:  Key (code)=(A) already exists.
 id | code
----+------
  1 | A
  4 | C
(2 rows)
```

`A` got 1. The rolled-back insert of `B` used 2. The duplicate `A` drew 3 before failing the unique check. `C` therefore gets 4.

</details>

### P4. Repair the sequence

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** setval, out-of-sync sequence

After a data import, inserts fail:

**Schema and data:**

```sql
CREATE TABLE products_copy (id serial PRIMARY KEY, name text);
INSERT INTO products_copy (id, name) SELECT product_id, name FROM products;
```

```sql
INSERT INTO products_copy (name) VALUES ('Monitor');
```

**Output:**

```text
ERROR:  duplicate key value violates unique constraint "products_copy_pkey"
DETAIL:  Key (id)=(1) already exists.
```

Fix the sequence and insert `Monitor` successfully.

<details>
<summary>Answer</summary>

The import supplied ids 1–6 explicitly, so the sequence still starts at 1 (and the failed attempt used 1). Move it to the current maximum:

```sql
SELECT setval(pg_get_serial_sequence('products_copy', 'id'), (SELECT max(id) FROM products_copy));
INSERT INTO products_copy (name) VALUES ('Monitor') RETURNING id, name;
```

**Output:**

```text
 setval
--------
      6
(1 row)

 id |  name
----+---------
  7 | Monitor
(1 row)
```

</details>

### P5. Gap-free numbering

**Difficulty:** Hard · **Type:** Design · **Concepts:** non-transactional sequences, row locks

The finance team requires invoice numbers without gaps. Why can't `invoice_no bigint GENERATED ALWAYS AS IDENTITY` guarantee that? Design an alternative and show it working for two invoices.

<details>
<summary>Hint</summary>

Keep the last used number in a one-row table and increment it with `UPDATE … RETURNING` in the same transaction as the invoice insert.

</details>

<details>
<summary>Answer</summary>

Sequence values are not rolled back: a failed or aborted invoice transaction would leave a gap. A counter row is updated transactionally — if the invoice transaction rolls back, so does the increment — and its row lock makes concurrent invoice creations wait in turn. The increment and the insert are combined in a data-modifying CTE (`UPDATE … RETURNING` cannot appear directly in `FROM`):

```sql
CREATE TABLE invoice_counter (id int PRIMARY KEY CHECK (id = 1), last_no bigint NOT NULL);
INSERT INTO invoice_counter VALUES (1, 0);
CREATE TABLE invoices (invoice_no bigint PRIMARY KEY, amount numeric(12,2) NOT NULL);

BEGIN;
WITH c AS (UPDATE invoice_counter SET last_no = last_no + 1 WHERE id = 1 RETURNING last_no)
INSERT INTO invoices SELECT last_no, 1500.00 FROM c;
COMMIT;

BEGIN;
WITH c AS (UPDATE invoice_counter SET last_no = last_no + 1 WHERE id = 1 RETURNING last_no)
INSERT INTO invoices SELECT last_no, 990.00 FROM c;
ROLLBACK;                                   -- this invoice is abandoned

BEGIN;
WITH c AS (UPDATE invoice_counter SET last_no = last_no + 1 WHERE id = 1 RETURNING last_no)
INSERT INTO invoices SELECT last_no, 2400.00 FROM c;
COMMIT;

SELECT invoice_no, amount FROM invoices ORDER BY invoice_no;
```

**Output:**

```text
 invoice_no | amount
------------+---------
          1 | 1500.00
          2 | 2400.00
(2 rows)
```

The abandoned invoice's increment was rolled back with it, so the numbers are 1 and 2. The cost: only one transaction at a time can hold the counter row, so invoice creation is serialized.

</details>
