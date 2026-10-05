# Backend Developer Database Questions — Interview Questions

## Beginner

### Q1. Why use `PreparedStatement` instead of building SQL strings?

<details>
<summary>Answer</summary>

Bound parameters are sent separately from the SQL text, so user input can never change the query's structure. That is the main defence against **SQL injection**. They also handle quoting and types correctly, and they allow the server to reuse plans.

```java
// Illustrative fragment
String sql = "SELECT customer_id, name FROM customers WHERE email = ?";
try (PreparedStatement ps = connection.prepareStatement(sql)) {
    ps.setString(1, email);
    try (ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
            System.out.println(rs.getInt("customer_id") + " " + rs.getString("name"));
        }
    }
}
```

Identifiers (table or column names chosen at runtime) cannot be parameters. Validate them against an allow-list.

</details>

### Q2. What is a connection pool, and why is it needed?

<details>
<summary>Answer</summary>

Opening a PostgreSQL connection is expensive (TCP + TLS + authentication + a new backend process). A pool keeps a set of open connections and lends them to request threads. It also caps the load on the database. Spring Boot uses HikariCP by default. A request borrows a connection, uses it and returns it (closing a pooled connection returns it). Leaked connections (not closed) exhaust the pool, and requests then time out waiting.

</details>

### Q3. How do you handle a unique-constraint violation in Java code?

<details>
<summary>Answer</summary>

Let the database enforce uniqueness, and translate the error. The PostgreSQL driver throws a `SQLException` (`PSQLException`) whose `getSQLState()` is `23505`:

```java
// Illustrative fragment
try {
    insertUser(connection, email);
} catch (SQLException e) {
    if ("23505".equals(e.getSQLState())) {
        throw new EmailAlreadyRegisteredException(email);
    }
    throw e;
}
```

Spring translates it to `DataIntegrityViolationException` (`DuplicateKeyException`). Checking "does it exist?" first is not enough under concurrency; the constraint is the guarantee. Alternatively use `ON CONFLICT DO NOTHING` and check the row count.

</details>

### Q4. Should money be stored as `float`?

<details>
<summary>Answer</summary>

No. Binary floating point cannot represent most decimal fractions exactly (`0.1 + 0.2 ≠ 0.3`), and rounding errors accumulate. Use `numeric(12,2)` (exact decimal) in PostgreSQL and `BigDecimal` in Java. Alternatively store integer minor units (paise, cents) in `bigint`. Store the currency alongside if more than one is possible.

</details>

## Intermediate

### Q5. How big should the connection pool be?

<details>
<summary>Answer</summary>

Smaller than people expect. A database can only execute about as many queries in parallel as it has CPU cores (plus some for I/O waits); beyond that, connections queue inside the database and add context switching and memory. A common starting point is a few times the core count **in total** across all application instances, then tune by measuring. Remember the multiplication: 20 instances × a pool of 50 = 1,000 connections. Use PgBouncer if many services must share a database.

</details>

### Q6. What does Spring's `@Transactional` do at the database level?

<details>
<summary>Answer</summary>

On entering the method, Spring takes a connection, sets `autoCommit(false)` (and the isolation level or read-only flag if specified) and binds the connection to the thread. Repository calls inside use that connection. On normal return it commits; on a `RuntimeException` (by default) it rolls back. Pitfalls:

- it works through a proxy, so self-invocation from the same class bypasses it;
- checked exceptions do not roll back unless `rollbackFor` is set;
- a long method holds a connection, and possibly row locks, for its whole duration;
- calling external services inside it keeps the transaction open while waiting.

</details>

### Q7. How do you make a payment API safe to retry?

<details>
<summary>Answer</summary>

Use an **idempotency key**. The client sends a unique key per logical request; the server stores it with a unique constraint in the same transaction as the effect:

```sql
-- Illustrative
INSERT INTO payment_requests (idempotency_key, order_id, amount)
VALUES ($1, $2, $3)
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING id;
```

If no row is returned, the request was already processed: return the stored result instead of charging again. The unique constraint makes this safe under concurrency, unlike "select, then insert".

</details>

### Q8. How do you change a schema without downtime?

<details>
<summary>Answer</summary>

Use backward-compatible steps (**expand → migrate → contract**), each deployable on its own:

