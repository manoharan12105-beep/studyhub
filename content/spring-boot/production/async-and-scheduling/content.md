# @Async and @Scheduled

**Module:** Production Spring Boot · **Interview priority:** Frequently asked

## Definition

- **Async processing** runs work on another thread so the caller does not wait. In Spring, **`@Async`** on a bean method (enabled with **`@EnableAsync`**) makes calls through the proxy execute on a `TaskExecutor`, returning immediately (`void`) or with a `CompletableFuture`.
- **Scheduling** runs work at fixed intervals or times. **`@Scheduled`** (enabled with **`@EnableScheduling`**) runs a bean method by `fixedRate`, `fixedDelay` or `cron`.

## Why It Matters

- Sending emails, generating reports, calling slow third parties and fan-out work should not block HTTP threads.
- Nightly clean-ups, reminders and polling are scheduled jobs.
- Both features are proxy/thread based, so they share pitfalls with `@Transactional` (self-invocation, lost thread-local context) and add new ones (exception handling, multiple instances).

## Async Processing

```text
HTTP thread ──► orderService.place() ──► notificationService.sendEmail(order)   (@Async, via proxy)
     │                                         │ submitted to TaskExecutor queue
     ▼                                         ▼
returns 201 immediately                  "task-1" thread sends the email later
```

## @Async

```java
import java.util.concurrent.CompletableFuture;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
class NotificationService {

    @Async                                                   // fire-and-forget
    public void sendOrderConfirmation(long orderId) {
        // call the email provider; exceptions go to the AsyncUncaughtExceptionHandler
    }

    @Async
    public CompletableFuture<String> buildReport(long customerId) {
        return CompletableFuture.completedFuture("report-" + customerId);   // caller can join/compose
    }
}
```

Rules:

- Return `void` or `CompletableFuture<T>` (or `Future<T>`); other return types are not supported for async execution.
- Exceptions from `void` methods do not reach the caller; configure an `AsyncUncaughtExceptionHandler` (via `AsyncConfigurer`) to log them. For futures, the exception completes the future exceptionally.
- **Executor:** Spring Boot auto-configures `applicationTaskExecutor` (`ThreadPoolTaskExecutor`; `spring.task.execution.pool.*`), or a virtual-thread executor when `spring.threads.virtual.enabled=true`. Name and size your executors deliberately; an unbounded queue hides overload.
- **Context is not propagated:** no transaction, no `SecurityContext`, no MDC, no request scope on the async thread — pass ids/values explicitly or use decorators (`TaskDecorator`, `DelegatingSecurityContextAsyncTaskExecutor`).
- Work is lost if the process dies: for important tasks use a durable queue (outbox + message broker) instead of in-memory executors.

## How It Works

```java
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

public class AsyncDemo {

    static class ReportService {
        @Async
        public CompletableFuture<String> generate(String name) {
            return CompletableFuture.completedFuture(Thread.currentThread().getName());   // which thread ran it?
        }

        public String generateViaThis(String name) {
            return generate(name).join();               // self-invocation: no proxy, runs synchronously
        }
    }

    @Configuration
    @EnableAsync                                        // Spring Boot: add this yourself; Boot provides the executor
    static class Config {
        @Bean
        Executor taskExecutor() {
            ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
            executor.setCorePoolSize(2);
            executor.setMaxPoolSize(4);
            executor.setQueueCapacity(100);
            executor.setThreadNamePrefix("report-");
            executor.initialize();
            return executor;
        }

        @Bean
        ReportService reportService() {
            return new ReportService();
        }
    }

    public static void main(String[] args) {
        try (var context = new AnnotationConfigApplicationContext(Config.class)) {
            ReportService reports = context.getBean(ReportService.class);
            String caller = Thread.currentThread().getName();
            String viaProxy = reports.generate("sales").join();
            String viaThis = reports.generateViaThis("stock");
            System.out.println("through proxy: ran on " + viaProxy + ", caller's thread? " + viaProxy.equals(caller));
            System.out.println("via this:      ran on caller's thread? " + viaThis.equals(caller));
        }
    }
}
```

