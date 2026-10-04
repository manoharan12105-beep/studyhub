# IoC and Dependency Injection in Spring

**Module:** Spring Framework Fundamentals · **Interview priority:** Core

## Definition

- **Inversion of Control (IoC)** is a principle: your code no longer controls the creation and wiring of its collaborators or the overall program flow; a framework does, and calls your code when needed.
- **Dependency Injection (DI)** is the specific technique Spring uses to implement IoC for object wiring: an object declares what it needs (constructor parameters, setters, fields), and the container **supplies** those dependencies.
- **Dependency Inversion Principle (DIP)** is a design principle: high-level modules depend on **abstractions**, not on concrete low-level classes.

They work together: DIP shapes your types, DI supplies the implementations, and the IoC container automates DI.

## Why It Matters

- Every other Spring feature assumes DI: auto-configuration contributes beans *to be injected*, proxies work because callers receive what the container injects.
- "IoC vs DI" is a standard opening question; a precise answer separates principle from technique.
- DI is why Spring code is testable: services take collaborators through the constructor, so tests pass fakes without a container.

The design-level background (composition root, service locator, DIP) is covered in the OOP topics [Dependency Injection and IoC](../../../oop/design-principles/dependency-injection/content.md) and [Dependency Inversion Principle](../../../oop/design-principles/dependency-inversion-principle/content.md). This topic focuses on **how Spring does it**.

## IoC

Without IoC, `main` (or each class) decides what to create and in which order. With IoC:

```text
Traditional control                    Inverted control (Spring)
───────────────────                    ─────────────────────────
main()                                 SpringApplication.run()
 ├─ new DataSource(...)                  container reads definitions
 ├─ new OrderRepository(ds)              container creates beans in dependency order
 ├─ new OrderService(repo)               container injects them
 └─ new OrderController(service)         DispatcherServlet calls YOUR controller method
                                          when a request arrives
```

IoC appears in Spring in several forms, not only DI:

| Form | Example |
|------|---------|
| Dependency injection | Container passes `OrderRepository` into `OrderService` |
| Framework calls your callbacks | `DispatcherServlet` invokes `@GetMapping` methods; `@Scheduled`, `@EventListener` |
| Template method | `JdbcTemplate` controls connection handling and calls your `RowMapper` |
| Lifecycle | Container calls `@PostConstruct` / `@PreDestroy` |

## Dependency Injection

```java
import java.math.BigDecimal;
import org.springframework.stereotype.Repository;
import org.springframework.stereotype.Service;

interface PaymentGateway {                                   // abstraction (DIP)
    String charge(String orderId, BigDecimal amount);
}

@Repository
class OrderRepository {
    void markPaid(String orderId, String paymentRef) {
    }
}

@Service
class CheckoutService {
    private final PaymentGateway gateway;                    // depends on the abstraction
    private final OrderRepository orders;

    CheckoutService(PaymentGateway gateway, OrderRepository orders) {   // DI: supplied by Spring
        this.gateway = gateway;
        this.orders = orders;
    }

    String checkout(String orderId, BigDecimal amount) {
        String ref = gateway.charge(orderId, amount);
        orders.markPaid(orderId, ref);
        return ref;
    }
}
```

`CheckoutService` never says which `PaymentGateway` it gets. Whichever bean implements the interface — a Razorpay client in production, a fake in tests — is injected.

## Dependency Inversion

DIP is about **who owns the abstraction**. `PaymentGateway` belongs to the checkout (high-level) module; the Razorpay or Stripe adapter (low-level) implements it. Without DIP, `CheckoutService` would import `RazorpayClient` directly, and DI alone would only inject that concrete class.

| | Without DIP | With DIP |
|--|-------------|----------|
| `CheckoutService` field type | `RazorpayClient` | `PaymentGateway` |
| Switching provider | Edit `CheckoutService` | Add a new bean implementing `PaymentGateway` |
| Unit test | Needs Razorpay or a mocking library for a concrete class | Pass a lambda/fake implementation |

## IoC vs DI

| Aspect | IoC | DI |
|--------|-----|----|
| Kind | Principle ("don't call us, we'll call you") | Technique / pattern |
| Scope | Object creation, flow, lifecycle, callbacks | Supplying an object's dependencies |
| Relationship | The broad idea | One way to achieve IoC |
| In Spring | The container controls the app | Constructor/setter/field injection |
| Other forms | Events, template method, callbacks, service locator | — |

One sentence for interviews: *IoC is the principle of handing control to the framework; DI is the pattern Spring uses to apply that principle to object dependencies.*

## How It Works

Spring performs DI in four steps for each bean:

1. **Determine injection points** — the constructor to use (the only one, or the one annotated `@Autowired`), plus `@Autowired` fields/setters.
2. **Resolve each dependency by type** — look up beans assignable to the parameter type (including generics: `Repository<Order>` ≠ `Repository<User>`).
3. **Narrow ambiguous matches** — `@Qualifier`, then `@Primary`, then `@Priority`, then the parameter/field name — see [@Autowired, @Qualifier and @Primary](../autowiring-and-bean-resolution/content.md).
4. **Create dependencies first** (recursively), then call the constructor / set the fields.

## Internal Behavior

- Constructor injection is performed while **instantiating** the bean (`ConstructorResolver`); field and setter injection afterwards by `AutowiredAnnotationBeanPostProcessor`.
- Dependencies are resolved through `DefaultListableBeanFactory.resolveDependency`, which also understands `Optional<T>`, `ObjectProvider<T>`, `List<T>`, `Map<String, T>` and `@Lazy` injection points.
- If a needed bean is missing, startup fails with `UnsatisfiedDependencyException` caused by `NoSuchBeanDefinitionException`; Spring Boot's failure analyzer prints "Parameter 0 of constructor in … required a bean of type … that could not be found."

## Real-World Examples

- `SecurityFilterChain` bean receives `HttpSecurity` (built by Spring Security) as a `@Bean` method parameter.
- `JpaRepository` interfaces are implemented by Spring Data and injected into services.
- Boot injects `RestClient.Builder` pre-configured with message converters.

## Common Mistakes

- Depending on concrete classes everywhere — DI works, but the code is still tightly coupled (no DIP).
- Calling `new` for a service "just this once" — that instance skips DI and proxies.
- Using `ApplicationContext.getBean` in business code (service locator), hiding dependencies.

## Common Interview Traps

- **"IoC and DI are the same."** DI is one implementation of IoC.
- **"`@Autowired` is dependency injection."** `@Autowired` is one way to *mark an injection point*; DI happens without it (single-constructor injection, `@Bean` method parameters).
- **"DI requires Spring."** DI is a plain-Java design technique; Spring automates it.
- **"DI and DIP are the same thing."** DIP is about depending on abstractions; DI is about who supplies the object.

## Key Takeaways

- IoC = principle; DI = Spring's technique for wiring; DIP = depend on abstractions.
- Spring resolves dependencies by type, narrows with qualifiers/primary/name, and creates dependencies first.
- Write classes that take interfaces through constructors; Spring and tests both benefit.
