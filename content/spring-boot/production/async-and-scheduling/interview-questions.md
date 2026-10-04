# @Async and @Scheduled — Interview Questions

## Beginner

### Q1. How do you run a method asynchronously in Spring Boot?

<details>
<summary>Answer</summary>

Add `@EnableAsync` to a configuration class and annotate a public bean method with `@Async`. Calls through the Spring proxy are submitted to a `TaskExecutor` and the caller continues immediately. Return `void` or `CompletableFuture<T>`.

</details>

### Q2. What is the difference between `fixedRate` and `fixedDelay`?

<details>
<summary>Answer</summary>

`fixedRate` schedules runs at a constant interval measured from the start of each run. `fixedDelay` waits the given time after the previous run finishes before starting the next. For a 10-second job with a 30-second setting: rate → starts every 30 s; delay → starts every 40 s.

</details>

### Q3. How do you write a cron expression for 9:30 AM on weekdays?

<details>
<summary>Answer</summary>

`@Scheduled(cron = "0 30 9 * * MON-FRI", zone = "Asia/Kolkata")` — Spring cron fields are second, minute, hour, day of month, month, day of week.

</details>

## Intermediate

### Q4. Why does an `@Async` method sometimes run synchronously?

<details>
<summary>Answer</summary>

It was called on the same object (`this.method()`), bypassing the proxy; `@EnableAsync` is missing; the method is private or the object is not a Spring bean; or the executor rejected/ran the task in the caller (e.g. `CallerRunsPolicy` when saturated).

</details>

### Q5. How are exceptions in `@Async` methods handled?

<details>
<summary>Answer</summary>

For `CompletableFuture`/`Future` return types, the exception completes the future exceptionally and surfaces when the caller joins or composes it. For `void` methods, the caller never sees it; it goes to the `AsyncUncaughtExceptionHandler` (logging by default), which you can customise by implementing `AsyncConfigurer`.

</details>

### Q6. Why does a scheduled job run several times in a multi-instance deployment?

<details>
<summary>Answer</summary>

Each application instance has its own scheduler and runs every `@Scheduled` method. To run a job once per schedule cluster-wide, use a distributed lock (ShedLock), leader election, or move the job to an external scheduler (Kubernetes CronJob) or a single worker service.

</details>

## Advanced

### Q7. What context is lost when work moves to an `@Async` thread, and how do you handle it?

<details>
<summary>Answer</summary>

Thread-local context: the transaction (and persistence context), `SecurityContext`, MDC/trace ids, request attributes and locale. Pass needed data explicitly (ids, not entities), start a new transaction in the async method, and configure decorators — `DelegatingSecurityContextAsyncTaskExecutor`, a `TaskDecorator` copying MDC, and Micrometer context propagation for tracing.

</details>

### Q8. When would you choose a message broker over `@Async`?

<details>
<summary>Answer</summary>

When the work must not be lost (crash or redeploy loses in-memory executor queues), needs retries with backoff and dead-letter handling, must be distributed across instances or services, or must be decoupled in time from the request. Combine with the transactional outbox so messages are published only for committed data.

</details>
