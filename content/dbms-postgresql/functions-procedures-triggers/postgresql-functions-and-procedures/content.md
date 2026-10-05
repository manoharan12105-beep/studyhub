# Functions and Procedures

**Module:** Functions, Procedures and Triggers · **Interview priority:** Frequently asked

## What Is It?

PostgreSQL lets you store code in the database:

- A **function** (`CREATE FUNCTION`) takes arguments and **returns** a value, a row or a set of rows; it is called inside SQL (`SELECT f(x)`, `FROM f(x)`).
- A **procedure** (`CREATE PROCEDURE`, PostgreSQL 11+) is called with `CALL`, returns nothing (except `OUT` parameters) and — unlike a function — can **commit and roll back transactions** inside its body.

Bodies are written in **SQL** or in **PL/pgSQL** (PostgreSQL's procedural language with variables, `IF`, loops and exception handling); other languages are available as extensions.

## Why It Matters

- Functions package reusable logic close to the data: calculations, validation, set-returning queries, trigger bodies.
- Procedures run batch jobs that commit in chunks.
- Interviewers ask: function vs procedure, volatility categories, `SECURITY DEFINER`, and when business logic should live in the database rather than the application.

## Core Concept

### Function anatomy

```text
CREATE [OR REPLACE] FUNCTION name(arg1 type [DEFAULT …], OUT result type, …)
RETURNS type | TABLE (col type, …) | SETOF type | void
LANGUAGE sql | plpgsql
[IMMUTABLE | STABLE | VOLATILE] [STRICT] [SECURITY DEFINER] [SET search_path = …]
AS $$ body $$;
```

| Return form | Called as | Example |
|-------------|-----------|---------|
| Scalar | `SELECT f(1)` | `net_price(price, discount)` |
| `RETURNS TABLE (…)` / `SETOF` | `SELECT * FROM f(1)` | "orders of a customer" |
| `void` | `SELECT f()` | Side-effect helpers |
| `trigger` | From a trigger | [Triggers](../postgresql-triggers/content.md) |

### Volatility: IMMUTABLE, STABLE, VOLATILE

| Category | Promise | Planner may | Examples |
|----------|---------|-------------|----------|
| `IMMUTABLE` | Same arguments → same result forever; no database reads | Evaluate once at plan time; use in **index expressions** and generated columns | `lower(text)`, arithmetic |
| `STABLE` | Same result within one statement; may read tables | Evaluate once per statement for index scans | `now()`, lookups in a settings table |
| `VOLATILE` (default) | Can change every call; may have side effects | Re-evaluate for every row; no reordering | `random()`, `nextval()`, anything that writes |

Marking a function `IMMUTABLE` when it is not (for example, it reads a table or depends on time-zone settings) can produce **wrong results** and corrupt expression indexes. Mark honestly; when unsure, leave the default.

Other attributes:

- `STRICT` (`RETURNS NULL ON NULL INPUT`): if any argument is `NULL`, return `NULL` without running the body.
- `SECURITY DEFINER`: run with the privileges of the function's owner (like `setuid`). Always add `SET search_path = pg_catalog, public` (or a fixed path) so callers cannot hijack unqualified names.
- `PARALLEL SAFE`: allows use in parallel query plans.

### SQL vs PL/pgSQL functions

| | `LANGUAGE sql` | `LANGUAGE plpgsql` |
|---|---|---|
| Body | One or more SQL statements; result of the last | Blocks with variables, `IF`, loops, `RAISE`, exceptions |
| Inlining | Simple ones can be **inlined** into the calling query (optimized as part of it) | Never inlined — a black box to the planner |
| Use for | Small computations and parameterized queries | Procedural logic, triggers, error handling |

PostgreSQL 14+ also supports SQL-standard bodies: `CREATE FUNCTION … BEGIN ATOMIC … END` (parsed at creation time, dependencies tracked).

### PL/pgSQL essentials

```text
DECLARE   v_total numeric := 0;   r record;
BEGIN
  IF … THEN … ELSIF … ELSE … END IF;
  FOR r IN SELECT … LOOP … END LOOP;          -- loop over query rows
  FOR i IN 1..10 LOOP … END LOOP;
  SELECT … INTO v_total FROM … ;               -- single-row result into variable; FOUND says if a row came back
  RETURN QUERY SELECT … ;                      -- add rows to a set-returning function's result
  RAISE NOTICE 'value: %', v_total;            -- message; RAISE EXCEPTION aborts with an error
EXCEPTION
  WHEN unique_violation THEN …                 -- handler; the block's changes are rolled back (subtransaction)
END;
```

An `EXCEPTION` clause starts a subtransaction on block entry — convenient, but costly in tight loops.

### Procedures and transaction control

- `CALL proc(args)` runs a procedure. Inside it, `COMMIT` and `ROLLBACK` end the current transaction and start a new one — useful for batch jobs processing millions of rows in chunks.
- Transaction control works only when the `CALL` is not inside an explicit transaction block (and not nested inside a function); otherwise *invalid transaction termination*.
- Functions can never commit; they always run inside the caller's transaction.

### Function vs procedure

| | Function | Procedure |
|---|---|---|
| Invoked by | `SELECT`, in expressions, `FROM` | `CALL` |
| Returns | Value, row, set or `void` | Nothing (only `OUT`/`INOUT` parameters) |
| Usable in queries | Yes | No |
| `COMMIT`/`ROLLBACK` inside | No | Yes (when called outside a transaction block) |
| Typical use | Calculations, set-returning queries, triggers | Batch jobs, maintenance tasks |

### Logic in the database or in the application?

| In the database (functions, constraints, triggers) | In the application (Java service layer) |
|----------------------------------------------------|------------------------------------------|
| Rules every client must obey; data-heavy operations that would otherwise ship many rows; atomic multi-statement operations in one round trip | Business workflows, external calls, logic needing unit tests, versioning and deployment like the rest of the code |
| Risk: logic hidden from application developers, harder testing/versioning, vendor lock-in | Risk: rules bypassed by other clients, chattier round trips |

Most teams keep **integrity** in the database (constraints) and **workflow** in the application, using functions selectively for set-based operations.

## Syntax

```sql
-- Illustrative
CREATE OR REPLACE FUNCTION f(a int, b int DEFAULT 1) RETURNS int
LANGUAGE sql IMMUTABLE AS $$ SELECT a + b $$;

CREATE OR REPLACE PROCEDURE p(batch_size int) LANGUAGE plpgsql AS $$
BEGIN … COMMIT; … END $$;

CALL p(1000);
DO $$ BEGIN RAISE NOTICE 'anonymous block'; END $$;
DROP FUNCTION f(int, int);
```

## Examples

### A scalar SQL function

```sql
CREATE FUNCTION price_with_gst(price numeric, rate numeric DEFAULT 18)
RETURNS numeric
LANGUAGE sql IMMUTABLE STRICT
AS $$ SELECT round(price * (1 + rate / 100), 2) $$;

SELECT name, price, price_with_gst(price) AS with_gst, price_with_gst(price, rate => 5) AS at_5_pct
FROM products
WHERE category = 'Furniture'
ORDER BY product_id;
```

**Output:**

```text
 name  |  price  | with_gst | at_5_pct
-------+---------+----------+----------
 Desk  | 8000.00 |  9440.00 |  8400.00
 Chair | 4500.00 |  5310.00 |  4725.00
(2 rows)
```

`rate => 5` passes an argument by name; `STRICT` makes `price_with_gst(NULL)` return `NULL` without evaluating the body.

### A set-returning function

```sql
CREATE FUNCTION customer_orders(p_customer_id int)
RETURNS TABLE (order_id int, order_date date, status text, total numeric)
LANGUAGE sql STABLE
AS $$
    SELECT o.order_id, o.order_date, o.status, sum(oi.quantity * oi.unit_price)
    FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
    WHERE o.customer_id = p_customer_id
    GROUP BY o.order_id
    ORDER BY o.order_date
$$;

SELECT * FROM customer_orders(1);
```

**Output:**

```text
 order_id | order_date |  status   |  total
----------+------------+-----------+----------
      101 | 2026-01-05 | DELIVERED | 56000.00
      103 | 2026-02-03 | SHIPPED   |  1500.00
      107 | 2026-03-15 | DELIVERED | 12500.00
(3 rows)
```

It is used like a parameterized view and can be joined (`… CROSS JOIN LATERAL customer_orders(c.customer_id)`).

### PL/pgSQL with control flow and errors

```sql
CREATE FUNCTION transfer(p_from int, p_to int, p_amount numeric)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    v_balance numeric;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'amount must be positive, got %', p_amount;
    END IF;

    SELECT balance INTO v_balance FROM accounts WHERE account_id = p_from FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'account % does not exist', p_from;
    END IF;
    IF v_balance < p_amount THEN
        RETURN format('insufficient funds: balance %s, requested %s', v_balance, p_amount);
    END IF;

    UPDATE accounts SET balance = balance - p_amount WHERE account_id = p_from;
    UPDATE accounts SET balance = balance + p_amount WHERE account_id = p_to;
    RETURN 'ok';
END;
$$;

SELECT transfer(1, 3, 2500) AS first, transfer(3, 2, 9999) AS second;
SELECT account_id, balance FROM accounts ORDER BY account_id;
```

**Output:**

```text
 first |                       second
-------+-----------------------------------------------------
 ok    | insufficient funds: balance 2500.00, requested 9999
(1 row)

 account_id | balance
------------+---------
          1 | 7500.00
          2 | 5000.00
          3 | 2500.00
(3 rows)
```

```sql
SELECT transfer(1, 2, -5);
```

**Output:**

```text
ERROR:  amount must be positive, got -5
CONTEXT:  PL/pgSQL function transfer(integer,integer,numeric) line 6 at RAISE
```

`RAISE EXCEPTION` aborts the calling statement (and its transaction), just like a constraint violation.

### Exception handling inside a function

```sql
CREATE FUNCTION safe_add_customer(p_id int, p_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO customers (customer_id, name) VALUES (p_id, p_name);
    RETURN 'inserted';
EXCEPTION
    WHEN unique_violation THEN
        RETURN 'customer ' || p_id || ' already exists';
END;
$$;

SELECT safe_add_customer(7, 'Gita') AS new_one, safe_add_customer(1, 'Duplicate') AS existing;
```

**Output:**

```text
 new_one  |         existing
----------+---------------------------
 inserted | customer 1 already exists
(1 row)
```

### Volatility in action

```sql
SELECT DISTINCT proname, provolatile
FROM pg_proc
WHERE proname IN ('price_with_gst', 'customer_orders', 'transfer', 'now', 'random', 'lower')
ORDER BY proname;
```

**Output:**

```text
     proname     | provolatile
-----------------+-------------
 customer_orders | s
 lower           | i
 now             | s
 price_with_gst  | i
 random          | v
 transfer        | v
(6 rows)
```

`i` = immutable, `s` = stable, `v` = volatile. Only immutable functions are allowed in index expressions:

```sql
CREATE FUNCTION order_age_days(d date) RETURNS int
LANGUAGE sql STABLE AS $$ SELECT CURRENT_DATE - d $$;

CREATE INDEX orders_age_idx ON orders (order_age_days(order_date));
```

**Output:**

```text
ERROR:  functions in index expression must be marked IMMUTABLE
```

The function depends on `CURRENT_DATE`, so it is honestly marked `STABLE` — and PostgreSQL refuses to index it.

### A procedure that commits in batches

```sql
CREATE TABLE audit_events (id int PRIMARY KEY, processed boolean NOT NULL DEFAULT false);
INSERT INTO audit_events (id) SELECT generate_series(1, 25);

CREATE PROCEDURE process_audit_events(batch_size int)
LANGUAGE plpgsql
AS $$
DECLARE
    n int;
BEGIN
    LOOP
        UPDATE audit_events SET processed = true
        WHERE id IN (SELECT id FROM audit_events WHERE NOT processed ORDER BY id LIMIT batch_size);
        GET DIAGNOSTICS n = ROW_COUNT;
        EXIT WHEN n = 0;
        RAISE NOTICE 'processed % rows', n;
        COMMIT;                     -- each batch is its own transaction
    END LOOP;
END;
$$;

CALL process_audit_events(10);
SELECT count(*) FILTER (WHERE processed) AS processed FROM audit_events;
```

**Output:**

```text
NOTICE:  processed 10 rows
NOTICE:  processed 10 rows
NOTICE:  processed 5 rows
 processed
-----------
        25
(1 row)
```

Inside an explicit transaction block, the `COMMIT` is not allowed:

```sql
UPDATE audit_events SET processed = false;
BEGIN;
CALL process_audit_events(10);
ROLLBACK;
```

**Output:**

```text
NOTICE:  processed 10 rows
ERROR:  invalid transaction termination
CONTEXT:  PL/pgSQL function process_audit_events(integer) line 11 at COMMIT
```


### Calling from Java

```java
// Illustrative fragment: a set-returning function is queried like a table
try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM customer_orders(?)")) {
    ps.setInt(1, customerId);
    try (ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
            System.out.println(rs.getInt("order_id") + " " + rs.getBigDecimal("total"));
        }
    }
}
// A procedure is invoked with CALL (autocommit on, so it may commit internally)
try (CallableStatement cs = conn.prepareCall("CALL process_audit_events(?)")) {
    cs.setInt(1, 1000);
    cs.execute();
}
```

## Comparison

### SQL function vs PL/pgSQL function vs procedure

| | SQL function | PL/pgSQL function | Procedure |
|---|---|---|---|
| Control flow, variables | No | Yes | Yes (PL/pgSQL) |
| Inlinable by the planner | Often | No | — |
| Usable in `SELECT` / indexes | Yes (immutable for indexes) | Yes | No |
| Transaction control | No | No | Yes |
| Exception handling | No | Yes | Yes |

## Common Mistakes

- Marking functions `IMMUTABLE` that read tables or depend on settings (wrong results, broken indexes).
- `SECURITY DEFINER` without a fixed `search_path`.
- Row-by-row PL/pgSQL loops where one set-based SQL statement would do.
- `EXCEPTION` blocks inside tight loops (a subtransaction per iteration).
- Trying to `COMMIT` in a function, or in a procedure called inside `BEGIN … END`.
- Overloaded functions with ambiguous signatures; dropping a function without its argument types when overloads exist.
- Hiding core business workflows in database code the rest of the team never sees or tests.

## Revision

- Function: returns a value/row/set, called in SQL; procedure: `CALL`, no return value, can `COMMIT`/`ROLLBACK` (only outside a transaction block).
- `LANGUAGE sql` (inlinable) vs `plpgsql` (control flow, exceptions); `BEGIN ATOMIC` bodies (14+).
- Volatility: `IMMUTABLE` (index-safe) / `STABLE` / `VOLATILE` (default) — mark honestly.
- `STRICT`, named/default arguments, `RETURNS TABLE`, `SECURITY DEFINER` + `SET search_path`.
- PL/pgSQL: `DECLARE`, `IF`, `FOR … LOOP`, `SELECT … INTO` + `FOUND`, `RETURN QUERY`, `RAISE`, `EXCEPTION WHEN`.

## Quick Revision

Functions return values or sets and run inside the caller's transaction; procedures are CALLed and may COMMIT in batches. Use SQL functions for simple logic, PL/pgSQL for control flow and errors, and mark volatility honestly — only IMMUTABLE functions can be indexed.
