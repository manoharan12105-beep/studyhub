# Diff Inspection, Security Review and Performance Investigation

**Module:** Debugging, Testing and Code Quality · **Interview priority:** Frequently asked

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 (October 2026). The SQL injection results come from the running orderdesk starter app and its MockMvc tests. `SearchPlan.java` was compiled and run on JDK 21 with H2 2.4.240 (the version orderdesk uses); its timings vary between runs and machines, its query plans don't.

## Definition

**Diff inspection** is reading an AI-written change line by line for what it does, not what it claims. A **security review** looks for ways input can make the code do something unintended — injection, data exposure, missing validation, leaked secrets. A **performance investigation** finds why something is slow by **measuring** — query plans, timings, counts — before changing code.

## Why It Matters

- AI-written code reproduces patterns from its context. If the codebase already concatenates SQL, new code may too.
- Security bugs rarely fail tests: the starter's SQL injection passes every existing test.
- Performance "fixes" without measurements (caches, async, rewrites) add complexity and often don't touch the real bottleneck.

## How It Works

```text
diff ──► inspect: intent, scope, data flow from input to sink
            │
            ├─ security: where does user input go?  (SQL, logs, files, responses)
            │     └─► prove with a test that sends hostile input
            │
            └─ performance: what is slow, by how much, why?
                  └─► measure → hypothesis → change one thing → measure again
```

## Inspecting AI-Written Diffs

Trace each input from where it enters to where it's used ("source to sink"):

| Source | Sink | Question |
|--------|------|----------|
| `@RequestParam email` | SQL string | Is it a parameter (`?`) or concatenated? |
| Request body fields | Entity, database | Validated (`@Valid`, constraints)? |
| Any input | Logs | Personal data or secrets logged? |
| Exceptions | HTTP response | Internal details exposed to clients? |

## Security Review: SQL Injection in orderdesk

The starter's `OrderSearchDao`:

```java
/** Used by the support dashboard to find a customer's orders. */
public List<Long> findIdsByCustomerEmail(String email) {
    String sql = "SELECT id FROM orders WHERE customer_email = '" + email + "' ORDER BY id";
    return jdbc.queryForList(sql, Long.class);
}
```

Evidence from the running starter app (two orders stored, one with a matching email):

| Request | Response |
|---------|----------|
| `GET /api/orders/search?email=asha@example.com` | `[2]` |
| `GET /api/orders/search?email=x' OR '1'='1` | `[1,2]` — every order |

The input closed the string literal and added `OR '1'='1'`, so the `WHERE` clause matched all rows. The same hole can read other tables with crafted input. The fix passes the value as a **parameter**:

```java
/** Used by the support dashboard to find a customer's orders. */
public List<Long> findIdsByCustomerEmail(String email) {
    return jdbc.queryForList(
            "SELECT id FROM orders WHERE customer_email = ? ORDER BY id", Long.class, email);
}
```

And a regression test proves it:

```java
// Regression test for SEC-3: the search used to concatenate the email into SQL.
@Test
void searchTreatsInputAsAValueNotAsSql() throws Exception {
    orders.save(new Order("meera@example.com", 1_000, null));

    mvc.perform(get("/api/orders/search").param("email", "x' OR '1'='1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(0));
}
```

On the starter it fails with `JSON path "$.length()" expected:<0> but was:<2>`; with the parameterized query it passes. Ways to run this review with Claude Code: `/security-review` (needs an `origin` remote), the `security-reviewer` subagent, or the `sql-review` skill — each a hint generator, validated by the test.

> [!WARNING]
> Escaping quotes by hand (`email.replace("'", "''")`) is not the fix. Parameters separate code from data by construction; hand-escaping depends on getting every case right.

## Performance Investigation with Measurements

The support search runs on every dashboard load. Before guessing ("add a cache"), measure. `SearchPlan.java` loads 200,000 orders (10 per customer) into an in-memory H2 database with orderdesk's schema and measures the parameterized search before and after an index:

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Arrays;

/** Measures the support-dashboard search on 200,000 orders, before and after adding an index. */
public class SearchPlan {

    private static final String SEARCH = "SELECT id FROM orders WHERE customer_email = ? ORDER BY id";

    public static void main(String[] args) throws SQLException {
        try (Connection db = DriverManager.getConnection("jdbc:h2:mem:perf")) {
            try (Statement st = db.createStatement()) {
                st.execute("""
                        CREATE TABLE orders (
                            id             BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                            customer_email VARCHAR(255) NOT NULL,
                            status         VARCHAR(20)  NOT NULL,
                            subtotal_cents BIGINT       NOT NULL,
                            discount_code  VARCHAR(20),
                            created_at     TIMESTAMP WITH TIME ZONE NOT NULL
                        )""");
            }
            insertOrders(db, 200_000);

            System.out.println("Before index");
            report(db);
            try (Statement st = db.createStatement()) {
                st.execute("CREATE INDEX idx_orders_customer_email ON orders (customer_email)");
            }
            System.out.println("After index");
            report(db);
        }
    }

    private static void insertOrders(Connection db, int count) throws SQLException {
        String sql = "INSERT INTO orders (customer_email, status, subtotal_cents, created_at) "
                + "VALUES (?, 'NEW', 1000, CURRENT_TIMESTAMP)";
        try (PreparedStatement ps = db.prepareStatement(sql)) {
            for (int i = 0; i < count; i++) {
                ps.setString(1, "customer" + (i % 20_000) + "@example.com"); // 10 orders per customer
                ps.addBatch();
                if (i % 5_000 == 4_999) {
                    ps.executeBatch();
                }
            }
            ps.executeBatch();
        }
    }

