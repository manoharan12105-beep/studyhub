# Spring Beans and Bean Creation

**Module:** Spring Framework Fundamentals · **Interview priority:** Core

## Definition

A **Spring bean** is an object that is instantiated, assembled and managed by the Spring container. Being a Java object is not enough: an object is a bean only if the container created it from a **bean definition** (or it was explicitly registered as a singleton). Each bean has a **name** (id), a **type**, a **scope** and optional lifecycle callbacks.

## Why It Matters

- Only beans receive dependency injection, lifecycle callbacks and proxies (`@Transactional`, `@Async`, `@Cacheable`, `@PreAuthorize`). An object created with `new` gets none of these.
- "How many ways can you define a bean?" and "What is the default bean name?" are common screening questions.
- Bean naming explains errors such as `NoUniqueBeanDefinitionException` and `BeanDefinitionOverrideException`.

## Spring Bean

| Property | Meaning | Default |
|----------|---------|---------|
| Name | Identifier in the container | Class name with first letter lower-cased (`orderService`), or the `@Bean` method name |
| Type | Class (or the proxy's type) used for injection by type | The declared class / `@Bean` return type |
| Scope | How many instances exist | `singleton` (one per container) |
| Lazy | Created at startup or on first use | Eager for singletons |
| Primary | Preferred candidate when several match | `false` |
| Init / destroy callbacks | Methods run after creation / before destruction | None |

Default naming details:

- `OrderService` → `orderService`.
- If the first **two** characters are upper case, the name is unchanged: `URLParser` → `URLParser` (JavaBeans `Introspector.decapitalize` rule).
- `@Component("pricing")` or `@Bean("pricing")` sets an explicit name; `@Bean({"a", "b"})` declares aliases.

## Bean Creation

There are four common ways to define a bean.

### 1. Component scanning with stereotype annotations

```java
import org.springframework.stereotype.Service;

@Service                     // detected by @ComponentScan; bean name "invoiceService"
public class InvoiceService {
}
```

Use for **your own classes**. Details in [Component Scanning and Stereotypes](../component-scanning-and-stereotypes/content.md).

### 2. `@Bean` methods in a `@Configuration` class

```java
import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TimeConfig {

    @Bean                    // bean name "clock", type Clock
    public Clock clock() {
        return Clock.systemUTC();
    }
}
```

Use for **third-party classes** you cannot annotate, or when construction needs logic. Details in [@Configuration and @Bean](../configuration-and-bean-methods/content.md).

### 3. Auto-configuration (Spring Boot)

Spring Boot's auto-configuration classes are themselves `@Configuration` classes with `@Bean` methods guarded by conditions — this is how a `DataSource`, `ObjectMapper` or `DispatcherServlet` appears without you writing it. See [Auto-Configuration](../../spring-boot-core/auto-configuration/content.md).

### 4. Programmatic registration

```java
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

public class ProgrammaticRegistration {

    static class AuditLog {
        String write(String event) {
            return "audit:" + event;
        }
    }

    public static void main(String[] args) {
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
        context.registerBean(AuditLog.class);            // name derived from the class
        context.refresh();
        System.out.println(context.getBean(AuditLog.class).write("login"));
        System.out.println(String.join(",", context.getBeanNamesForType(AuditLog.class)));
        context.close();
    }
}
```

**Output:**

```text
audit:login
programmaticRegistration.AuditLog
```

The generated name for a nested class includes the outer class — another reason to rely on injection by type rather than names.

XML (`<bean id="..." class="..."/>`) is the legacy fourth style; you may meet it in old projects.

## How It Works

Every bean, regardless of how it was declared, follows the same pipeline:

1. **Definition** — the container registers a `BeanDefinition` (class or factory method, scope, dependencies).
2. **Instantiation** — the constructor (or `@Bean` factory method) is called; constructor dependencies are resolved first, recursively.
3. **Population** — setter and field injection (`@Autowired`, `@Value`).
4. **Initialisation** — Aware callbacks, `BeanPostProcessor`s, `@PostConstruct`, init methods.
5. **Proxying** — post-processors may replace the bean with a proxy (transactions, AOP).
6. **Use** — the bean (or its proxy) is stored in the singleton cache and injected into others.
7. **Destruction** — on context close, `@PreDestroy` and destroy methods for singletons.

The detailed order is in [Bean Lifecycle](../spring-bean-lifecycle/content.md).

## Internal Behavior

- Dependencies are resolved **depth-first**: creating `OrderService` triggers creation of `OrderRepository` first.
- The singleton cache maps names to fully initialised beans. While a bean is being created, Spring tracks it as "currently in creation" — this is how it detects [circular dependencies](../../dependency-injection/circular-dependencies/content.md).
- What gets injected may be a **proxy**, not your class: `orderService.getClass()` can print `OrderService$$SpringCGLIB$$0`.
- Spring Boot disables bean definition overriding by default (`spring.main.allow-bean-definition-overriding=false`): two `@Bean` methods with the same name fail startup with `BeanDefinitionOverrideException` instead of one silently replacing the other. (One deliberate exception: a `@Bean` method may replace a *scanned* component of the same name.)

## Comparison

| | `@Component` (scanning) | `@Bean` method |
|--|------------------------|----------------|
| Declared on | The class itself | A method in a configuration class |
| Works for third-party classes | No (cannot annotate them) | Yes |
| Construction logic | Constructor only | Any Java code |
| Multiple beans of one class | Awkward | Easy (two methods) |
| Conditional creation | `@Profile`, `@Conditional…` on the class | Same, per method |

## Common Mistakes

- Creating a bean's class with `new` in another bean — that instance has no injection and no proxy.
- Expecting `@Autowired` to work in a class that is not a bean (no stereotype, not returned from a `@Bean` method).
- Defining the same class twice (scanned **and** returned from a differently named `@Bean` method), which creates two beans of one type and breaks injection by type.

## Common Interview Traps

- **"Any object in a Spring application is a bean."** Only container-managed objects are beans. DTOs and entities are ordinary objects.
- **"Singleton bean means a Java singleton."** It means one instance per bean definition per container; you can have two singleton beans of the same class.
- **"`@Bean` can be used on a class."** `@Bean` is a method-level annotation; class-level registration uses `@Component` and its stereotypes.

## Key Takeaways

- Bean = object created and managed by the container from a bean definition.
- Define beans by component scanning (your classes), `@Bean` methods (third-party or logic), auto-configuration (Boot) or programmatic registration.
- Default name: decapitalised class name or the `@Bean` method name.
- Only beans get injection, callbacks and proxies.
