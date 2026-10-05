# Triggers — Interview Questions

## Beginner

### Q1. What is a trigger?

<details>
<summary>Answer</summary>

A database object that automatically executes a function when a specified event (`INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`) occurs on a table or view. In PostgreSQL the logic lives in a function declared `RETURNS trigger`, attached with `CREATE TRIGGER … EXECUTE FUNCTION`. Uses: audit logs, `updated_at` timestamps, data normalisation, complex validation, maintaining derived data.

</details>

### Q2. What is the difference between BEFORE and AFTER triggers?

<details>
<summary>Answer</summary>

A `BEFORE` row trigger runs before the row is written and can modify the new row (`NEW`) or cancel the operation for that row by returning `NULL`. An `AFTER` row trigger runs after the row has been written (at the end of the statement), sees the final values, cannot change them, and is used for side effects such as audit records or updating other tables.

</details>

### Q3. What are NEW and OLD?

<details>
<summary>Answer</summary>

Record variables available in row-level trigger functions: `NEW` holds the row being inserted or the updated version; `OLD` holds the row before an update or the row being deleted. `NEW` is `NULL` in `DELETE` triggers and `OLD` is `NULL` in `INSERT` triggers.

</details>

## Intermediate

### Q4. Row-level vs statement-level triggers?

<details>
<summary>Answer</summary>

A `FOR EACH ROW` trigger fires once per affected row and can access `NEW`/`OLD`. A `FOR EACH STATEMENT` trigger fires once per statement — even if no rows are affected — and has no `NEW`/`OLD`, but `AFTER` statement triggers can declare transition tables (`REFERENCING NEW TABLE AS …, OLD TABLE AS …`) to read all changed rows at once. Statement triggers are far cheaper for bulk operations.

</details>

### Q5. What happens if a BEFORE trigger returns NULL?

<details>
<summary>Answer</summary>

The operation is silently skipped for that row: nothing is inserted, updated or deleted, no error is raised, and later triggers for the row do not run. The statement's row count reflects the skipped rows (e.g. `INSERT 0 1` for a two-row insert). Forgetting `RETURN NEW` in a BEFORE trigger causes exactly this bug.

</details>

### Q6. What is an INSTEAD OF trigger?

<details>
<summary>Answer</summary>

A row-level trigger defined on a view that replaces the attempted `INSERT`, `UPDATE` or `DELETE` with the trigger function's logic. It makes views that are not automatically updatable (joins, aggregates) writable, by translating the change into operations on the base tables.

</details>

### Q7. In what order do multiple triggers on the same event fire?

<details>
<summary>Answer</summary>

Triggers of the same timing and level on the same table fire in alphabetical order of their names. BEFORE triggers run before the row is written; each sees the `NEW` produced by the previous one. Name triggers with a prefix (`a_`, `b_`) if order matters, or combine the logic into one function.

</details>

## Advanced

### Q8. When should you avoid triggers?

<details>
<summary>Answer</summary>

When a declarative feature does the job (constraints, defaults, generated columns, exclusion constraints, foreign key actions); when the logic is a business workflow that belongs in the application and needs testing and visibility; for high-volume bulk operations where per-row triggers would multiply cost; and for anything calling external systems (it would run inside the transaction). Triggers that do exist should be small, documented and idempotent.

</details>

### Q9. How can a trigger enforce "a member may have at most 5 open loans" safely under concurrency?

<details>
<summary>Answer</summary>

A naive `BEFORE INSERT` trigger that counts open loans can be raced: two transactions both count 4 and both insert. Serialize per member: in the trigger, `SELECT … FROM members WHERE member_id = NEW.member_id FOR UPDATE` (lock the parent row) before counting, so concurrent inserts for the same member queue. Alternatives: a counter column on `members` updated in the trigger with a `CHECK (open_loans <= 5)`, or running the inserting transactions at `SERIALIZABLE`.

</details>

### Q10. Do DELETE triggers fire on TRUNCATE? On COPY?

<details>
<summary>Answer</summary>

`TRUNCATE` does not fire `DELETE` triggers (it does not process rows individually); define `ON TRUNCATE` statement-level triggers if needed. `COPY FROM` fires `INSERT` triggers (row and statement) like normal inserts, which can slow bulk loads considerably — consider disabling non-essential triggers during maintenance loads.

</details>
