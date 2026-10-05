# Schema Design Case Studies — Interview Questions

## Beginner

### Q1. How do you approach a "design the database for X" question?

<details>
<summary>Answer</summary>

Clarify requirements and the main use cases; list entities and their keys; define relationships with cardinality and participation; map to tables with foreign keys and junction tables; turn business rules into constraints (`NOT NULL`, `CHECK`, `UNIQUE`, partial indexes, exclusion constraints); decide what history to keep; add indexes for the main queries; and discuss concurrency (double booking, overselling) and growth (`bigint` keys, partitioning, archiving). Say the trade-offs out loud.

</details>

### Q2. Why does an order line store the unit price instead of joining to the product's current price?

<details>
<summary>Answer</summary>

The price paid is a historical fact; the catalogue price changes over time. Joining invoices to the current price would rewrite history. Storing `unit_price` in the order line is not harmful redundancy — it is a different fact (price at purchase time), so it does not violate normalization.

</details>

## Intermediate

### Q3. How do you prevent double booking of a hotel room in PostgreSQL?

<details>
<summary>Answer</summary>

Store the stay as a `daterange` and add an exclusion constraint: `EXCLUDE USING gist (room_id WITH =, stay WITH &&)` (with the `btree_gist` extension), optionally `WHERE (status = 'CONFIRMED')`. The database rejects any overlapping booking for the same room, including two concurrent requests — unlike "check availability then insert" in application code, which races. Half-open ranges `[check_in, check_out)` let one guest check out the day the next checks in.

</details>

### Q4. How do you enforce "only one active X per Y" (one open loan per copy, one default address per customer)?

<details>
<summary>Answer</summary>

With a partial unique index: `CREATE UNIQUE INDEX ON loans (copy_id) WHERE returned_on IS NULL` or `ON addresses (customer_id) WHERE is_default`. Uniqueness applies only to rows matching the condition, so history rows (returned loans, non-default addresses) are unrestricted.

</details>

### Q5. How do you prevent overselling stock?

<details>
<summary>Answer</summary>

Decrement stock in the same transaction as the order with `UPDATE products SET stock = stock - :qty WHERE id = :id` and a `CHECK (stock >= 0)` (or `… AND stock >= :qty` and check that one row was updated). The `UPDATE` row-locks the product, so concurrent orders serialize on it and each sees the latest value; the constraint turns an oversell into an error. Reading stock first and writing a computed value back loses updates.

</details>

## Advanced

### Q6. How would you keep a history of status changes?

<details>
<summary>Answer</summary>

Keep the current status on the main row for fast reads, and append every change to a history table `(entity_id, status, changed_at, changed_by)`, written in the same transaction — often by an `AFTER UPDATE` trigger so no code path can skip it. Alternatives: event sourcing (history is the source of truth) or temporal tables with validity ranges and an exclusion constraint preventing overlapping periods.

</details>

### Q7. Soft delete vs hard delete — trade-offs?

<details>
<summary>Answer</summary>

Soft delete (`deleted_at timestamptz`) keeps data for audit and undo, but every query must filter it (views or row-level security help), unique constraints need to become partial (`UNIQUE (email) WHERE deleted_at IS NULL`), foreign keys no longer stop references to "deleted" rows, and tables grow. Hard delete keeps queries and constraints simple; combine it with an archive or audit table when history is needed. Privacy regulations may require real deletion.

</details>

### Q8. Design the tables for a URL shortener. What are the main concerns?

<details>
<summary>Answer</summary>

`links (code text PRIMARY KEY, target_url text NOT NULL, owner_id bigint REFERENCES users, created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz)` and `clicks (code text REFERENCES links, clicked_at timestamptz, referrer text, …)`. Concerns: short codes must be unique (primary key; generate with base62 of a sequence, or random with retry on conflict via `ON CONFLICT DO NOTHING`); redirect lookups are by primary key; `clicks` grows fastest — partition it by time, or aggregate counts per day instead of storing every click; consider an index on `(owner_id, created_at)` for "my links".

</details>
