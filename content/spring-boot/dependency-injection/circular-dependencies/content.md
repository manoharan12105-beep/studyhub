# Circular Dependencies

**Module:** Spring Framework Fundamentals · **Interview priority:** Frequently asked

## Definition

A **circular dependency** exists when bean A needs bean B and bean B (directly or through other beans) needs bean A: `A → B → A`, or `A → B → C → A`. Spring cannot create either bean first with all dependencies ready.

## Why It Matters

- It is a common startup failure after refactoring ("The dependencies of some of the beans in the application context form a cycle").
- Interviewers ask *why constructor cycles fail but field cycles sometimes work* — the answer exposes how Spring creates beans.
- A cycle almost always signals a design problem: two classes that should be one, or a responsibility in the wrong place.

## Circular Dependency

```text
OrderService ──needs──► PaymentService
     ▲                        │
     └────────needs───────────┘
```

Typical real causes:

- Two services calling each other ("`OrderService` updates payment, `PaymentService` updates order status").
- A service injecting the controller or a higher-level facade.
- Self-injection to get a proxy (`OrderService` injecting `OrderService`).

## How It Works

### Constructor cycles always fail

To call `new OrderService(paymentService)`, Spring needs `PaymentService`; to call `new PaymentService(orderService)`, it needs `OrderService`. Neither object can exist first, so Spring throws `BeanCurrentlyInCreationException`.

### Field/setter cycles can be resolved — by plain Spring, not by default in Boot

With field or setter injection, Spring can instantiate `OrderService` with its no-arg constructor, register an **early reference** to the half-built object, create `PaymentService`, inject that early reference into it, then finish `OrderService`. This uses the singleton registry's three levels:

| Cache | Holds |
|-------|-------|
| `singletonObjects` | Fully initialised singletons |
| `earlySingletonObjects` | Early references already handed out |
| `singletonFactories` | Factories that can create an early reference (possibly an early proxy) on demand |

**Spring Boot 2.6+ disables this** by default (`spring.main.allow-circular-references=false`): any cycle fails at startup. Plain Spring Framework still allows it.

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

public class CircularDependencyDemo {

    // Constructor cycle
    static class OrderService {
        OrderService(PaymentService paymentService) {
        }
    }

    static class PaymentService {
        PaymentService(OrderService orderService) {
        }
    }

    // Field-injection cycle
    static class InvoiceService {
        @Autowired
        LedgerService ledgerService;
    }

    static class LedgerService {
        @Autowired
        InvoiceService invoiceService;
    }

    static void start(String label, boolean allowCircular, Class<?>... beans) {
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
        context.setAllowCircularReferences(allowCircular);
        for (Class<?> bean : beans) {
            context.registerBean(bean);
        }
        try {
            context.refresh();
            System.out.println(label + ": started");
            context.close();
        } catch (Exception e) {
            Throwable root = e;
            while (root.getCause() != null) {
                root = root.getCause();
            }
            System.out.println(label + ": " + root.getClass().getSimpleName());
        }
    }

    public static void main(String[] args) {
        start("constructor cycle, allowed", true, OrderService.class, PaymentService.class);
        start("field cycle, allowed (plain Spring default)", true, InvoiceService.class, LedgerService.class);
        start("field cycle, disallowed (Spring Boot default)", false, InvoiceService.class, LedgerService.class);
    }
}
```

**Output:**

```text
constructor cycle, allowed: BeanCurrentlyInCreationException
field cycle, allowed (plain Spring default): started
field cycle, disallowed (Spring Boot default): BeanCurrentlyInCreationException
```

In a Spring Boot application the failure looks like this:

```text
***************************
APPLICATION FAILED TO START
***************************

Description:

The dependencies of some of the beans in the application context form a cycle:

┌─────┐
|  orderService defined in file [.../OrderService.class]
↑     ↓
|  paymentService defined in file [.../PaymentService.class]
└─────┘

Action:

Relying upon circular references is discouraged and they are prohibited by default. ...
```

## How to Fix It

Ranked from best to last resort:

1. **Redesign the responsibility.** Usually one direction is wrong. If `PaymentService` only needs to mark an order paid, move that call back into `OrderService` (orchestrator calls payment, then updates the order), or extract a third class both depend on (`OrderStatusUpdater`).
2. **Use events.** `PaymentService` publishes `PaymentCompletedEvent`; an `@EventListener` in the order module reacts. Dependencies now point one way. See [Spring Events](../../advanced/spring-events/content.md).
3. **Depend on a narrower interface** owned by the lower-level module (dependency inversion), implemented by the higher-level one — breaks the compile-time cycle.
4. **`@Lazy` on one injection point.** Spring injects a lazy-resolution proxy, so the real bean is fetched on first use. Works, but hides the design issue.
5. **`ObjectProvider<T>`** on one side — resolves on demand, same trade-off as `@Lazy`.
6. **`spring.main.allow-circular-references=true`** — restores old behaviour for field/setter cycles only; treat as a temporary migration aid.

```java
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

@Service
class PaymentService {
    private final OrderService orderService;

    PaymentService(@Lazy OrderService orderService) {   // proxy injected; real bean resolved on first call
        this.orderService = orderService;
    }
}

@Service
class OrderService {
    private final PaymentService paymentService;

    OrderService(PaymentService paymentService) {
        this.paymentService = paymentService;
    }
}
```

## Internal Behavior

- Spring keeps a set of "singletons currently in creation". Requesting a bean already in that set (without an early reference available) raises `BeanCurrentlyInCreationException`.
- Early references interact with proxies: if A needs a `@Transactional` proxy, the early reference given to B must already be that proxy. `SmartInstantiationAwareBeanPostProcessor.getEarlyBeanReference` creates it early. When a post-processor would wrap A differently later, Spring fails with "Bean with name 'a' has been injected into other beans … in its raw version as part of a circular reference" — one reason Boot prohibits cycles.
- Prototype-scoped cycles are never resolvable.

## Comparison

| Injection style | Cycle resolvable? (plain Spring) | Spring Boot default |
|-----------------|----------------------------------|---------------------|
| Constructor ↔ constructor | No | Fails |
| Field/setter ↔ field/setter | Yes, via early references | Fails (`allow-circular-references=false`) |
| Constructor with `@Lazy` on one side | Yes (proxy) | Works |
| Prototype ↔ prototype | No | Fails |

## Common Mistakes

- Switching from constructor to field injection "to fix" a cycle — Boot still rejects it, and the design problem remains.
- Self-injection (`@Autowired OrderService self`) to call `@Transactional` methods through the proxy — it creates a self-cycle; restructure instead (see [Transactional Pitfalls](../../transactions/transactional-pitfalls/content.md)).
- Sprinkling `@Lazy` everywhere until startup works.

## Common Interview Traps

- **"Spring always resolves circular dependencies."** Never for constructor injection; and Spring Boot prohibits all cycles by default since 2.6.
- **"Setter injection is better because it allows cycles."** Allowing cycles is not a benefit; constructor injection's failure is a useful signal.
- **"`@Lazy` fixes the design."** It defers resolution; the coupling remains.

## Key Takeaways

- Constructor cycles: `BeanCurrentlyInCreationException`, always.
- Field/setter cycles: resolvable through early references (three-level cache), but rejected by Spring Boot by default.
- Fix the design first: move responsibility, extract a class, use events, or invert a dependency; `@Lazy`/`ObjectProvider` only as a pragmatic last step.
