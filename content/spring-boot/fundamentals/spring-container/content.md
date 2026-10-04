# Spring Container: BeanFactory and ApplicationContext

**Module:** Spring Framework Fundamentals · **Interview priority:** Core

## Definition

The **Spring container** is the object that reads bean definitions (from annotations, `@Bean` methods or XML), creates the beans, injects their dependencies and manages their lifecycle. Spring has two container interfaces:

- **`BeanFactory`** — the basic container: create beans on request and inject dependencies.
- **`ApplicationContext`** — a `BeanFactory` plus enterprise features: eager singleton creation, automatic registration of post-processors, events, internationalisation, resource loading and the `Environment`. Every real application, including every Spring Boot application, uses an `ApplicationContext`.

## Why It Matters

- "BeanFactory vs ApplicationContext" is a standard interview comparison.
- Knowing that the context creates singletons **at startup** explains why configuration errors fail fast (the app does not start) rather than on the first request.
- Knowing that the context **registers `BeanPostProcessor`s automatically** explains how `@Autowired`, `@PostConstruct`, `@Transactional` and AOP work without you registering anything.

## Spring Container

The container works in two phases:

```text
1. Read configuration           2. Create the object graph
   ─────────────────────           ─────────────────────────
   @ComponentScan classes  ──►     BeanDefinition registry  ──►  instantiate → inject → initialise → (proxy)
   @Bean methods                   (class, scope, deps,          ready beans stored in the singleton cache
   auto-configuration              lazy?, init/destroy)
```

A **`BeanDefinition`** is the recipe for a bean: its class or factory method, scope, constructor arguments, whether it is lazy, and its init/destroy methods. The container first collects all definitions, lets `BeanFactoryPostProcessor`s modify them (for example, resolving `${...}` placeholders), and only then creates objects.

## BeanFactory

`BeanFactory` is the root interface. Its key methods are `getBean(name)`, `getBean(Class)`, `containsBean`, `isSingleton` and `isPrototype`. The standard implementation is `DefaultListableBeanFactory` — which is also what an `ApplicationContext` uses internally.

Characteristics of a bare `BeanFactory`:

- Creates a singleton **lazily**, on the first `getBean` call.
- Does **not** automatically detect `BeanPostProcessor`s or `BeanFactoryPostProcessor`s — you must register them by hand, so annotations such as `@Autowired` or `@PostConstruct` are ignored unless you do.
- No events, no `MessageSource`, no `Environment` profiles integration.

## ApplicationContext

`ApplicationContext` extends `BeanFactory` (through `ListableBeanFactory` and `HierarchicalBeanFactory`) and also implements:

| Interface | Feature |
|-----------|---------|
| `ApplicationEventPublisher` | Publish events to `@EventListener` methods |
| `MessageSource` | Internationalised messages (`messages.properties`) |
| `ResourcePatternResolver` | Load `classpath:` / `file:` resources |
| `EnvironmentCapable` | Profiles and property sources (`Environment`) |

On `refresh()`, an `ApplicationContext`:

1. Loads bean definitions (component scan, `@Configuration` classes, auto-configuration).
2. Runs `BeanFactoryPostProcessor`s (e.g. `ConfigurationClassPostProcessor`, placeholder resolution).
3. Detects and registers all `BeanPostProcessor`s.
4. Initialises the `MessageSource` and the event multicaster.
5. Calls `onRefresh()` — in a Spring Boot web application this is where the **embedded web server** is created.
6. **Pre-instantiates all non-lazy singletons.**
7. Publishes `ContextRefreshedEvent`.

Common implementations:

| Implementation | Used for |
|----------------|----------|
| `AnnotationConfigApplicationContext` | Standalone apps and tests with `@Configuration` classes |
| `AnnotationConfigServletWebServerApplicationContext` | Spring Boot servlet (Spring MVC) apps — created by `SpringApplication` |
| `GenericWebApplicationContext`, `XmlWebApplicationContext` | Classic WAR deployments |

