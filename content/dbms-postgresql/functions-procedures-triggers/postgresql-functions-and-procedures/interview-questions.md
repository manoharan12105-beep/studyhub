# Functions and Procedures — Interview Questions

## Beginner

### Q1. What is the difference between a function and a stored procedure in PostgreSQL?

<details>
<summary>Answer</summary>

A function returns a value (scalar, row, set or `void`) and is called from SQL (`SELECT f()`, `FROM f()`), always inside the caller's transaction. A procedure (PostgreSQL 11+) is invoked with `CALL`, returns nothing except `OUT` parameters, cannot be used in queries, and can issue `COMMIT`/`ROLLBACK` inside its body when called outside an explicit transaction block — which suits batch processing.

</details>

### Q2. What languages can you write PostgreSQL functions in?

<details>
<summary>Answer</summary>

Built in: `sql` and `plpgsql` (procedural, with variables, control flow and exception handling), plus C. Extensions add others, such as PL/Python, PL/Perl, PL/v8 (JavaScript) and PL/Java. SQL functions can be inlined by the planner; PL/pgSQL is the usual choice for trigger functions and logic that needs control flow.

</details>

### Q3. How do you return multiple rows from a function?

<details>
<summary>Answer</summary>

Declare `RETURNS TABLE (col type, …)` or `RETURNS SETOF type` and call it in `FROM`: `SELECT * FROM customer_orders(1)`. In a SQL function, the final query's rows are returned; in PL/pgSQL, use `RETURN QUERY SELECT …` (possibly several times) or `RETURN NEXT` per row.

</details>

## Intermediate

### Q4. What are IMMUTABLE, STABLE and VOLATILE?

<details>
<summary>Answer</summary>

Volatility categories that tell the planner how a function behaves. `IMMUTABLE`: same result for the same arguments forever, no database access — can be pre-evaluated and used in indexes and generated columns. `STABLE`: same result within a single statement, may read data — can be evaluated once per statement (e.g. `now()`). `VOLATILE` (default): may change on every call or have side effects — evaluated for every row. Mislabeling a function as immutable can give wrong results.

</details>

### Q5. What does SECURITY DEFINER do, and what is the risk?

<details>
<summary>Answer</summary>

The function runs with the privileges of its owner rather than the caller, allowing controlled access to data the caller cannot touch directly (e.g. a function that lets users reset their own password row). The risk: an attacker who can create objects in a schema on the function's `search_path` can make unqualified names resolve to their objects, executing code with the owner's rights. Always set `SET search_path = pg_catalog, public` (or similar) on such functions, qualify names, and grant `EXECUTE` only to intended roles.

</details>

### Q6. How does exception handling work in PL/pgSQL, and what does it cost?

<details>
<summary>Answer</summary>

A block can end with `EXCEPTION WHEN condition THEN …` (e.g. `unique_violation`, `foreign_key_violation`, `OTHERS`). If an error occurs, the block's changes are rolled back and the handler runs; the function can continue. This is implemented with a subtransaction started at block entry, which costs time and consumes subtransaction ids — avoid exception blocks inside loops that run thousands of times.

</details>

## Advanced

### Q7. Why might a SQL function be faster than an equivalent PL/pgSQL function?

<details>
<summary>Answer</summary>

Simple SQL functions (a single `SELECT`, not `SECURITY DEFINER`, appropriate volatility) can be inlined: the planner substitutes the body into the calling query and optimizes the whole thing — pushing down conditions, using indexes, choosing join orders. PL/pgSQL functions are opaque: the planner sees a black box with a fixed cost and row estimate, and each call runs separately.

</details>

### Q8. How would you process 10 million rows in a stored routine without one giant transaction?

<details>
<summary>Answer</summary>

Use a procedure (not a function) that loops over batches — e.g. update `LIMIT 10000` rows that still need processing, `COMMIT`, repeat until none remain — and `CALL` it outside an explicit transaction block (autocommit). Each batch releases its locks and lets vacuum reclaim space; the job can resume after failure if the batch condition is idempotent. A function cannot do this because it always runs inside its caller's single transaction.

</details>

### Q9. Should business logic live in stored procedures or in the application?

<details>
<summary>Answer</summary>

Trade-off. In the database: rules enforced for every client, fewer round trips for data-heavy operations, atomicity. In the application: easier testing, debugging, version control, deployment and scaling, and portability. A common balance: integrity rules as constraints (and sometimes triggers) in the database, workflow and integrations in the application, and database functions for set-based operations where moving data to the application would be wasteful.

</details>
