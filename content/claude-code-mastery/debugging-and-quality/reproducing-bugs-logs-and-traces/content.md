# Reproducible Bugs, Stack Traces and Logs

**Module:** Debugging, Testing and Code Quality · **Interview priority:** Core

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 and *Best practices* (October 2026). The stack trace, HTTP responses and test failures below come from real runs of the orderdesk starter project (Spring Boot 4.1.1, JDK 21). Prompts are shown as text; Claude's replies are not quoted.

## Definition

A **reproducible bug** is one you can trigger on demand with exact steps, inputs and a visible failure — ideally a single failing test. **Stack traces** and **logs** are the evidence that connects the failure to code. Debugging with Claude Code works best when you hand it that evidence and require it to reproduce the failure before anyone changes code.

## Why It Matters

- "It sometimes breaks" gives an agent nothing to verify against; it will guess, and guesses look like fixes.
- A failing test is a **verification loop**: Claude can run it, read the result and iterate — and you can check the same result.
- Stack traces are precise: the exception type, the message and the first frame in your own package usually point at the defect in seconds.

## How It Works

```text
report ("GET /api/orders/1 returns 500")
   │
   ▼
reproduce: exact request or a failing test  ──► evidence: status, message, stack trace
   │
   ▼
read the trace: exception + message ──► first frame in com.example.orderdesk ──► open that line
   │
   ▼
hypothesis + evidence ──► fix ──► the same test now passes ──► full build
```

## Giving Claude a Reproducible Bug

| Weak report | Reproducible report |
|-------------|---------------------|
| "Orders are broken." | "`POST /api/orders` with `{"customerEmail":"ravi@example.com","subtotalCents":2500}` returns 500. With `"discountCode":"SAVE10"` it returns 201." |
| "Tests fail." | "`PriceCalculatorTest.orderWithoutDiscountCodeCostsTheSubtotal` fails with a `NullPointerException` at `PriceCalculator.java:14`." |
| "Search is weird." | "`GET /api/orders/search?email=x' OR '1'='1` returns `[1,2]`; it should return `[]`." |

A prompt that keeps the work evidence-first:

```text
BUG-101: GET /api/orders/{id} returns 500 for orders created without a discount code
(docs/issues/BUG-101.md). First reproduce it with the smallest failing test and show me the
failure. Don't change production code until the test fails for the reason in the report.
```

## Reading Java Stack Traces

The real server log for `POST /api/orders` without a discount code (framework frames cut after the first two):

**Output:**

```text
java.lang.NullPointerException: Cannot invoke "String.trim()" because "discountCode" is null
	at com.example.orderdesk.order.PriceCalculator.totalCents(PriceCalculator.java:14) ~[classes/:na]
	at com.example.orderdesk.order.OrderController.toResponse(OrderController.java:50) ~[classes/:na]
	at com.example.orderdesk.order.OrderController.create(OrderController.java:34) ~[classes/:na]
	at java.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:103) ~[na:na]
	at java.base/java.lang.reflect.Method.invoke(Method.java:580) ~[na:na]
```

| Read | What it says here |
|------|-------------------|
| Exception type | `NullPointerException` — something was null |
| Helpful message (JDK 14+) | **Which** reference was null: `discountCode`, when calling `trim()` |
| First project frame | `PriceCalculator.totalCents`, line 14 — where it happened |
| Frames below | Who called it: `toResponse` ← `create` (and, in the GET trace, ← `get` at line 41) |
| `Caused by:` sections (when present) | Read the **last** one: it's the root cause |

The trace tells you where the null was **used**, not why it was null. Here the request simply had no discount code — which the API allows (`@Size(max=20)`, not `@NotBlank`) — so the calculator must handle it.

## Logs and Trace-Based Debugging

The same failure seen by an HTTP client (timestamp shortened):

**Output:**

```text
{"timestamp":"…","status":500,"error":"Internal Server Error","path":"/api/orders"}
```

The client sees only "500"; the cause is in the server log. Useful habits:

- Correlate by time and path: find the log entry for the failing request before reading code.
- Read the **first** `ERROR` line for a request, not the last; later errors are often consequences.
- Log identifiers (order id, request path), not personal data (customer email) or secrets.
- When there's no trace, add a temporary log or a test with assertions at each step — then remove the log.

