# Observer

**Category:** Behavioral · **Interview priority:** Core

## Intent

Define a **one-to-many dependency** so that when one object (the **subject**) changes state, all its dependents (**observers**) are **notified automatically** — without the subject knowing who they are or what they do. Also known as **publish–subscribe** (in its in-process form) or listener/event handling.

## The Problem

When an order is shipped, several parts of the system must react:

- the customer gets an SMS,
- the analytics module records the event,
- the loyalty module awards points,
- and next quarter, the warehouse dashboard will need a live update too.

## Why the Naive Solution Fails

```java
class Order {
    void ship() {
        status = "SHIPPED";
        new SmsService().send(customerPhone, "Shipped!");       // order knows SMS
        new Analytics().record("order_shipped", id);            // order knows analytics
        new LoyaltyService().addPoints(customerId, 50);          // order knows loyalty
        // every new reaction = edit Order again
    }
}
```

- `Order` is coupled to every module interested in it (high coupling, low cohesion).
- Each new reaction edits `Order` (OCP violation).
- A failure in analytics could break shipping.
- Testing `ship()` drags in SMS, analytics and loyalty.

## The Pattern Idea

The subject keeps a **list of observers** that implement a common interface. Observers **subscribe** (and unsubscribe) themselves. When the state changes, the subject **notifies** every registered observer through the interface. The subject depends only on that interface; adding a reaction means registering a new observer.

## Structure

```text
 Subject (Order / EventPublisher)              «interface» OrderListener (Observer)
 - listeners: List<OrderListener>  ──notifies──▶ + onEvent(OrderEvent)
 + subscribe(listener)                                ▲      ▲       ▲
 + unsubscribe(listener)                              ┆      ┆       ┆
 + ship() → notifyAll(event)                SmsNotifier Analytics LoyaltyPoints (ConcreteObservers)
```

| Participant | In the example |
|-------------|----------------|
| Subject | `OrderEvents` publisher used by `Order` |
| Observer | `OrderListener` |
| ConcreteObservers | `SmsNotifier`, `AnalyticsRecorder`, `LoyaltyPoints` |
| Event (optional) | `OrderEvent` record carrying the data (push model) |

## Java Implementation

```java
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class ObserverDemo {

    record OrderEvent(String orderId, String customer, String type) { }

    // Observer
    interface OrderListener {
        void onEvent(OrderEvent event);
    }

    // Subject (publisher)
    static class OrderEvents {
        private final List<OrderListener> listeners = new CopyOnWriteArrayList<>();   // safe if listeners change during notify

        void subscribe(OrderListener listener) {
            listeners.add(listener);
        }

        void unsubscribe(OrderListener listener) {
            listeners.remove(listener);
        }

        void publish(OrderEvent event) {
            for (OrderListener listener : listeners) {
                try {
                    listener.onEvent(event);
                } catch (RuntimeException e) {                  // one failing observer must not stop the others
                    System.out.println("listener failed: " + e.getMessage());
                }
            }
        }
    }

    // The domain object only knows the publisher
    static class Order {
        private final String id;
        private final String customer;
        private final OrderEvents events;
        private String status = "PLACED";

        Order(String id, String customer, OrderEvents events) {
            this.id = id;
            this.customer = customer;
            this.events = events;
        }

        void ship() {
            if (!status.equals("PLACED")) {
                throw new IllegalStateException("cannot ship from " + status);
            }
            status = "SHIPPED";
            events.publish(new OrderEvent(id, customer, "SHIPPED"));
        }
    }

    // Concrete observers
    static class SmsNotifier implements OrderListener {
        public void onEvent(OrderEvent e) {
            System.out.println("SMS to " + e.customer() + ": order " + e.orderId() + " " + e.type());
        }
    }

    static class AnalyticsRecorder implements OrderListener {
        public void onEvent(OrderEvent e) {
            System.out.println("analytics: " + e.type().toLowerCase() + " " + e.orderId());
        }
    }

    static class LoyaltyPoints implements OrderListener {
        public void onEvent(OrderEvent e) {
            if (e.type().equals("SHIPPED")) {
                throw new IllegalStateException("loyalty service down");
            }
        }
    }

    public static void main(String[] args) {
        OrderEvents events = new OrderEvents();
        SmsNotifier sms = new SmsNotifier();
        events.subscribe(sms);
        events.subscribe(new AnalyticsRecorder());
        events.subscribe(new LoyaltyPoints());
        events.subscribe(e -> System.out.println("dashboard: refresh"));   // a lambda observer

        new Order("ORD-11", "Kavitha", events).ship();

        events.unsubscribe(sms);
        System.out.println("--- after unsubscribing SMS ---");
        new Order("ORD-12", "Rahim", events).ship();
    }
}
```

