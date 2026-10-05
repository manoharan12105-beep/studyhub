# Triggers — Practice

### P1. Which trigger?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** BEFORE vs AFTER

You need to store every email in lower case, whatever the client sends. Which trigger?

- A) `AFTER INSERT OR UPDATE … FOR EACH ROW`
- B) `BEFORE INSERT OR UPDATE … FOR EACH ROW` that modifies `NEW.email`
- C) `AFTER INSERT … FOR EACH STATEMENT`
- D) `INSTEAD OF INSERT` on the table

<details>
<summary>Answer</summary>

**Answer:** B)

**Explanation:** Only a BEFORE row trigger can change the row before it is written. `INSTEAD OF` triggers exist only on views. (A generated column `lower(email)` or `citext` are declarative alternatives.)

</details>

### P2. Stock movement log

**Difficulty:** Medium · **Type:** Query · **Concepts:** AFTER UPDATE trigger, WHEN

**Schema and data:**

```sql
CREATE TABLE stock (product_id int PRIMARY KEY, qty int NOT NULL);
INSERT INTO stock VALUES (1, 10), (2, 50);
CREATE TABLE stock_moves (product_id int, change int);
```

Create a trigger that, whenever `stock.qty` actually changes, records the difference in `stock_moves`. Then sell 3 of product 1, receive 20 of product 2, and run a no-op update on product 1. Show `stock_moves`.

**Expected output:**

```text
 product_id | change
------------+--------
          1 |     -3
          2 |     20
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
CREATE FUNCTION log_stock_move() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO stock_moves VALUES (NEW.product_id, NEW.qty - OLD.qty);
    RETURN NULL;
END;
$$;

CREATE TRIGGER stock_move_log
AFTER UPDATE OF qty ON stock
FOR EACH ROW
WHEN (OLD.qty IS DISTINCT FROM NEW.qty)
EXECUTE FUNCTION log_stock_move();

UPDATE stock SET qty = qty - 3 WHERE product_id = 1;
UPDATE stock SET qty = qty + 20 WHERE product_id = 2;
UPDATE stock SET qty = qty WHERE product_id = 1;
SELECT * FROM stock_moves;
```

</details>

### P3. The trigger that always fails

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** BEFORE trigger return value

```sql
CREATE TABLE signups (email text);
CREATE FUNCTION normalise_signup() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.email := lower(NEW.email);
END;
$$;
CREATE TRIGGER signups_normalise BEFORE INSERT ON signups
FOR EACH ROW EXECUTE FUNCTION normalise_signup();

INSERT INTO signups VALUES ('Anil@Mail.com');
```

**Output:**

```text
ERROR:  control reached end of trigger procedure without RETURN
CONTEXT:  PL/pgSQL function normalise_signup()
```

Explain and fix.

<details>
<summary>Answer</summary>

A PL/pgSQL trigger function must end with a `RETURN`; falling off the end is an error ("control reached end of trigger procedure without RETURN"). Return `NEW` to let the insert proceed (returning `NULL` would silently skip the row):

```sql
CREATE OR REPLACE FUNCTION normalise_signup() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.email := lower(NEW.email);
    RETURN NEW;
END;
$$;
INSERT INTO signups VALUES ('Anil@Mail.com');
SELECT * FROM signups;
```

**Output:**

```text
     email
---------------
 anil@mail.com
(1 row)
```

</details>

### P4. Enforce a limit safely

**Difficulty:** Hard · **Type:** Query · **Concepts:** BEFORE INSERT trigger, locking, RAISE

**Schema and data:**

```sql
CREATE TABLE members (member_id int PRIMARY KEY, name text);
CREATE TABLE loans (loan_id int PRIMARY KEY, member_id int REFERENCES members, returned boolean NOT NULL DEFAULT false);
INSERT INTO members VALUES (1, 'Anil');
INSERT INTO loans (loan_id, member_id) VALUES (1, 1), (2, 1);
```

Write a trigger allowing at most 2 open loans per member (concurrency-safe), then try to add a third.

**Expected output:**

```text
ERROR:  member 1 already has 2 open loans
CONTEXT:  PL/pgSQL function check_loan_limit() line 8 at RAISE
```

<details>
<summary>Hint</summary>

Lock the member row with `FOR UPDATE` inside the trigger before counting, so concurrent inserts for the same member wait for each other.

</details>

<details>
<summary>Solution</summary>

```sql
CREATE FUNCTION check_loan_limit() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    open_loans int;
BEGIN
    PERFORM 1 FROM members WHERE member_id = NEW.member_id FOR UPDATE;   -- serialize per member
    SELECT count(*) INTO open_loans FROM loans WHERE member_id = NEW.member_id AND NOT returned;
    IF open_loans >= 2 THEN
        RAISE EXCEPTION 'member % already has % open loans', NEW.member_id, open_loans;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER loans_limit BEFORE INSERT ON loans
FOR EACH ROW EXECUTE FUNCTION check_loan_limit();

INSERT INTO loans (loan_id, member_id) VALUES (3, 1);
```

**Explanation:** Without the `FOR UPDATE` lock, two transactions inserting at once could both count 1 open loan and both succeed. (`PERFORM` runs a query and discards its result in PL/pgSQL.)

</details>