    private static void report(Connection db) throws SQLException {
        try (PreparedStatement ps = db.prepareStatement("EXPLAIN " + SEARCH)) {
            ps.setString(1, "customer42@example.com");
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                String plan = rs.getString(1);
                plan.lines().forEach(l -> System.out.println("  plan: " + l));
            }
        }
        long[] micros = new long[51];
        int rows = 0;
        try (PreparedStatement ps = db.prepareStatement(SEARCH)) {
            for (int run = 0; run < micros.length; run++) {
                ps.setString(1, "customer" + (run * 37 % 20_000) + "@example.com");
                long start = System.nanoTime();
                rows = 0;
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        rows++;
                    }
                }
                micros[run] = (System.nanoTime() - start) / 1_000;
            }
        }
        Arrays.sort(micros);
        System.out.println("  rows per search: " + rows);
        System.out.println("  median search time: " + micros[micros.length / 2] + " µs (51 runs)");
    }
}
```

Run it with the H2 driver on the class path (path shown for a Maven repository on Linux/macOS):

```bash
java -cp ~/.m2/repository/com/h2database/h2/2.4.240/h2-2.4.240.jar SearchPlan.java
```

**Output (varies):**

```text
Before index
  plan: SELECT
  plan:     "ID"
  plan: FROM "PUBLIC"."ORDERS"
  plan:     /* PUBLIC.PRIMARY_KEY_8 */
  plan: WHERE "CUSTOMER_EMAIL" = ?1
  plan: ORDER BY 1
  plan: /* index sorted */
  rows per search: 10
  median search time: 16299 µs (51 runs)
After index
  plan: SELECT
  plan:     "ID"
  plan: FROM "PUBLIC"."ORDERS"
  plan:     /* PUBLIC.IDX_ORDERS_CUSTOMER_EMAIL: CUSTOMER_EMAIL = ?1 */
  plan: WHERE "CUSTOMER_EMAIL" = ?1
  plan: ORDER BY 1
  rows per search: 10
  median search time: 136 µs (51 runs)
```

Reading it: before the index, H2 walks the primary-key index (every row, in `id` order) and filters by email; after, it looks the email up in the new index. In three runs on the same laptop the medians were 8,892 → 53 µs, 17,902 → 166 µs and 16,299 → 136 µs: the absolute numbers moved a lot, the **plan change and the roughly hundredfold gap** did not. In orderdesk the fix would be a new Flyway migration (`V<next>__index_orders_customer_email.sql`), measured again on PostgreSQL with `EXPLAIN ANALYZE` before claiming the gain in production.

## Syntax and Configuration

| Tool | Use |
|------|-----|
| `/security-review`, `security-reviewer` subagent, `sql-review` skill | Generate security findings to validate |
| Hostile-input tests (MockMvc) | Prove an injection exists or is fixed |
| `EXPLAIN` / `EXPLAIN ANALYZE` | See how the database runs a query |
| Timing loops with medians, profilers, Actuator metrics | Measure, don't guess |

## Real-World Example

Asked "the support search is slow, make it faster", an agent without measurements might add a cache keyed by email — which also caches stale results after new orders and adds invalidation code. The measurement above shows a missing index; one migration line fixes the cause. The same session should also notice that the query was injectable — performance work is a good moment for a security look at the same code path.

## Step-by-Step Walkthrough

1. Read the diff with a source-to-sink view for every input.
2. For each suspected vulnerability, write a hostile-input test; confirm it fails.
3. Fix with the standard mechanism (parameters, validation, encoding); confirm the test passes.
4. For performance: define the slow operation and measure it (median of many runs).
5. Look at the plan or profile; form one hypothesis.
6. Change one thing; measure again with the same method; keep the change only if the numbers move.

## Common Mistakes

- Trusting "looks safe" for string-built SQL with "validated" input.
- Hand-escaping instead of parameters.
- Reporting one timing instead of a distribution; comparing runs on different machines.
- Optimizing without a plan or profile.
- Claiming production gains from an H2 or laptop measurement.

## Security Considerations

- Never test injection against shared or production databases; use local data.
- Don't put exploit strings with real customer data into issues.
- A security review that finds nothing isn't proof of safety; keep tests and parameterization as the defence.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Injection test passes on vulnerable code | Test data doesn't contain other rows | Insert rows the injection would expose |
| Timings jump between runs | JIT warm-up, other processes | More runs; medians; warm-up iterations |
| Index not used | Different column, function on the column, small table | Check the plan; test with realistic volume |

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| Index on `customer_email` | Fast lookups | Slower writes, more storage |
| Cache | Fast repeated reads | Staleness, invalidation complexity |
| AI security review | Broad, quick first pass | False positives; misses; needs validation |

## Interview Takeaways

- Trace input from source to sink; parameters, not concatenation.
- Prove vulnerabilities and fixes with hostile-input tests.
- Measure → hypothesis → one change → measure again.

## Key Takeaways

- The starter's search returned every order for `x' OR '1'='1`; a `?` parameter fixed it, a test proves it.
- Query plans explain timings; one index cut the median search time by about two orders of magnitude in this setup.
- Validate AI findings and AI optimizations with evidence.
