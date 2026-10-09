# Lab 15: Investigate a Production-Style Spring Boot Failure

**Lab:** 15 · **Module:** Debugging, Testing and Code Quality · **Difficulty:** Advanced · **Verification:** Partially tested — the failing build, its error and the fix-forward migration were run on orderdesk (Spring Boot 4.1.1, H2 2.4, Flyway); the Claude conversation needs your model session and was not run.

## Objective

A release fails at startup. Collect evidence, find the cause (an entity field without a migration), and **fix forward** with a new migration — without editing an applied one or turning off schema validation.

## Prerequisites

- Labs 05 and 09 (the migration guard hook helps here).
- The lesson *Java and Spring Boot Debugging Scenarios* (scenario 6).

## Scenario

To support payment auditing, someone added a `paidAt` field to `Order` and merged it. The next deployment never becomes healthy; the log shows an error during startup. You're on call.

## Starting State

Simulate the bad merge on a branch of the fixed project (after Lab 06):

```bash
git switch main
git switch -c lab15-incident
```

In `Order.java`, below `createdAt`, add:

```java
private Instant paidAt;
```

Commit it as "the release":

```bash
git commit -am "Add paidAt to Order"
```

## Instructions

### Step 1: Reproduce the failure

```bash
./mvnw -B verify
```

**Output** (key lines):

```text
Failed to initialize JPA EntityManagerFactory: Unable to build Hibernate SessionFactory  [persistence unit: default] ; nested exception is org.hibernate.tool.schema.spi.SchemaManagementException: Schema validation: missing column [paid_at] in table [orders]
```

```text
[ERROR] Tests run: 13, Failures: 0, Errors: 7, Skipped: 0
[INFO] BUILD FAILURE
```

Every Spring test errors because the application context can't start; the plain unit tests (`PriceCalculatorTest`) still pass. That pattern — all context-based tests failing at once — points at configuration or startup, not at business logic.

### Step 2: Investigate with evidence

```bash
claude
```

```text
The application fails at startup with this error (pasted below). Find the cause by comparing the
Order entity with the Flyway migrations. Cite file:line. Propose the smallest safe fix and
explain why other fixes (editing V1, changing ddl-auto) are wrong. Don't edit anything yet.

<paste the "Schema validation: missing column [paid_at] in table [orders]" line>
```

**Expected result:** `Order.java` has `paidAt` (mapped to `paid_at` by Spring's naming strategy); `V1__create_orders.sql` has no such column; `spring.jpa.hibernate.ddl-auto: validate` stops startup when entity and schema disagree. The fix: a new migration.

Push back on wrong fixes if they appear:

| Proposed fix | Why not |
|--------------|---------|
| Edit `V1__create_orders.sql` | V1 already ran in every environment; Flyway won't re-run it and its checksum will fail validation. The protect-files hook (Lab 09) blocks the edit |
| Set `ddl-auto: update` | Hides schema drift; Hibernate alters production tables without review |
| Mark the field `@Transient` | Silently drops the feature |
| Remove the field and redeploy | A valid rollback for the code — but check whether anything already writes it |

### Step 3: Fix forward

```text
Add the smallest new Flyway migration for paid_at. Run ./mvnw -B verify and show the Flyway lines
and the test summary.
```

`src/main/resources/db/migration/V2__add_paid_at.sql`:

```sql
ALTER TABLE orders ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;
```

**Output** (Flyway lines, timestamps and logger prefixes removed):

```text
Successfully validated 2 migrations (execution time 00:00.053s)
Current version of schema "PUBLIC": << Empty Schema >>
Migrating schema "PUBLIC" to version "1 - create orders"
Migrating schema "PUBLIC" to version "2 - add paid at"
Successfully applied 2 migrations to schema "PUBLIC", now at version v2 (execution time 00:00.020s)
```

```text
[INFO] Tests run: 13, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

The column is nullable: existing rows get `NULL`, which is correct for orders paid before the field existed. A `NOT NULL` column on a table with data would need a default or a backfill step.

### Step 4: Write the incident note

```text
Write a short incident note: impact, timeline (as placeholders), root cause, fix, and two
prevention actions. No customer data.
```

**Expected result:** prevention actions such as "CI runs the full test suite with `ddl-auto: validate` before merge" and "the PR template asks whether entity changes need a migration".

## Verification

- ☐ You reproduced the failure from the exact error message.
- ☐ The fix is a new `V2` migration; `V1` is unchanged (`git diff main -- src/main/resources/db/migration/V1__create_orders.sql` prints nothing).
- ☐ Flyway reports version 2; all 13 tests pass.
- ☐ `ddl-auto` is still `validate`.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Validate failed: Migrations have failed validation` | V1 was edited (checksum mismatch) | Restore V1 from Git; add V2 instead |
| Still `missing column` | Migration file name or location wrong | `V2__add_paid_at.sql` in `db/migration`; two underscores |
| Tests pass locally but staging fails | Staging database already has a different V2 | Use the next free version number for that environment |

## Security Notes

- In a real incident, paste only the error lines into prompts — not full production logs with customer data or credentials.
- Never run `flyway clean` or drop tables to "fix" a schema mismatch; the Lab 09 guard denies both.

## Cleanup

```bash
git switch main
git branch -D lab15-incident
```

## Completion Checklist

- ☐ Evidence first: exact error, entity vs migration comparison.
- ☐ Wrong fixes rejected with reasons.
- ☐ Fixed forward; verified; incident note written.

## Follow-up Challenges

- Make `paid_at` set when an order is paid (FEAT-7) and add a test for it.
- Write a CI check that fails when an `@Entity` class changes without a new migration file in the same PR.