1. **Expand**: add the new nullable column or table (fast). Deploy code that writes both old and new.
2. **Migrate**: backfill in batches, then add constraints with `NOT VALID` followed by `VALIDATE CONSTRAINT` (no long exclusive lock).
3. Switch reads to the new column.
4. **Contract**: drop the old column after all code stops using it.

Also: `CREATE INDEX CONCURRENTLY`; set `lock_timeout` so a migration waiting for a lock does not block all traffic behind it. Adding a column with a constant default is fast since PostgreSQL 11; changing a column type usually rewrites the table.

</details>

### Q9. Soft delete (`deleted_at`) or hard delete?

<details>
<summary>Answer</summary>

Soft delete keeps rows with a `deleted_at` timestamp. It allows undo and audit, and keeps foreign keys intact. Costs:

- every query must filter `WHERE deleted_at IS NULL` (easy to forget; use views or ORM filters);
- unique constraints must become partial (`UNIQUE (email) WHERE deleted_at IS NULL`);
- tables keep growing;
- privacy laws may require real deletion.

Alternatives: hard delete plus an audit or history table (filled by trigger), or archiving to a separate table. Choose by the audit and recovery requirements.

</details>

### Q10. How do you implement pagination for an API listing orders?

<details>
<summary>Answer</summary>

For small offsets, `ORDER BY order_date DESC, order_id DESC LIMIT 20 OFFSET 40` is simple. For large or infinite lists, use **keyset pagination**: return a cursor containing the last row's `(order_date, order_id)` and query `WHERE (order_date, order_id) < ($1, $2) ORDER BY order_date DESC, order_id DESC LIMIT 20`. With an index on `(order_date, order_id)` the cost is constant per page, and rows inserted meanwhile do not shift pages. The order must be total, so include a unique tiebreaker.

</details>

## Advanced

### Q11. How do you reliably publish an event when a row changes (no lost or phantom events)?

<details>
<summary>Answer</summary>

The **transactional outbox**: in the same transaction as the business change, insert the event into an `outbox` table. A separate relay process reads unpublished outbox rows (`FOR UPDATE SKIP LOCKED`), publishes them to the broker, and marks them sent. Because the event and the change commit or roll back together, there are no events for rolled-back changes and no changes without events. Delivery is at least once, so consumers must be idempotent. Change data capture through logical decoding (Debezium) is the alternative to polling.

</details>

### Q12. Reads go to a replica. A user updates their profile and then sees the old data. Why, and how do you fix it?

<details>
<summary>Answer</summary>

Asynchronous replicas lag behind the primary (milliseconds to seconds, or more under load), so a read right after a write can hit a replica that has not replayed it yet. Fixes:

- **read-your-writes** routing (send that user's reads to the primary for a short time after a write, or route by session);
- read from the primary for requests that follow a write;
- wait until the replica has replayed the write's LSN;
- accept staleness only on pages where it is harmless.

Synchronous replication with `remote_apply` removes the lag at the cost of write latency.

</details>

### Q13. How would you design multi-tenancy in PostgreSQL?

<details>
<summary>Answer</summary>

| Model | Isolation | Cost |
|-------|-----------|------|
| Database per tenant | Strongest | Many databases and connections; hard to run cross-tenant queries |
| Schema per tenant | Good | Many objects; migrations run once per schema |
| Shared tables with `tenant_id` | Weakest by default | Simplest operations; must never forget the filter |

For shared tables, add `tenant_id` to keys and indexes and enforce isolation with **row-level security** (`USING (tenant_id = current_setting('app.tenant_id')::int)`), so a missing `WHERE` cannot leak data. Large tenants can later be moved to their own database.

</details>

### Q14. A cache sits in front of the database. How do you keep it consistent?

<details>
<summary>Answer</summary>

Common pattern: **cache-aside**. Read from the cache, fall back to the database and populate the cache. On writes, update the database, **then delete** (not update) the cache entry, so the next read reloads it. Remaining risks:

- a race where a reader repopulates stale data just after the delete — short TTLs or delayed double-delete limit it;
- a stampede on popular keys after expiry — request coalescing.

For strong consistency, do not cache, or drive invalidation from database change events (outbox or CDC). Everything cached must tolerate some staleness.

</details>
