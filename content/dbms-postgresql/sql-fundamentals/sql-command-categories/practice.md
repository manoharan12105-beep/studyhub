# SQL Overview: DDL, DML, DQL, DCL and TCL — Practice

### P1. Classify the commands

**Difficulty:** Easy · **Type:** Conceptual

Classify: `GRANT`, `TRUNCATE`, `SAVEPOINT`, `UPDATE`, `ALTER`, `SELECT`, `REVOKE`, `MERGE`, `DROP`, `ROLLBACK`.

<details>
<summary>Answer</summary>

- DDL: `TRUNCATE`, `ALTER`, `DROP`
- DML: `UPDATE`, `MERGE`
- DQL: `SELECT`
- DCL: `GRANT`, `REVOKE`
- TCL: `SAVEPOINT`, `ROLLBACK`

</details>

### P2. Which statement survives?

**Difficulty:** Medium · **Type:** Output · **Concepts:** transactional DDL

Predict how many rows `SELECT count(*) FROM departments` returns at the end, then run it.

```sql
BEGIN;
INSERT INTO departments VALUES (60, 'Legal', 'Delhi');
DROP TABLE accounts;
ROLLBACK;
INSERT INTO departments VALUES (70, 'Support', 'Pune');
SELECT count(*) FROM departments;
SELECT to_regclass('accounts') AS accounts_table;
```

<details>
<summary>Answer</summary>

**Output:**

```text
 count
-------
     6
(1 row)

 accounts_table
----------------
 accounts
(1 row)
```

6 departments (the original 5 plus Support), and `accounts` still exists. The rollback undid both the insert of Legal and the `DROP TABLE`; the Support insert ran later in autocommit mode.

</details>

### P3. Grant read-only access

**Difficulty:** Medium · **Type:** Query · **Concepts:** DCL

Create a role `auditor`, allow it to read `orders` and `order_items` only, and verify with `has_table_privilege` that it can read `orders` but cannot read `employees`.

**Expected output:**

```text
 reads_orders | reads_employees
--------------+-----------------
 t            | f
(1 row)
```

<details>
<summary>Hint</summary>

`GRANT SELECT ON table1, table2 TO role;`

</details>

<details>
<summary>Solution</summary>

```sql
CREATE ROLE auditor;
GRANT SELECT ON orders, order_items TO auditor;
SELECT has_table_privilege('auditor', 'orders', 'SELECT')    AS reads_orders,
       has_table_privilege('auditor', 'employees', 'SELECT') AS reads_employees;
```

**Explanation:** Privileges are granted per object; nothing was granted on `employees`. More in [Roles and Privileges](../../security-and-permissions/roles-and-privileges/content.md).

</details>

### P4. Fix the migration

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** transaction blocks

A migration script runs:

```sql
-- Illustrative: a migration that fails
BEGIN;
ALTER TABLE orders ADD COLUMN channel text;
CREATE INDEX CONCURRENTLY idx_orders_channel ON orders (channel);
COMMIT;
```

It fails with `CREATE INDEX CONCURRENTLY cannot run inside a transaction block`. Explain and fix it.

<details>
<summary>Answer</summary>

`CONCURRENTLY` builds the index in several internal transactions so it does not block writes, so it cannot run inside an explicit transaction. The failure also aborts the transaction, so the `ALTER TABLE` is rolled back. Split the migration: run `ALTER TABLE` (in its own transaction), then run `CREATE INDEX CONCURRENTLY` as a separate, non-transactional step. On a small table, a plain `CREATE INDEX` inside the transaction is also fine.

</details>
