# Java and Spring Boot Debugging Scenarios

**Module:** Debugging, Testing and Code Quality · **Interview priority:** Frequently asked

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 (October 2026). Every symptom and fix below was reproduced on the orderdesk project (Spring Boot 4.1.1, JDK 21, H2) or, for the concurrency scenario, with a standalone JDK 21 program. Prompts are shown as text; Claude's replies are not quoted.

## Definition

A **debugging scenario** pairs a realistic failure with the evidence that diagnoses it and the change that fixes it. This lesson works through seven, each in the same order: **symptom → evidence → prompt → root cause → fix → verification**. The pattern matters more than the individual bugs: in every case, the evidence comes before the fix.

## Why It Matters

- Interviewers ask "how would you debug…" and expect a method, not a guess.
- Each scenario shows where an AI agent helps (reading traces, searching code, writing the reproducing test) and where you must insist on evidence.
- These seven failure types cover most of what breaks in a Spring Boot service.

## How It Works

```text
symptom ──► evidence (trace, test, plan, log, count) ──► one hypothesis ──► fix the cause
                                                                              │
                                              reproducing test red → green ◄──┘ + full build
```

## Scenario 1: NullPointerException

| Step | orderdesk |
|------|-----------|
| Symptom | `GET /api/orders/1` returns 500 for orders without a discount code |
| Evidence | `java.lang.NullPointerException: Cannot invoke "String.trim()" because "discountCode" is null` at `PriceCalculator.totalCents(PriceCalculator.java:14)` |
| Prompt | "Reproduce BUG-101 with the smallest failing test, then fix the cause. Don't catch the exception." |
| Root cause | A missing code is valid input, but the calculator assumed a value |
| Fix | `if (discountCode == null \|\| discountCode.isBlank()) return subtotalCents;` |
| Verification | `orderWithoutDiscountCodeCostsTheSubtotal` red → green; full build 13 tests passing |

## Scenario 2: Transaction Problems

| Step | orderdesk |
|------|-----------|
| Symptom | `POST /api/orders` without a code returns 500 — yet the order appears in search afterwards |
| Evidence | Counting rows after the failed request: **1** on the starter |
| Prompt | "Why does a failed create leave a stored order? Show the call order inside `create()` and where the transaction boundary is." |
| Root cause | `create()` wasn't transactional: `orders.save(...)` committed in its own transaction, then building the response threw |
| Fix | `@Transactional` on `create()` (and the NPE fix) |
| Verification | With `@Transactional` the same failed request leaves **0** rows — the exception rolls the save back |

> [!NOTE]
> `@Transactional` rolls back on unchecked exceptions by default. It also only works when the call goes through the Spring proxy — calling a `@Transactional` method from another method of the same class bypasses it.

## Scenario 3: Broken Endpoint

| Step | orderdesk |
|------|-----------|
| Symptom | A client calls `POST /api/orders/1/pay` and gets 404 — the order exists |
| Evidence | `NoResourceFoundException: No static resource api/orders/1/pay for request '/api/orders/1/pay'.` |
| Prompt | "Which handler should serve POST /api/orders/{id}/pay? List the mappings in OrderController." |
| Root cause | The endpoint isn't in this build (FEAT-7 not merged). No handler matched, so Spring tried static resources — the 404 is about the **path**, not the order |
| Fix | Deploy the build containing FEAT-7, or correct the client's URL |
| Verification | `payingAnUnknownOrderIs404` and the pay tests pass on the FEAT-7 build |

Related status codes seen on the same app: missing `email` parameter → 400 (`MissingServletRequestParameterException`); `/api/orders/abc` → 400 (`MethodArgumentTypeMismatchException`); `text/plain` body → 415.

## Scenario 4: Incorrect SQL

| Step | orderdesk |
|------|-----------|
| Symptom | Support search for `x' OR '1'='1` returns every order |
| Evidence | Starter app: `[1,2]` instead of `[]`; regression test: `JSON path "$.length()" expected:<0> but was:<2>` |
| Prompt | "Show the exact SQL OrderSearchDao builds for this input, then fix it so input is always a value." |
| Root cause | String concatenation put user input into the SQL text |
| Fix | `"SELECT id FROM orders WHERE customer_email = ? ORDER BY id"` with the email as a parameter |
| Verification | `searchTreatsInputAsAValueNotAsSql` red → green |

## Scenario 5: Failing Test

| Step | orderdesk |
|------|-----------|
| Symptom | `discountIsRoundedDownToWholeCents` fails on `main` |
| Evidence | `expected: <900> but was: <899>`; `git bisect run` names "Refactor: compute discount with Math.round" |
| Prompt | "Don't change the test. Find the commit that introduced this failure and explain it from that diff." |
| Root cause | `Math.round(subtotalCents * percent / 100.0)` rounds 99.9 up to 100; the rule is to round down |
| Fix | Restore `subtotalCents * percent / 100` (integer division) |
| Verification | The test passes; full build green |

## Scenario 6: Configuration Error

