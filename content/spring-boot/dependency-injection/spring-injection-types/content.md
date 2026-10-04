# Constructor, Setter and Field Injection

**Module:** Spring Framework Fundamentals · **Interview priority:** Core

## Definition

Spring can inject a dependency in three places:

- **Constructor injection** — dependencies are constructor parameters; the container calls the constructor with them.
- **Setter injection** — the container calls a setter method (annotated `@Autowired`) after construction.
- **Field injection** — the container sets a field (annotated `@Autowired`) directly by reflection after construction.

## Why It Matters

- "Why is constructor injection preferred over field injection?" is one of the most common Spring interview questions.
- The choice affects immutability, testability, null-safety and how early circular dependencies are detected.
- Code reviews in Spring teams flag field injection; knowing the reasons lets you defend the style.

## Constructor Injection

```java
import org.springframework.stereotype.Service;

@Service
public class OrderService {
    private final OrderRepository repository;            // final: assigned once
    private final PaymentGateway gateway;

    public OrderService(OrderRepository repository, PaymentGateway gateway) {   // no @Autowired needed
        this.repository = repository;
        this.gateway = gateway;
    }
}

interface OrderRepository {
}

interface PaymentGateway {
}
```

- Since Spring 4.3, a class with a **single constructor** needs no `@Autowired`: Spring uses that constructor.
- With **several constructors**, mark the one Spring should use with `@Autowired`; otherwise Spring looks for a no-arg constructor and fails if there is none.
- Lombok's `@RequiredArgsConstructor` generates the constructor for `final` fields — common in projects; the injection style is still constructor injection.

## Setter Injection

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ReportService {
    private ReportFormatter formatter = new PlainTextFormatter();   // sensible default

    @Autowired(required = false)                                     // optional: keep default if no bean
    public void setFormatter(ReportFormatter formatter) {
        this.formatter = formatter;
    }
}

interface ReportFormatter {
}

class PlainTextFormatter implements ReportFormatter {
}
```

Use for **optional** dependencies with a default, or dependencies that may be re-configured later. Fields cannot be `final`.

## Field Injection

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    @Autowired
    private EmailClient emailClient;          // set by reflection after construction
}

interface EmailClient {
}
```

Shortest to write, but the dependency is invisible from outside and the class cannot be constructed correctly without Spring (or reflection). Acceptable in test classes (`@Autowired MockMvc mockMvc;`) where the framework creates the instance.

## @Autowired

`@Autowired` marks an **injection point**: a constructor, a setter or any method, or a field. It is processed by `AutowiredAnnotationBeanPostProcessor`.

| Usage | Effect |
|-------|--------|
| On a constructor | That constructor is used for injection (needed only when there are several) |
| On a setter/method | Called after construction with resolved arguments |
| On a field | Field set by reflection |
| `required = false` | Skip injection if no bean exists (field/setter keeps its value) |

Alternatives to `required = false` for optional dependencies: `Optional<T>`, `ObjectProvider<T>` (`getIfAvailable()`), or a `@Nullable` parameter.

`@Autowired` is ignored on **static** fields (Spring logs a message) and cannot inject into objects created with `new`. Jakarta's `@Inject` (JSR-330) works the same way where the library is present.

## Comparison

| | Constructor | Setter | Field |
|--|-------------|--------|-------|
| `final` fields / immutability | Yes | No | No |
| Object valid right after `new` | Yes | Only after setters | No |
| Dependencies visible in the API | Yes (signature) | Partly | No |
| Unit test without Spring | `new Service(fakeRepo)` | Call setters | Needs reflection or a container |
| Optional dependencies | `Optional`/`ObjectProvider` parameter | Natural fit | `required = false` |
| Circular dependency | Fails fast at startup | Possible (if allowed) | Possible (if allowed) |
| Too many dependencies | Obvious (long constructor) — a design smell you notice | Hidden | Hidden |
| Recommended for | **Required dependencies (default)** | Optional/reconfigurable | Tests, legacy code |

## Why Constructor Injection Is Preferred

1. **Immutability and thread safety** — dependencies can be `final`, which matters because singletons are shared across threads.
2. **No half-initialised objects** — the object cannot exist without its required collaborators; no `NullPointerException` from a forgotten injection.
3. **Framework-independent tests** — `new OrderService(fakeRepository, fakeGateway)`; no Spring context, no Mockito reflection tricks.
4. **Explicit dependencies** — the constructor documents what the class needs; eight parameters reveal an SRP violation that eight hidden fields would hide.
5. **Early cycle detection** — constructor cycles cannot be resolved and fail at startup, instead of creating partially initialised beans.

The Spring team's documentation recommends constructor injection for mandatory dependencies and setter injection for optional ones.

## Internal Behavior

- Constructor injection happens during **instantiation** (`ConstructorResolver.autowireConstructor`).
- Setter and field injection happen in the **populate** phase, via `AutowiredAnnotationBeanPostProcessor.postProcessProperties`, after the object exists.
- This ordering is why field-injected values are `null` inside the constructor, and why circular references between field-injected beans can be resolved (an early reference to the half-built object can be handed out) while constructor cycles cannot.

## Common Mistakes

- Using field-injected dependencies inside the constructor (`null`).
- Mixing styles in one class without reason.
- Adding `@Autowired` to the only constructor "to be safe" — harmless, but shows a misunderstanding.
- Two constructors and no `@Autowired`: Spring picks the no-arg one (leaving fields null) or fails with "No default constructor found".

## Common Interview Traps

- **"Field injection is wrong because it is slower."** Performance is not the reason; testability, immutability and visibility are.
- **"`@Autowired` is required for constructor injection."** Not for a single constructor.
- **"Setter injection is never appropriate."** It is the right choice for optional dependencies with defaults.

## Key Takeaways

- Default to constructor injection with `final` fields; no `@Autowired` for a single constructor.
- Setter injection for optional dependencies; field injection mainly in tests.
- Constructor injection = immutable, complete, testable, explicit, cycle-detecting.