## How It Works

The demo below registers the same class in a bare `BeanFactory` and in an `ApplicationContext` and shows **when** the constructor runs.

```java
import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.beans.factory.support.RootBeanDefinition;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

public class ContainerComparison {

    static class ReportService {
        ReportService() {
            System.out.println("  ReportService constructor called");
        }
    }

    public static void main(String[] args) {
        System.out.println("BeanFactory:");
        DefaultListableBeanFactory factory = new DefaultListableBeanFactory();
        factory.registerBeanDefinition("reportService", new RootBeanDefinition(ReportService.class));
        System.out.println("  definition registered");
        factory.getBean("reportService");                 // created only now
        System.out.println("  after getBean");

        System.out.println("ApplicationContext:");
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
        context.registerBean("reportService", ReportService.class);
        System.out.println("  definition registered");
        context.refresh();                                // singletons created during refresh
        System.out.println("  after refresh");
        context.getBean("reportService");                 // returns the cached instance
        System.out.println("  after getBean");
        context.close();
    }
}
```

**Output:**

```text
BeanFactory:
  definition registered
  ReportService constructor called
  after getBean
ApplicationContext:
  definition registered
  ReportService constructor called
  after refresh
  after getBean
```

## Internal Behavior

- An `ApplicationContext` **delegates** bean creation to an internal `DefaultListableBeanFactory`; it does not re-implement the factory.
- Singletons are kept in a **singleton cache** (a map from bean name to instance). `getBean` on a singleton returns the cached object.
- Eager creation is a deliberate design choice: a missing dependency, a bad property or a circular constructor dependency causes `refresh()` to fail, so the application never starts in a broken state.
- A bean can opt out with `@Lazy`, and Spring Boot can make all beans lazy with `spring.main.lazy-initialization=true` (faster startup, but errors surface on first use).
- Contexts can form a **hierarchy** (parent/child). Beans in a child can see the parent's beans, not the reverse. Classic Spring MVC used a root context plus a servlet context; Spring Boot normally uses one context.

## Comparison

| Aspect | `BeanFactory` | `ApplicationContext` |
|--------|---------------|----------------------|
| Singleton creation | Lazy (on `getBean`) | Eager (at `refresh()`), unless `@Lazy` |
| `BeanPostProcessor` / `BeanFactoryPostProcessor` registration | Manual | Automatic |
| Annotation processing (`@Autowired`, `@PostConstruct`) | Only if the processors are registered manually | Out of the box |
| Events (`ApplicationEvent`) | No | Yes |
| i18n (`MessageSource`) | No | Yes |
| `Environment`, profiles, resource loading | Basic / manual | Yes |
| Startup error detection | On first use | At startup |
| Typical use | Framework internals, extremely constrained environments | Every application |

## Common Mistakes

- Calling `context.getBean(...)` throughout business code — this is the **service locator** anti-pattern; inject dependencies instead.
- Creating a second `ApplicationContext` (for example inside a bean) to "get" a bean — this builds a second, separate set of singletons.
- Expecting `@Autowired` to work on an object created with `new` — the container never saw it.

## Common Interview Traps

- **"BeanFactory is lazy, so it is better for performance."** Lazy creation only moves the cost and hides configuration errors until runtime. Applications use `ApplicationContext`.
- **"ApplicationContext and BeanFactory are separate containers."** `ApplicationContext` *is a* `BeanFactory` and wraps a `DefaultListableBeanFactory` internally.
- **"All beans are created eagerly."** Only non-lazy **singletons**. Prototype beans are created on every request, and `@Lazy` beans on first use.

## Key Takeaways

- Container = bean definitions → instantiation → injection → initialisation → ready object graph.
- `ApplicationContext` = `BeanFactory` + eager singletons + automatic post-processors + events + i18n + `Environment`.
- Eager creation is why a misconfigured Spring Boot application fails at startup, not on the first request.