| Step | orderdesk |
|------|-----------|
| Symptom | After adding `private Instant paidAt;` to `Order`, the application and every Spring test fail at startup |
| Evidence | `Schema validation: missing column [paid_at] in table [orders]` (`SchemaManagementException` while creating `entityManagerFactory`) |
| Prompt | "The app fails at startup with this schema validation error. Compare the entity with the Flyway migrations and propose the smallest safe fix." |
| Root cause | `spring.jpa.hibernate.ddl-auto: validate` checks the entity against the schema; the column was never migrated |
| Fix | A new migration `V2__add_paid_at.sql`: `ALTER TABLE orders ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;` — never edit `V1` |
| Verification | Startup log shows Flyway `Migrating schema … to version "2 - add paid at"`; all 13 tests pass |

## Scenario 7: Concurrency Defect

Symptom: a usage counter for discount codes reports fewer uses than orders. A standalone reproduction (JDK 21):

```java
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/** Counts discount-code uses from many request threads: once with a HashMap, once with a ConcurrentHashMap. */
public class DiscountUsage {

    private static final int THREADS = 8;
    private static final int USES_PER_THREAD = 25_000;

    public static void main(String[] args) throws InterruptedException {
        System.out.println("expected SAVE10 uses: " + THREADS * USES_PER_THREAD);
        System.out.println("HashMap:           " + count(new HashMap<>()));
        System.out.println("ConcurrentHashMap: " + count(new ConcurrentHashMap<>()));
    }

    private static int count(Map<String, Integer> uses) throws InterruptedException {
        try (ExecutorService pool = Executors.newFixedThreadPool(THREADS)) {
            for (int t = 0; t < THREADS; t++) {
                pool.submit(() -> {
                    for (int i = 0; i < USES_PER_THREAD; i++) {
                        // HashMap.merge is a read-modify-write with no locking: concurrent calls lose updates.
                        // ConcurrentHashMap.merge performs the same update atomically.
                        uses.merge("SAVE10", 1, Integer::sum);
                    }
                });
            }
            pool.shutdown();
            pool.awaitTermination(1, TimeUnit.MINUTES);
        }
        return uses.getOrDefault("SAVE10", 0);
    }
}
```

**Output (varies):**

```text
expected SAVE10 uses: 200000
HashMap:           61505
ConcurrentHashMap: 200000
```

Three runs gave 61,505, 61,571 and 72,822 for `HashMap`; `ConcurrentHashMap` gave 200,000 every time. The lost updates are the evidence: several threads read the same old count and each write back old + 1. The fix is a thread-safe structure (`ConcurrentHashMap.merge`, `LongAdder`) — or, for orders, a database update (`UPDATE … SET uses = uses + 1`) instead of shared in-memory state.

> [!TIP]
> Concurrency bugs often don't reproduce in a single test run. Reproduce them with many threads and many iterations, and assert on totals. A green run is weak evidence; a red one is strong.

## Syntax and Configuration

```bash
./mvnw -q test -Dtest=OrderControllerTest#searchTreatsInputAsAValueNotAsSql
git bisect run ./mvnw -o -B -q test -Dtest=PriceCalculatorTest
javac -d out DiscountUsage.java && java -cp out DiscountUsage
```

## Real-World Example

The capstone combines scenarios 1, 2 and 4 in one repository: BUG-101 (NPE plus the transaction symptom) and the SQL injection. Learners who fix only the visible 500 miss the stored-row problem; learners who reproduce every symptom in the issue find both.

## Step-by-Step Walkthrough

1. Restate the symptom exactly.
2. Collect the evidence the scenario calls for (trace, count, plan, log, bisect).
3. Prompt for a hypothesis **with** evidence, not a fix.
4. Encode the reproduction as a failing test.
5. Fix the cause; run the test and the full build.
6. Look for the neighbours (blank codes, other endpoints using the same pattern).

## Common Mistakes

- Catching exceptions to remove a 500.
- Editing an applied migration to fix a schema mismatch.
- Treating a 404 as "order not found" without reading the exception.
- Calling a concurrency bug fixed after one green run.
- Changing the test in a failing-test scenario.

## Security Considerations

- Scenario 4 is a security incident in production: assess exposure (what could be read) as well as fixing the code.
- Don't reproduce production failures with production data on a laptop.
- Configuration fixes must not weaken validation (`ddl-auto: validate` is a safety net, not the problem).

## Troubleshooting

| Symptom | Likely scenario | First evidence to collect |
|---------|-----------------|---------------------------|
| 500 with NPE in the log | 1 | Helpful NPE message, first project frame |
| Data present after a failed request | 2 | Row counts; transaction boundaries |
| 404/405/415 on a known resource | 3 | The resolved exception; handler mappings |
| Wrong rows returned | 4 | The exact SQL executed |
| Test red after a merge | 5 | Assertion message; `git bisect` |
| App won't start | 6 | First startup exception; `Caused by:` |
| Totals too low under load | 7 | Repeated multithreaded reproduction |

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| Fix forward with a migration | Safe, auditable | One more migration |
| Thread-safe map vs database counter | Simple in-process | Lost on restart; not shared across instances |
| `@Transactional` on controller methods | Simple here | Larger services move it to a service layer |

## Interview Takeaways

- Same method for every bug: symptom → evidence → hypothesis → test → fix → verify.
- Know the Spring specifics: transaction proxies and rollback rules, handler mapping errors, `ddl-auto: validate`, Flyway versioning.
- Concurrency needs stress reproduction and thread-safe primitives.

## Key Takeaways

- Evidence first in all seven scenarios.
- Some fixes are one line; finding the right line is the work.
- Keep every reproduction as a regression test.
