# Roles, Privileges and Row-Level Security — Practice

### P1. Why permission denied?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** schema USAGE

A role was granted `SELECT ON sales.orders` but `SELECT * FROM sales.orders` still fails with "permission denied for schema sales". What is missing?

- A) `CONNECT` on the table
- B) `USAGE` on the schema `sales`
- C) `EXECUTE` on the schema
- D) The role must own the table

<details>
<summary>Answer</summary>

**Answer:** B)

**Explanation:** To reach objects inside a schema, a role needs `USAGE` on that schema, in addition to the table privilege.

</details>

### P2. Set up an application role

**Difficulty:** Medium · **Type:** Query · **Concepts:** group roles, sequences, least privilege

Create a group role `shop_rw` that can read and write `orders` and `order_items` (but not delete), and a login role `shop_service` in it. Verify with `has_table_privilege`.

**Expected output:**

```text
 can_insert | can_delete | can_read_employees
------------+------------+--------------------
 t          | f          | f
(1 row)
```

<details>
<summary>Solution</summary>

```sql
CREATE ROLE shop_rw NOLOGIN;
GRANT USAGE ON SCHEMA public TO shop_rw;
GRANT SELECT, INSERT, UPDATE ON orders, order_items TO shop_rw;
CREATE ROLE shop_service LOGIN IN ROLE shop_rw;

SELECT has_table_privilege('shop_service', 'orders', 'INSERT')      AS can_insert,
       has_table_privilege('shop_service', 'orders', 'DELETE')      AS can_delete,
       has_table_privilege('shop_service', 'employees', 'SELECT')   AS can_read_employees;
```

**Explanation:** `shop_service` inherits `shop_rw`'s privileges. If the tables used `serial`/identity columns, the role would also need `USAGE` on their sequences (identity sequences are covered by table privileges for inserts).

</details>

### P3. Hide salaries

**Difficulty:** Medium · **Type:** Query · **Concepts:** column privileges

Create a login role `directory_app` that can read every column of `employees` except `salary` and `commission`, then show which columns it can select.

**Expected output:**

```text
 column_name
-------------
 dept_id
 email
 emp_id
 hire_date
 manager_id
 name
(6 rows)
```

<details>
<summary>Solution</summary>

```sql
CREATE ROLE directory_app LOGIN;
GRANT USAGE ON SCHEMA public TO directory_app;
GRANT SELECT (emp_id, name, email, dept_id, manager_id, hire_date) ON employees TO directory_app;

SELECT column_name
FROM information_schema.column_privileges
WHERE grantee = 'directory_app' AND table_name = 'employees' AND privilege_type = 'SELECT'
ORDER BY column_name;
```

</details>

### P4. Tenant isolation

**Difficulty:** Hard · **Type:** Query · **Concepts:** row-level security, WITH CHECK

**Schema and data:**

```sql
CREATE TABLE notes (id int PRIMARY KEY, tenant_id int NOT NULL, body text);
INSERT INTO notes VALUES (1, 1, 'tenant one note'), (2, 2, 'tenant two note'), (3, 1, 'another for one');
CREATE ROLE notes_app LOGIN;
GRANT USAGE ON SCHEMA public TO notes_app;
GRANT SELECT, INSERT ON notes TO notes_app;
```

Enable RLS so that `notes_app` sees and inserts only rows of the tenant in `app.tenant_id`. As tenant 1, list the notes and try to insert a note for tenant 2.

**Expected output:**

```text
 id |      body
----+-----------------
  1 | tenant one note
  3 | another for one
(2 rows)

ERROR:  new row violates row-level security policy for table "notes"
```

<details>
<summary>Solution</summary>

```sql
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_notes ON notes
    USING (tenant_id = current_setting('app.tenant_id')::int)
    WITH CHECK (tenant_id = current_setting('app.tenant_id')::int);

SET ROLE notes_app;
SET app.tenant_id = '1';
SELECT id, body FROM notes ORDER BY id;
INSERT INTO notes VALUES (4, 2, 'sneaky');
RESET ROLE;
```

**Explanation:** The application sets `app.tenant_id` at the start of each request (and must reset it before returning a pooled connection).

</details>

### P5. The injection

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** SQL injection, prepared statements

A login endpoint builds `"SELECT id FROM users WHERE email = '" + email + "' AND password_hash = crypt('" + pw + "', password_hash)"`. Show an input that logs in without a password, and rewrite it safely in JDBC.

<details>
<summary>Answer</summary>

An email of `anyone@x.com' OR '1'='1' --` produces `… WHERE email = 'anyone@x.com' OR '1'='1' --' AND password_hash = …`: the `OR` makes the condition true for every row and `--` comments out the password check, so the first user is returned.

```java
// Illustrative fragment
String sql = "SELECT id FROM users WHERE email = ? AND password_hash = crypt(?, password_hash)";
try (PreparedStatement ps = conn.prepareStatement(sql)) {
    ps.setString(1, email);
    ps.setString(2, password);
    try (ResultSet rs = ps.executeQuery()) {
        // authenticated only if a row is returned
    }
}
```

Values bound with `setString` are never parsed as SQL. Also: the login role should have only the privileges the endpoint needs.

</details>