Client-visible symptoms map to Spring exceptions; these came from requests against the starter project:

| Request | Status | Exception |
|---------|--------|-----------|
| `GET /api/orders/search` (no `email`) | 400 | `MissingServletRequestParameterException` |
| `GET /api/orders/abc` | 400 | `MethodArgumentTypeMismatchException` |
| `POST /api/orders` as `text/plain` | 415 | `HttpMediaTypeNotSupportedException` |
| `POST /api/orders/1/pay` (endpoint not built yet) | 404 | `NoResourceFoundException: No static resource api/orders/1/pay …` |

## Reproducing Before Fixing

A regression test that reproduces BUG-101 at the HTTP level (from the reference solution):

```java
// Regression test for BUG-101: an order without a discount code returned 500.
@Test
void readsAnOrderWithoutDiscountCode() throws Exception {
    Order order = orders.save(new Order("ravi@example.com", 2_500, null));

    mvc.perform(get("/api/orders/" + order.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalCents").value(2500));
}
```

On the starter code it fails with a `ServletException` caused by the same `NullPointerException` — the failure the report describes. That is the green light to change production code.

## Syntax and Configuration

```bash
./mvnw -q test -Dtest=PriceCalculatorTest                         # one class
./mvnw -q test -Dtest=OrderControllerTest#readsAnOrderWithoutDiscountCode   # one method
./mvnw spring-boot:run                                            # run the app locally
curl -s -X POST localhost:8080/api/orders -H 'Content-Type: application/json' \
  -d '{"customerEmail":"ravi@example.com","subtotalCents":2500}'
```

Large logs: save to a file and point Claude at it (`@app.log` or "read the last 200 lines of target/app.log") rather than pasting thousands of lines into the conversation — or delegate the reading to a subagent that returns the relevant lines.

## Real-World Example

BUG-101's report also says "the failed create still seems to store the order". The stack trace explains the 500 but not the stored row. Reproducing that second symptom (create fails, then count rows) showed 1 row on the starter and 0 once `create()` became `@Transactional`. A fix guided only by the trace would have fixed the 500 and left the data problem.

## Step-by-Step Walkthrough

1. Write down exact input, expected and actual result.
2. Reproduce manually once (request, command).
3. Capture the trace or log entry for that request.
4. Read: exception, message, first project frame, root `Caused by`.
5. Encode the reproduction as the smallest failing test.
6. Ask Claude for a hypothesis with evidence; only then a fix.
7. Confirm the test passes and the full build is green.

## Common Mistakes

- Pasting the last 20 lines of a trace (framework frames) and cutting off the first.
- Fixing where the exception was thrown instead of where the bad value came from — or the reverse, when the input is legitimate.
- Catching the exception to "fix" a 500.
- Debugging without a failing test, then claiming it's fixed.
- Pasting logs with customer emails, tokens or passwords into prompts.

## Security Considerations

- Redact personal data and secrets from logs before sharing them, in prompts or issues.
- Error responses shouldn't expose stack traces to clients (the starter returns a generic 500 body — keep it that way).
- Reproduce with synthetic data, never production data copied to your laptop.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Can't reproduce | Missing input, state or configuration | Compare the environment; capture the exact request |
| Trace points into framework code only | Your code isn't on the path, or the trace is cut | Find the first `com.example` frame; read `Caused by:` |
| Test passes but the bug remains | The test doesn't exercise the reported path | Reproduce the exact request in a MockMvc test |
| Intermittent failure | Ordering, timing or shared state | Run repeatedly; isolate state; see the concurrency scenario |

## Trade-offs

| Approach | Benefit | Cost |
|----------|---------|------|
| Unit test reproduction | Fast, precise | May miss wiring problems |
| MockMvc/HTTP reproduction | Matches the report | Slower; Spring context |
| Manual reproduction | Quick first check | Not repeatable; not a regression test |

## Interview Takeaways

- Reproduce first: a failing test is the agent's verification loop.
- Read traces: exception, message, first project frame, root cause.
- Logs: correlate by request; protect personal data.

## Key Takeaways

- Exact steps and a failing test beat descriptions.
- The helpful NPE message names the null reference.
- The trace shows where; the report and data show why.
- No fix before the failure is reproduced.
