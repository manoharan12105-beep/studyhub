# Dependency Injection and Inversion of Control

## Definition

- A **dependency** is any object a class needs to do its job (a repository, a payment gateway, a clock).
- **Dependency Injection (DI)** is supplying those dependencies to an object **from outside** — through its constructor, a setter or a field — instead of the object creating or looking them up itself.
- **Inversion of Control (IoC)** is the broader idea that control over object creation and program flow is moved out of your classes into a framework or a dedicated piece of code ("don't call us, we'll call you"). A **DI container** (such as Spring's `ApplicationContext`) is an IoC mechanism that creates objects and injects their dependencies.

## Why It Matters

- **Loose coupling:** a class that receives a `PaymentGateway` works with any implementation.
- **Testability:** tests pass fakes through the same constructor production uses.
- **Single responsibility:** objects do their job; deciding *which* implementations to use is a separate job done in one place.
- **Configuration:** swapping implementations (sandbox vs live payment gateway) becomes a wiring change.
- Every Spring Boot interview assumes you understand DI; this topic focuses on the OOP design behind it.

## Tight Coupling: Creating Dependencies Inside

```java
class RazorpayGateway {
    String charge(long amountPaise) {
        return "razorpay:" + amountPaise;
    }
}

class CheckoutService {
    private final RazorpayGateway gateway = new RazorpayGateway();   // decides AND creates its dependency

    String checkout(long amountPaise) {
        return gateway.charge(amountPaise);
    }
}
```

`CheckoutService` is welded to one vendor class: it cannot be tested without it, cannot switch providers without editing, and cannot share a configured gateway instance with other services.

## The Three Forms of Injection

### Constructor injection

```java
interface PaymentGateway {
    String charge(long amountPaise);
}

class CheckoutService {
    private final PaymentGateway gateway;                 // final: set once, never null after construction

    CheckoutService(PaymentGateway gateway) {
        this.gateway = java.util.Objects.requireNonNull(gateway);
    }

    String checkout(long amountPaise) {
        return gateway.charge(amountPaise);
    }
}
```

### Setter injection

```java
class ReportService {
    private ReportFormatter formatter = new PlainTextFormatter();   // sensible default

    void setFormatter(ReportFormatter formatter) {                  // optional, replaceable
        this.formatter = formatter;
    }
}
```

### Field injection (framework-only)

```java
class OrderController {
    @Autowired                                  // Spring sets the private field by reflection
    private OrderService orderService;
}
```

| | Constructor | Setter | Field |
|--|-------------|--------|-------|
| Dependencies visible in the API | Yes — in the constructor signature | Partly | No — hidden |
| Object complete after construction | Yes | Not until setters are called | Only inside a container |
| Supports `final` fields / immutability | Yes | No | No |
| Easy to construct in a plain unit test | Yes (`new X(fake)`) | Yes, if you remember every setter | No — needs reflection or a container |
| Good for | **Required** dependencies (the default) | **Optional** dependencies with defaults, or reconfiguration | Rarely recommended; sometimes seen in tests or legacy code |

## Why Constructor Injection Is Generally Preferred

1. **No half-built objects:** an object cannot exist without its required collaborators, so no `NullPointerException` from a forgotten setter.
2. **Immutability:** dependencies can be `final`, making the object safer to share between threads.
3. **Honest API:** the constructor lists exactly what the class needs. A constructor with eight parameters is a visible warning that the class has too many responsibilities (see [Single Responsibility](../single-responsibility-principle/content.md)).
4. **Framework-independent tests:** `new CheckoutService(new FakeGateway())` — no container, no reflection.
5. **Cycle detection:** circular constructor dependencies fail fast at startup instead of producing subtly half-initialised objects.

Spring's own documentation recommends constructor injection for required dependencies, and since Spring 4.3 a class with a single constructor does not even need `@Autowired` on it.

## DI Without a Framework: The Composition Root

DI is a design technique, not a library. In plain Java, one place — usually `main` — creates the objects and wires them together. This place is called the **composition root**.

```java
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;

public class ManualDependencyInjection {

    // ---------- Abstractions ----------
    interface PaymentGateway {
        String charge(long amountPaise);
    }

    interface OrderRepository {
        void save(String orderId, String paymentRef);
        Map<String, String> all();
    }

    // ---------- Implementations ----------
    static class SandboxGateway implements PaymentGateway {
        public String charge(long amountPaise) {
            return "SANDBOX-" + amountPaise;
        }
    }

    static class InMemoryOrderRepository implements OrderRepository {
        private final Map<String, String> orders = new HashMap<>();

        public void save(String orderId, String paymentRef) {
            orders.put(orderId, paymentRef);
        }

        public Map<String, String> all() {
            return Map.copyOf(orders);
        }
    }

    // ---------- Business class: receives everything it needs ----------
    static class CheckoutService {
        private final PaymentGateway gateway;
        private final OrderRepository repository;
        private final Clock clock;

        CheckoutService(PaymentGateway gateway, OrderRepository repository, Clock clock) {
            this.gateway = gateway;
            this.repository = repository;
            this.clock = clock;
        }

        String checkout(String orderId, long amountPaise) {
            String reference = gateway.charge(amountPaise);
            repository.save(orderId, reference);
            return orderId + " paid at " + clock.instant() + " ref " + reference;
        }
    }

    // ---------- Composition root: the ONLY place that knows concrete classes ----------
    public static void main(String[] args) {
        Clock clock = Clock.fixed(Instant.parse("2026-01-26T10:00:00Z"), ZoneOffset.UTC);
        OrderRepository repository = new InMemoryOrderRepository();
        CheckoutService checkout = new CheckoutService(new SandboxGateway(), repository, clock);

        System.out.println(checkout.checkout("ORD-501", 125_000));
        System.out.println(repository.all());
    }
}
```

**Output:**

```text
ORD-501 paid at 2026-01-26T10:00:00Z ref SANDBOX-125000
{ORD-501=SANDBOX-125000}
```

Swapping to a live gateway changes one line in the composition root; `CheckoutService` is untouched. A DI container automates exactly this wiring for hundreds of objects.

## Inversion of Control

Without IoC, your code is in charge: it creates objects and calls libraries. With IoC, a framework is in charge and calls your code at the right moments:

| Your code controls | Framework controls (IoC) |
|--------------------|--------------------------|
| `main` creates every object with `new` | The container creates beans and injects dependencies |
| Your loop reads requests and dispatches them | The web framework receives HTTP requests and calls your controller method |
| You call `thread.start()` and manage workers | An executor or scheduler calls your `Runnable` |
| You call `sort` and pass a comparator | `sort` calls your comparator (a small IoC) — the [Template Method](../../design-patterns/template-method-pattern/content.md) and [Strategy](../../design-patterns/strategy-pattern/content.md) patterns are IoC at small scale |

DI is one specific form of IoC: control over **obtaining dependencies** is inverted — the object no longer looks for them; they are given to it.

## DI vs IoC vs DIP

| | Dependency Inversion Principle | Dependency Injection | Inversion of Control |
|--|-------------------------------|----------------------|----------------------|
| Kind | Design principle | Technique / pattern | General architectural idea |
| Says | Depend on abstractions owned by the high-level policy | Give objects their dependencies from outside | Let a framework or caller control creation and flow |
| Example | `OrderService` depends on its `OrderRepository` interface | `new OrderService(new JpaOrderRepository())` | Spring creates `OrderService` and calls its methods on HTTP requests |

You can use DI without DIP (injecting concrete classes) and DIP without a container (manual wiring), but the combination — injecting abstractions — gives the most benefit. See [Dependency Inversion Principle](../dependency-inversion-principle/content.md).

## Alternatives and How DI Compares

| Approach | How a class gets its dependency | Drawback |
|----------|--------------------------------|----------|
| `new` inside the class | Creates it | Tight coupling, untestable |
| Static call / singleton (`Database.getInstance()`) | Reaches a global | Hidden dependency, global state, hard to fake |
| **Service locator** (`ServiceLocator.get(PaymentGateway.class)`) | Asks a registry | Dependencies hidden inside method bodies; failures at runtime |
| Factory | Asks a factory | Fine for creating *new* objects per call; the factory itself is often injected |
| **Dependency injection** | Receives it | Needs a composition root (manual or container) |

## Relationship to Spring and Spring Boot

Spring is an IoC container: it scans for classes marked as components (`@Component`, `@Service`, `@Repository`, `@Controller`, `@Configuration` + `@Bean`), creates **beans** (by default one shared instance per bean — singleton scope), and injects them into each other's constructors by type. In OOP terms:

- Write classes that take interfaces in their constructors (DIP + constructor DI).
- Spring's configuration plays the role of the composition root.
- Because beans are shared singletons, services should be **stateless** or thread-safe ([OOP with Multithreading](../../applied-oop/oop-with-multithreading/content.md)).
- Multiple implementations of one interface are disambiguated with qualifiers or by injecting all of them as a `List` — an OCP-friendly registry.

The design does not depend on Spring: the same classes can be wired by hand in tests or in a small application.

## Common Misconceptions

- **"DI requires Spring."** DI is passing dependencies in; a constructor is enough.
- **"DI and DIP are the same."** DI is how you supply dependencies; DIP is about which way dependencies point.
- **"Field injection is fine because it is shorter."** It hides dependencies, prevents `final` fields and complicates tests.
- **"Every class should be injected."** Inject collaborators with behaviour that may vary or need faking (services, repositories, clocks); create simple value objects (`Money`, `LocalDate`, DTOs) directly with `new`.
- **"IoC means DI."** DI is one kind of IoC; event-driven frameworks and template methods are others.

## Key Takeaways

- A dependency is something a class needs; DI means receiving it from outside.
- Prefer constructor injection for required dependencies (final fields, complete objects, easy tests); setter injection for optional ones; avoid field injection.
- A composition root (manual or a container) is the only place that knows concrete classes.
- IoC: the framework calls you; DI is IoC applied to obtaining dependencies; DIP decides what you should depend on.
- Spring automates DI, but the OOP design — classes depending on injected abstractions — stands on its own.