**Output:**

```text
through proxy: ran on report-1, caller's thread? false
via this:      ran on caller's thread? true
```

The same method ran asynchronously through the proxy and synchronously when called via `this`.

## Scheduling

```java
import java.util.concurrent.TimeUnit;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
class MaintenanceJobs {

    @Scheduled(fixedRate = 5, timeUnit = TimeUnit.MINUTES)      // every 5 min from the previous START
    void refreshExchangeRates() {
    }

    @Scheduled(fixedDelay = 30_000, initialDelay = 10_000)     // 30 s after the previous run FINISHES
    void retryFailedWebhooks() {
    }

    @Scheduled(cron = "0 0 2 * * *", zone = "Asia/Kolkata")    // 02:00 every day (sec min hour day month weekday)
    void purgeExpiredCarts() {
    }
}
```

## @Scheduled

| Attribute | Meaning |
|-----------|---------|
| `fixedRate` | Period between starts; if a run takes longer than the period, the next starts right after (no overlap on a single thread) |
| `fixedDelay` | Delay between the end of one run and the start of the next |
| `initialDelay` | Delay before the first run |
| `cron` | Six fields in Spring: second, minute, hour, day of month, month, day of week (e.g. `0 */15 * * * MON-FRI`) |
| `zone` | Time zone for cron (default: server zone) |
| `*String` variants | Values from properties: `fixedRateString = "${jobs.rates.period}"`, durations like `PT5M` |

Pitfalls:

- **One thread by default:** Boot's scheduler pool size is 1 (`spring.task.scheduling.pool.size`) — a slow job delays all others. Increase the pool or hand long work to an executor.
- **Multiple instances:** every instance runs every scheduled method. For "exactly one" execution, use a distributed lock (ShedLock with a database/Redis lock table), a leader election, or an external scheduler (Kubernetes CronJob, Quartz cluster).
- Methods must be `void` and take no arguments; exceptions are logged and the schedule continues.
- Make jobs **idempotent** and resumable — they may run twice or be interrupted by deployments.

## Comparison

| | `@Async` | `@Scheduled` | Message queue (Kafka/RabbitMQ) |
|--|----------|--------------|-------------------------------|
| Trigger | Method call | Time | Message |
| Durability | In-memory (lost on crash) | n/a | Durable |
| Multi-instance | Runs where called | Runs on every instance | Consumer groups distribute work |
| Retry | Manual | Next schedule | Built-in redelivery |
| Use | Fire-and-forget side tasks | Periodic jobs | Reliable async processing between services |

## Common Mistakes

- Calling an `@Async` method from the same class (self-invocation) and wondering why it is synchronous.
- Forgetting `@EnableAsync`/`@EnableScheduling`.
- `@Async` method on a non-bean or private method.
- Losing exceptions from `void` async methods.
- Using the request's `SecurityContext`/transaction/entities inside async code.
- Scheduled jobs running on all N instances, sending N emails.

## Common Interview Traps

- **"`@Async` makes the method run in parallel automatically, always."** Only when called through the proxy and with an executor that has free threads.
- **"`fixedRate` and `fixedDelay` are the same."** Rate counts from start to start; delay counts from end to start.
- **"Spring cron has five fields like Unix cron."** Spring's cron has six (seconds first).

## Key Takeaways

- `@Async` (+ `@EnableAsync`) runs proxied calls on a `TaskExecutor`; return `void`/`CompletableFuture`; handle exceptions; propagate context explicitly.
- `@Scheduled` (+ `@EnableScheduling`) with `fixedRate`/`fixedDelay`/`cron`; default single thread; every instance runs it unless you lock.
- For durable, retryable async work across services, use a message broker.