**Output:**

```text
SMS to Kavitha: order ORD-11 SHIPPED
analytics: shipped ORD-11
listener failed: loyalty service down
dashboard: refresh
--- after unsubscribing SMS ---
analytics: shipped ORD-12
listener failed: loyalty service down
dashboard: refresh
```

`Order` knows nothing about SMS, analytics, loyalty or dashboards. The new dashboard reaction was added without touching `Order`.

### Design decisions

| Decision | Options |
|----------|---------|
| **Push vs pull** | Push: the event carries the data (`OrderEvent`). Pull: the observer receives the subject and queries what it needs. Push decouples observers from the subject's API; pull lets observers choose what to read. |
| **Synchronous vs asynchronous** | Synchronous (above) is simple but a slow observer slows the subject. Asynchronous delivery (executor, message queue) isolates observers but needs error handling and ordering decisions. |
| **Failure isolation** | Catch exceptions per observer (as above) or let them propagate — decide deliberately. |
| **Ordering** | Usually unspecified; do not rely on it unless the publisher guarantees it. |
| **Unsubscription** | Always offer it; forgotten listeners keep objects alive (memory leaks). |

## Execution Flow

1. Observers subscribe to the subject.
2. The subject changes state (`ship()`) and calls `publish(event)`.
3. The subject iterates over its observers and calls `onEvent` on each; each reacts independently.

## Real-World Examples

- GUI event listeners: `ActionListener`, `PropertyChangeListener` (`java.beans.PropertyChangeSupport`).
- Spring's application events: `ApplicationEventPublisher.publishEvent(...)` with `@EventListener` methods.
- `java.util.concurrent.Flow` (reactive streams: `Publisher`/`Subscriber`).
- Message brokers (Kafka, RabbitMQ) implement publish–subscribe **across** services.
- `java.util.Observer`/`Observable` existed since Java 1.0 but are **deprecated since Java 9**; use your own listener interfaces, `PropertyChangeSupport` or `Flow` instead.

## When to Use

- A change in one object must trigger reactions in others, and the set of reacting objects varies or is unknown to the subject.
- You want modules to stay decoupled (the core domain should not depend on notification, analytics or UI modules).

## When Not to Use

- There is exactly one, fixed reaction — a direct call is clearer.
- A strict, ordered workflow where each step depends on the previous result — explicit orchestration is easier to follow and debug.
- Event chains that trigger further events can become hard to reason about ("event spaghetti").

## Advantages

- Loose coupling: the subject depends only on an observer interface.
- New reactions without modifying the subject (OCP).
- Supports broadcast to any number of observers, added or removed at runtime.

## Disadvantages

- Control flow is implicit; harder to trace and debug.
- Observers notified in unspecified order; failures need explicit handling.
- Memory leaks from observers that are never unsubscribed (lapsed listeners).
- Synchronous notification can slow the subject; async adds complexity.

## Related Patterns

- **Mediator:** a coordinator that knows all participants and encodes how they interact; Observer simply broadcasts to whoever subscribed. Mediators are often implemented using observer-style notifications.
- **Publish–subscribe with a message broker:** the distributed version — publishers and subscribers do not even know each other's addresses.
- **Command:** events/notifications are sometimes modelled as command objects.
- **Singleton:** global event buses are sometimes singletons (with the usual drawbacks; prefer injecting the publisher).

## SOLID Connection

- **OCP:** add observers without changing the subject.
- **DIP:** the subject depends on the `OrderListener` abstraction; modules (SMS, analytics) depend on the event type, not the other way round.
- **SRP:** each observer handles one reaction.

## Common Mistakes

- Not unsubscribing observers that should die (memory leaks, especially with inner-class listeners).
- One observer's exception aborting notification of the rest.
- Modifying the observer list during notification without a safe collection (`ConcurrentModificationException`).
- Long-running work inside synchronous observers.
- Relying on notification order.

## Key Takeaways

- Observer: subject keeps a list of observers and notifies them through an interface when its state changes.
- Decouples the source of a change from its reactions; new reactions are new observers.
- Decide push/pull, sync/async, failure isolation and unsubscription explicitly.
- `java.util.Observable` is deprecated; use listener interfaces, Spring events or `Flow`.
