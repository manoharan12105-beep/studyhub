# The Relational Model — Interview Questions

## Beginner

### Q1. What is a relational database?

<details>
<summary>Answer</summary>

A database that stores data in tables (relations) of rows and columns, where relationships between tables are represented by matching key values (foreign keys referencing primary keys), and which is queried with SQL. PostgreSQL, MySQL and Oracle are relational DBMSs.

</details>

### Q2. Define tuple, attribute, degree and cardinality.

<details>
<summary>Answer</summary>

A tuple is a row; an attribute is a column; the degree is the number of attributes (columns); the cardinality is the number of tuples (rows). The sample `employees` table has degree 8 and cardinality 12.

</details>

### Q3. What is a domain?

<details>
<summary>Answer</summary>

The set of valid values for an attribute — its data type plus any restrictions. For `salary`, the domain is positive integers. PostgreSQL's `CREATE DOMAIN positive_money AS numeric(12,2) CHECK (VALUE > 0)` names such a domain so many columns can reuse it.

</details>

### Q4. Is a row the same as a record?

<details>
<summary>Answer</summary>

In everyday use, yes: row, record and tuple all refer to one entry of a table. "Tuple" is the formal relational term; "record" comes from file-based systems.

</details>

## Intermediate

### Q5. What are the properties of a relation?

<details>
<summary>Answer</summary>

Atomic values in each cell, no duplicate tuples, no meaningful order of tuples, no meaningful order of attributes, distinct attribute names, and each attribute's values drawn from its domain.

</details>

### Q6. How do SQL tables differ from relations in theory?

<details>
<summary>Answer</summary>

SQL tables can hold duplicate rows unless a key prevents it, and query results are bags unless `DISTINCT` is used. Columns have positions. SQL has `NULL` with three-valued logic, which pure relational theory (as Codd first defined it) does not. Row order is unspecified in both — SQL needs `ORDER BY` for a guaranteed order.

</details>

### Q7. Map relational algebra operations to SQL.

<details>
<summary>Answer</summary>

Selection σ → `WHERE`; projection π → the `SELECT` list (`DISTINCT` for set semantics); union → `UNION`; difference → `EXCEPT`; intersection → `INTERSECT`; Cartesian product → `CROSS JOIN`; join → `JOIN … ON`; rename → `AS`.

</details>

## Advanced

### Q8. Why does the relational model represent relationships by values instead of pointers?

<details>
<summary>Answer</summary>

Values make every relationship queryable, including ones nobody planned (join any columns with compatible domains), keep the logical model independent of physical storage (data can be reorganised without breaking links), and allow a declarative language with an optimiser that chooses how to find matches (index lookups, hash joins). Pointer-based models tied queries to the navigation paths built into the data.

</details>

### Q9. A query without `ORDER BY` has always returned rows in insertion order. Can you rely on that?

<details>
<summary>Answer</summary>

No. Order is unspecified without `ORDER BY`. In PostgreSQL it can change after updates (new row versions are written elsewhere in the table), after `VACUUM`, when the planner switches to an index or parallel scan, or when synchronized sequential scans start mid-table. Always add `ORDER BY` when order matters.

</details>
