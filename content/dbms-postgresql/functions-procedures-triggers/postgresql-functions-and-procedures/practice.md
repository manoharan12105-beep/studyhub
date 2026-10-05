# Functions and Procedures — Practice

### P1. Pick the volatility

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** volatility

A function returns the tax rate for a country by reading a `tax_rates` table. How should it be marked?

- A) `IMMUTABLE`
- B) `STABLE`
- C) `VOLATILE` only
- D) It cannot be a function

<details>
<summary>Answer</summary>

**Answer:** B) `STABLE`

**Explanation:** It reads a table, so its result can change between statements (not immutable), but it does not modify data and returns the same value within one statement. `VOLATILE` would also be correct but forgoes optimizations.

</details>

### P2. Department summary function

**Difficulty:** Easy · **Type:** Query · **Concepts:** RETURNS TABLE, SQL function

Write a SQL function `dept_summary(p_dept_id int)` returning the employee count, average salary (rounded) and highest salary of a department, and call it for departments 10 and 30.

**Expected output:**

```text
  dept_name  | headcount | avg_salary | top_salary
-------------+-----------+------------+------------
 Engineering |         4 |     103000 |     150000
 HR          |         2 |      61000 |      70000
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
CREATE FUNCTION dept_summary(p_dept_id int)
RETURNS TABLE (headcount bigint, avg_salary numeric, top_salary int)
LANGUAGE sql STABLE
AS $$
    SELECT count(*), round(avg(salary)), max(salary)
    FROM employees
    WHERE dept_id = p_dept_id
$$;

SELECT d.dept_name, s.*
FROM departments d CROSS JOIN LATERAL dept_summary(d.dept_id) AS s
WHERE d.dept_id IN (10, 30)
ORDER BY d.dept_id;
```

**Explanation:** `CROSS JOIN LATERAL` calls the set-returning function once per department row.

</details>

### P3. Validation with RAISE

**Difficulty:** Medium · **Type:** Query · **Concepts:** PL/pgSQL, RAISE EXCEPTION, FOUND

Write `set_order_status(p_order_id int, p_status text)` that raises an error if the order does not exist or if a `DELIVERED` or `CANCELLED` order is changed, and otherwise updates the status and returns the old status. Call it to ship order 106, then try to change order 104.

**Expected output:**

```text
 previous_status
-----------------
 PLACED
(1 row)

ERROR:  order 104 is CANCELLED and cannot change
CONTEXT:  PL/pgSQL function set_order_status(integer,text) line 10 at RAISE
```

<details>
<summary>Solution</summary>

```sql
CREATE FUNCTION set_order_status(p_order_id int, p_status text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    v_old text;
BEGIN
    SELECT status INTO v_old FROM orders WHERE order_id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'order % not found', p_order_id;
    END IF;
    IF v_old IN ('DELIVERED', 'CANCELLED') THEN
        RAISE EXCEPTION 'order % is % and cannot change', p_order_id, v_old;
    END IF;
    UPDATE orders SET status = p_status WHERE order_id = p_order_id;
    RETURN v_old;
END;
$$;

SELECT set_order_status(106, 'SHIPPED') AS previous_status;
SELECT set_order_status(104, 'PLACED');
```

</details>

### P4. Why does the index creation fail?

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** IMMUTABLE requirement

```sql
CREATE FUNCTION full_label(p_name text, p_category text) RETURNS text
LANGUAGE plpgsql AS $$ BEGIN RETURN p_name || ' (' || p_category || ')'; END $$;

CREATE INDEX products_label_idx ON products (full_label(name, category));
```

**Output:**

```text
ERROR:  functions in index expression must be marked IMMUTABLE
```

<details>
<summary>Answer</summary>

Functions default to `VOLATILE`; index expressions require `IMMUTABLE`. The function only concatenates its arguments, so it truly is immutable — declare it so:

```sql
CREATE OR REPLACE FUNCTION full_label(p_name text, p_category text) RETURNS text
LANGUAGE plpgsql IMMUTABLE AS $$ BEGIN RETURN p_name || ' (' || p_category || ')'; END $$;

CREATE INDEX products_label_idx ON products (full_label(name, category));
SELECT name FROM products WHERE full_label(name, category) = 'Desk (Furniture)';
```

**Output:**

```text
 name
------
 Desk
(1 row)
```

Only mark a function immutable when it is: if it read a table, the index could silently return wrong results after the table changed. (A simple `LANGUAGE sql` version may be accepted even without `IMMUTABLE`, because PostgreSQL inlines its body into the index expression and then judges the concatenation itself — do not rely on that.)

</details>

### P5. A batch procedure

**Difficulty:** Hard · **Type:** Query · **Concepts:** procedures, COMMIT, idempotent batches

**Schema and data:**

```sql
CREATE TABLE notifications (id int PRIMARY KEY, sent_at timestamptz);
INSERT INTO notifications (id) SELECT generate_series(1, 7);
```

Write a procedure `send_pending(batch int)` that marks unsent notifications as sent (`sent_at = now()`) in batches, committing after each batch and reporting the batch size, then call it with batch size 3 and show how many are still unsent.

**Expected output:**

```text
NOTICE:  sent 3
NOTICE:  sent 3
NOTICE:  sent 1
 unsent
--------
      0
(1 row)
```

<details>
<summary>Solution</summary>

```sql
CREATE PROCEDURE send_pending(batch int)
LANGUAGE plpgsql
AS $$
DECLARE
    n int;
BEGIN
    LOOP
        UPDATE notifications SET sent_at = now()
        WHERE id IN (SELECT id FROM notifications WHERE sent_at IS NULL ORDER BY id LIMIT batch);
        GET DIAGNOSTICS n = ROW_COUNT;
        EXIT WHEN n = 0;
        RAISE NOTICE 'sent %', n;
        COMMIT;
    END LOOP;
END;
$$;

CALL send_pending(3);
SELECT count(*) AS unsent FROM notifications WHERE sent_at IS NULL;
```

**Explanation:** The condition `sent_at IS NULL` makes each batch idempotent: if the job stops halfway, calling it again continues where it stopped.

</details>
