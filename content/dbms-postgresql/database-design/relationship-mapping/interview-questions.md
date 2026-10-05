# Mapping Relationships to Tables — Interview Questions

## Beginner

### Q1. How do you implement a one-to-many relationship?

<details>
<summary>Answer</summary>

Add a foreign key column in the table on the "many" side referencing the primary key of the "one" side: `employees.dept_id REFERENCES departments (dept_id)`. Make it `NOT NULL` if every child must have a parent, choose an `ON DELETE` action, and index the column.

</details>

### Q2. How do you implement a many-to-many relationship?

<details>
<summary>Answer</summary>

With a junction table holding foreign keys to both tables, e.g. `enrollments (student_id REFERENCES students, course_id REFERENCES courses, PRIMARY KEY (student_id, course_id))`. The composite key prevents duplicate pairs; attributes of the relationship (grade, enrolled_on) are extra columns of the junction table. Add an index on the second key column for lookups from that side.

</details>

### Q3. How do you implement a one-to-one relationship?

<details>
<summary>Answer</summary>

A foreign key with a `UNIQUE` constraint in the table whose rows are optional (`user_profiles.user_id UNIQUE REFERENCES users`), or make that foreign key the primary key (shared primary key). Often the simplest choice is to keep the columns in one table; split only for optional, large, sensitive or differently-accessed data.

</details>

## Intermediate

### Q4. Why not store a list of ids in a column instead of a junction table?

<details>
<summary>Answer</summary>

It violates first normal form, cannot be protected by foreign keys (dangling ids), cannot hold per-link attributes, makes "who is linked to X" queries hard to index (string parsing or array GIN indexes instead of B-tree joins), and every change rewrites the whole value, causing lost updates under concurrency.

</details>

### Q5. Should a junction table have a surrogate primary key?

<details>
<summary>Answer</summary>

Usually the composite key of the two foreign keys is enough and enforces uniqueness directly. A surrogate `id` (with `UNIQUE (a_id, b_id)` kept!) helps when other tables reference the link itself, when ORMs prefer single-column ids, or when the same pair may legitimately repeat (then the natural key must include the distinguishing column, such as semester).

</details>

### Q6. How do you model an employee–manager relationship?

<details>
<summary>Answer</summary>

A self-referencing foreign key: `employees.manager_id integer REFERENCES employees (emp_id)`, nullable for the top of the hierarchy. Query direct reports with a self join and whole subtrees with a recursive CTE.

</details>

## Advanced

### Q7. Compare the three strategies for mapping inheritance to tables.

<details>
<summary>Answer</summary>

Single table: one table with a discriminator column and nullable sub-type columns — fastest and simplest, but needs `CHECK` constraints to keep sub-type rules and wastes space on `NULL`s. Joined (table per sub-type with a shared PK): normalized, sub-type columns can be `NOT NULL`, but reads need joins. Table per concrete class: each sub-type is a complete table — no joins for single-type queries, but polymorphic queries need `UNION ALL` and ids must be unique across tables. These are JPA's `SINGLE_TABLE`, `JOINED` and `TABLE_PER_CLASS`.

</details>

### Q8. How do you guarantee that a 1:N relationship has at least one child (e.g. every order has at least one item)?

<details>
<summary>Answer</summary>

A foreign key cannot express "at least one child". Options: create the parent and its children in one transaction and check with a **deferred constraint trigger** at commit (`CREATE CONSTRAINT TRIGGER … DEFERRABLE INITIALLY DEFERRED` that raises an error if the order has no items); or enforce it in the application/service layer; or redesign so the first child is stored in the parent row. Most systems enforce it in the service layer and verify with periodic checks.

</details>

### Q9. A junction table `user_roles (user_id, role_id)` is slow when listing all users of a role. Why, and what is the fix?

<details>
<summary>Answer</summary>

The primary key index on `(user_id, role_id)` is ordered by `user_id` first, so it helps "roles of a user" but not "users of a role" (the leading column is not constrained). Add an index on `(role_id)` — or `(role_id, user_id)` to make it covering.

</details>
