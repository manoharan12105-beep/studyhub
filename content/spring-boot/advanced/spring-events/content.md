# Spring Events

**Module:** Advanced Spring · **Interview priority:** Frequently asked

## Definition

**Spring events** implement the observer pattern inside one application: a component **publishes** an event object with `ApplicationEventPublisher.publishEvent(...)`, and any number of beans **listen** with `@EventListener` methods. The publisher does not know the listeners. Events are **synchronous** by default (listeners run on the publisher's thread, inside its transaction); **`@Async`** makes them asynchronous, and **`@TransactionalEventListener`** runs them only at a transaction phase such as after commit.

## Why It Matters

- Decouples modules: `OrderService` should not depend on email, loyalty, analytics and warehouse services just to notify them.
- Breaks circular dependencies (see [Circular Dependencies](../../dependency-injection/circular-dependencies/content.md)).
- "Send the confirmation email only if the order really committed" is a classic interview scenario.

## Spring Events

```text
OrderService ──publishEvent(OrderPlacedEvent)──► ApplicationEventMulticaster
                                                     ├─► AuditListener        (@EventListener, same thread, same tx)
                                                     ├─► LoyaltyListener      (@EventListener @Async, other thread)
                                                     └─► EmailListener        (@TransactionalEventListener AFTER_COMMIT)
```

## ApplicationEvent

Since Spring 4.2, **any object** can be an event (records are ideal); extending `ApplicationEvent` is optional. Built-in events tell you about the application lifecycle:

| Event | When |
|-------|------|
| `ContextRefreshedEvent` | Context initialised or refreshed |
| `ApplicationStartedEvent` (Boot) | Context refreshed, before runners |
| `ApplicationReadyEvent` (Boot) | Runners done, ready to serve |
| `ContextClosedEvent` | Context closing |
| `ApplicationFailedEvent` (Boot) | Startup failed |
| `AvailabilityChangeEvent` (Boot) | Liveness/readiness state changed |

Publishing and listening:

```java
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

record UserRegisteredEvent(long userId, String email) {
}

@Service
class RegistrationService {
    private final ApplicationEventPublisher events;

    RegistrationService(ApplicationEventPublisher events) {
        this.events = events;
    }

    void register(String email) {
        long userId = 42;                                              // save the user …
        events.publishEvent(new UserRegisteredEvent(userId, email));
    }
}

@Component
class WelcomeCouponListener {
    @EventListener
    void onRegistered(UserRegisteredEvent event) {
        // grant a welcome coupon
    }

    @EventListener(condition = "#event.email.endsWith('@corp.example')")   // SpEL filter
    void onCorporateUser(UserRegisteredEvent event) {
    }
}
```

Listeners can return a value (published as a new event), be ordered with `@Order`, and listen to multiple types.

## Async Events

Add `@Async` to a listener (with `@EnableAsync`) to run it on an executor thread — the publisher returns immediately and listener exceptions no longer reach it. Async listeners do not share the publisher's transaction or thread-local context.

## Transactional Events

`@TransactionalEventListener` binds a listener to the publisher's transaction:

| Phase | Runs |
|-------|------|
| `AFTER_COMMIT` (default) | Only if the transaction commits — emails, messages, cache eviction |
| `AFTER_ROLLBACK` | Only on rollback — compensation, alerts |
| `AFTER_COMPLETION` | After commit or rollback |
| `BEFORE_COMMIT` | Just before commit, inside the transaction |

If no transaction is active when the event is published, the listener does **not** run unless `fallbackExecution = true`.

## How It Works

```java
import javax.sql.DataSource;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

public class EventsDemo {

    record OrderPlacedEvent(long orderId, String email) {        // any object can be an event
    }

    static class OrderService {
        private final ApplicationEventPublisher events;

        OrderService(ApplicationEventPublisher events) {
            this.events = events;
        }

        @Transactional
        public void place(long orderId, boolean failAfterPublishing) {
            System.out.println("  OrderService: saving order " + orderId);
            events.publishEvent(new OrderPlacedEvent(orderId, "asha@example.com"));
            System.out.println("  OrderService: publishEvent returned");
            if (failAfterPublishing) {
                throw new IllegalStateException("payment failed");
            }
        }
    }

    static class Listeners {
        @EventListener                                              // synchronous, inside the transaction
        public void audit(OrderPlacedEvent event) {
            System.out.println("  @EventListener: audit order " + event.orderId());
        }

        @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)   // only if the tx commits
        public void sendEmail(OrderPlacedEvent event) {
            System.out.println("  @TransactionalEventListener: email for order " + event.orderId());
        }
    }

    @Configuration
    @EnableTransactionManagement
    static class Config {
        @Bean
        DataSource dataSource() {
            return new EmbeddedDatabaseBuilder().setType(EmbeddedDatabaseType.H2).generateUniqueName(true).build();
        }

        @Bean
        PlatformTransactionManager transactionManager(DataSource dataSource) {
            return new DataSourceTransactionManager(dataSource);
        }

        @Bean
        OrderService orderService(ApplicationEventPublisher events) {
            return new OrderService(events);
        }

        @Bean
        Listeners listeners() {
            return new Listeners();
        }
    }

    public static void main(String[] args) {
        try (var context = new AnnotationConfigApplicationContext(Config.class)) {
            OrderService orders = context.getBean(OrderService.class);
            System.out.println("1. transaction commits:");
            orders.place(1, false);
            System.out.println("2. transaction rolls back:");
            try {
                orders.place(2, true);
            } catch (IllegalStateException e) {
                System.out.println("  caller: " + e.getMessage());
            }
        }
    }
}
```

**Output:**

```text
1. transaction commits:
  OrderService: saving order 1
  @EventListener: audit order 1
  OrderService: publishEvent returned
  @TransactionalEventListener: email for order 1
2. transaction rolls back:
  OrderService: saving order 2
  @EventListener: audit order 2
  OrderService: publishEvent returned
  caller: payment failed
```

The plain listener ran **immediately, inside** `publishEvent`, even for the order that rolled back. The transactional listener ran only after the first transaction **committed** — order 2 never got an email.

## Internal Behavior

- `ApplicationContext` delegates to an `ApplicationEventMulticaster` (`SimpleApplicationEventMulticaster`), which finds matching listeners by event type (generics-aware) and invokes them in order.
- `@EventListener` methods are detected by `EventListenerMethodProcessor` and wrapped as `ApplicationListenerMethodAdapter`s.
- `@TransactionalEventListener` registers a `TransactionSynchronization` on publish and runs at the chosen phase; work done in an `AFTER_COMMIT` listener that writes to the database needs its **own** transaction (`REQUIRES_NEW`), because the original one has completed.
- Events are **in-memory**: if the process crashes after commit but before an `AFTER_COMMIT` listener finishes, the work is lost. Use the transactional outbox + message broker for guaranteed delivery.

## Comparison: Spring Events vs Message Brokers

| | Spring events | Kafka / RabbitMQ |
|--|---------------|------------------|
| Scope | One JVM | Across services and instances |
| Durability | None (in memory) | Persistent |
| Delivery | Synchronous or local async | Asynchronous, retries, dead-letter queues |
| Use | Decoupling modules inside a service | Integration between services, reliable workflows |

## Common Mistakes

- Expecting `@EventListener` to be asynchronous by default.
- Sending emails/messages from a plain `@EventListener` inside the transaction (sent even if the transaction rolls back).
- `@TransactionalEventListener` events published outside a transaction silently ignored.
- Writing to the database in an `AFTER_COMMIT` listener without `REQUIRES_NEW`.
- Using events for core business steps that must succeed atomically with the publisher.

## Common Interview Traps

- **"Spring events are asynchronous."** Synchronous by default; same thread and same transaction.
- **"An exception in a listener does not affect the publisher."** For synchronous listeners it propagates to the publisher (and can roll back its transaction).
- **"Spring events can replace Kafka."** They are local and not durable.

## Key Takeaways

- Publish any object with `ApplicationEventPublisher`; listen with `@EventListener`.
- Default: synchronous, same thread, same transaction; `@Async` for background; `@TransactionalEventListener(AFTER_COMMIT)` for side effects of committed data.
- Events decouple modules inside one application; use a broker (with an outbox) for durable cross-service events.
