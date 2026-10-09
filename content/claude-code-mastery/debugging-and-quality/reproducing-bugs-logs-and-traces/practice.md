# Reproducible Bugs, Stack Traces and Logs — Practice

### P1. Where to look first

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** stack traces

In a Spring Boot stack trace with 60 frames, which frame do you open first?

- A) The last frame (`Thread.run`)
- B) The first frame in your own package (`com.example.orderdesk…`)
- C) The first Spring frame
- D) Any frame mentioning `DispatcherServlet`

<details>
<summary>Answer</summary>

**Answer:** B) The first frame in your own package (`com.example.orderdesk…`)

It shows where your code failed; frames below show the callers. Also read the last `Caused by:` if there is one.

</details>

### P2. Read the message

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** helpful NPE messages

What does this tell you? `Cannot invoke "String.trim()" because "discountCode" is null`

<details>
<summary>Answer</summary>

The variable `discountCode` was null when `trim()` was called on it. The JDK's helpful NullPointerException message names the null reference and the operation, so you don't have to guess which value on the line was null.

</details>

### P3. Map the status

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** Spring error mapping

A client reports 400 for `GET /api/orders/abc` and 404 for `POST /api/orders/1/pay` on the starter project. Explain both.

<details>
<summary>Answer</summary>

`abc` can't be converted to the `long id` parameter → `MethodArgumentTypeMismatchException` → 400. `/pay` doesn't exist in the starter, so no handler matches; Spring falls through to static resources → `NoResourceFoundException` ("No static resource api/orders/1/pay") → 404. The second is a missing endpoint, not a missing order.

</details>

### P4. Make it reproducible

**Difficulty:** Medium · **Type:** Prompt design · **Concepts:** bug reports

Rewrite this for Claude: "Search returns wrong stuff sometimes."

<details>
<summary>Answer</summary>

```text
GET /api/orders/search?email=x' OR '1'='1 returns [1,2] on a database with two orders for
other customers; it should return []. Reproduce this with a MockMvc test in
OrderControllerTest first and show the failure. Then find the cause in OrderSearchDao.
```

Exact input, expected vs actual, where to reproduce, and the order of work.

</details>

### P5. Fix in the wrong place

**Difficulty:** Medium · **Type:** Code review · **Concepts:** root cause

A proposed BUG-101 fix wraps `toResponse` in `try { … } catch (NullPointerException e) { return null; }`. Review it.

<details>
<summary>Answer</summary>

It hides the symptom: the endpoint now returns an empty body (or fails elsewhere) instead of the correct total, and other NPEs are swallowed too. The cause is that `PriceCalculator` doesn't handle a legitimately missing code. Fix the calculator (null/blank → subtotal) and keep the regression tests.

</details>

### P6. Two symptoms

**Difficulty:** Hard · **Type:** Failure diagnosis · **Concepts:** transactions

BUG-101 also says failed creates are stored. The stack trace shows the NPE in `toResponse` after `orders.save(...)`. Why is the row kept, and how do you prove it?

<details>
<summary>Answer</summary>

`create()` isn't transactional on the starter: `save` commits in its own transaction, then building the response throws, so the request fails after the row is committed. Prove it with a test (or manual run): POST without a code, then count rows — 1 on the starter, 0 once `create()` is `@Transactional` (the exception then rolls the save back).

</details>

### P7. Large log

**Difficulty:** Hard · **Type:** Workflow design · **Concepts:** context management

You have a 40 MB application log from a failing staging run. How do you involve Claude without flooding the context or leaking data?

<details>
<summary>Answer</summary>

Redact personal data and secrets first. Narrow the time window and request path with `grep` (or let a subagent search the file and return only the matching entries). Point Claude at the file rather than pasting it; ask for the first `ERROR` for the failing request and its trace. Piped stdin for `claude -p` is capped at 10 MB anyway.

</details>
