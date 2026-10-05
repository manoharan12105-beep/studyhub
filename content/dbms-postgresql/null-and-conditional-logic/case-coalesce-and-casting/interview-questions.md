# CASE, COALESCE, NULLIF and Type Casting — Interview Questions

## Beginner

### Q1. What is the difference between simple and searched CASE?

<details>
<summary>Answer</summary>

Simple `CASE x WHEN v1 THEN … END` compares one expression with values using equality. Searched `CASE WHEN condition THEN … END` evaluates an arbitrary boolean condition per branch, so it supports ranges, `IS NULL`, `LIKE` and combined conditions. Both return the first matching branch's result, or `ELSE` (NULL if there is no `ELSE`).

</details>

### Q2. What does COALESCE do?

<details>
<summary>Answer</summary>

Returns the first non-NULL argument, or NULL if all are NULL. Example: `COALESCE(city, 'Unknown')`. All arguments must have a compatible type.

</details>

### Q3. What does NULLIF do? Give a use case.

<details>
<summary>Answer</summary>

`NULLIF(a, b)` returns NULL when `a = b`, otherwise `a`. Use case: `revenue / NULLIF(orders, 0)` returns NULL instead of a division-by-zero error; `NULLIF(trim(name), '')` turns blank input into NULL.

</details>

### Q4. How do you cast a value in PostgreSQL?

<details>
<summary>Answer</summary>

`CAST(expr AS type)` (standard), `expr::type` (PostgreSQL shorthand) or `type 'literal'` for string literals. For formatted text use `to_date`, `to_timestamp`, `to_number`, `to_char` with a format pattern.

</details>

## Intermediate

### Q5. What happens if no WHEN matches and there is no ELSE?

<details>
<summary>Answer</summary>

The `CASE` expression returns NULL. That can silently produce NULLs in reports; add an explicit `ELSE` when every row must get a value.

</details>

### Q6. How would you count delivered and cancelled orders per customer in one query?

<details>
<summary>Answer</summary>

Conditional aggregation: `SELECT customer_id, count(*) FILTER (WHERE status = 'DELIVERED') AS delivered, count(*) FILTER (WHERE status = 'CANCELLED') AS cancelled FROM orders GROUP BY customer_id;` Portable form: `sum(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END)` or `count(CASE WHEN … THEN 1 END)`.

</details>

### Q7. Why does `WHERE int_col = text_col` fail in PostgreSQL but `WHERE int_col = '10'` works?

<details>
<summary>Answer</summary>

PostgreSQL has no implicit cast between `integer` and `text`, so `integer = text` has no operator: "operator does not exist: integer = text". A quoted literal, however, starts with type *unknown* and is resolved to the other operand's type, so `'10'` becomes an integer. Cast explicitly: `int_col = text_col::integer`.

</details>

### Q8. What is `'4.7'::integer` and `4.7::integer`?

<details>
<summary>Answer</summary>

`'4.7'::integer` is an error — the text is not a valid integer literal. `4.7::integer` converts a numeric value and rounds it to 5. To convert decimal text to an integer: `'4.7'::numeric::integer` (5) or `trunc('4.7'::numeric)::integer` (4).

</details>

### Q9. Do GREATEST and LEAST return NULL if an argument is NULL?

<details>
<summary>Answer</summary>

Not in PostgreSQL — they ignore NULL arguments and return NULL only if all are NULL. MySQL and Oracle return NULL if any argument is NULL. Wrap arguments in `COALESCE` if you need the strict behaviour or portable code.

</details>

## Advanced

### Q10. Why did PostgreSQL remove most implicit casts to text?

<details>
<summary>Answer</summary>

Silent conversions produced surprising results — comparisons done as text (`'10' < '9'`), indexes not used, wrong matches — and hid schema mistakes such as storing numbers as text. Since 8.3, PostgreSQL requires explicit casts across type categories, so type mismatches are errors you notice early.

</details>

### Q11. Does CASE guarantee short-circuit evaluation?

<details>
<summary>Answer</summary>

Mostly: branches are evaluated in order and later branches are not evaluated once one matches, so `CASE WHEN x = 0 THEN 0 ELSE 1 / x END` avoids division by zero at run time. Exceptions: constant subexpressions may be folded at planning time (`CASE WHEN x > 0 THEN 1 / 0 END` can raise the error during planning), and aggregates inside `CASE` are computed before the `CASE` itself. Don't use `CASE` to guard an aggregate's arguments — guard inside the aggregate.

</details>

### Q12. Inserting `91.6` into an integer column succeeded with 92. Why, and is it a problem?

<details>
<summary>Answer</summary>

PostgreSQL applies an **assignment cast** from `numeric` to `integer` when storing a value, which rounds. It is a problem if precision matters (money, measurements): data is silently changed. Use `numeric(p, s)` for exact decimals and validate input.

</details>
