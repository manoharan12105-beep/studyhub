# Java and Spring Boot Debugging Scenarios — Interview Questions

## Beginner

### Q1. A Spring endpoint returns 500. What do you do first?

**Style:** How

<details>
<summary>Answer</summary>

Find the server-side exception for that request in the log, read the exception type, message and first project frame, and reproduce it with the same input — ideally as a failing test — before changing code.

</details>

## Intermediate

### Q2. Why might data be saved even though the request failed?

**Style:** Why

<details>
<summary>Answer</summary>

The work isn't in one transaction: a repository `save` commits on its own, then a later step throws. Make the whole operation transactional (on a public method called through the Spring proxy) so an unchecked exception rolls everything back.

</details>

### Q3. The app won't start after an entity change. How do you diagnose it?

**Style:** Scenario

<details>
<summary>Answer</summary>

Read the first startup exception and its root cause. With `ddl-auto: validate`, a message like `missing column [paid_at]` means the entity and schema differ. Add a new versioned migration (never edit an applied one), restart, and confirm Flyway applies it and tests pass.

</details>

## Advanced

### Q4. How do you reproduce and fix a lost-update bug?

**Style:** Debugging

<details>
<summary>Answer</summary>

Reproduce with many threads and iterations, assert on totals, and confirm the count is short. Fix with an atomic operation — `ConcurrentHashMap.merge`, `AtomicLong`/`LongAdder`, synchronization, or an atomic database update/optimistic locking for persisted state — then rerun the stress test repeatedly.

</details>

### Q5. How would you use Claude Code across these scenarios without letting it guess?

**Style:** Design

<details>
<summary>Answer</summary>

Provide the evidence (trace, failing test, request/response, bisect result), ask for a hypothesis with cited `file:line` before any fix, require a reproducing test first, forbid test weakening and edits to applied migrations (hooks/permissions), and accept completion only with build output and a reviewed diff.

</details>
