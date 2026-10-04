# Component Scanning and Stereotype Annotations

**Module:** Spring Framework Fundamentals · **Interview priority:** Core

## Definition

**Component scanning** is the container searching packages on the classpath for classes annotated with `@Component` (directly or through a meta-annotation) and registering a bean definition for each. **Stereotype annotations** — `@Component`, `@Service`, `@Repository`, `@Controller` and `@RestController` — mark a class as a component and state its architectural role.

## Why It Matters

- It is how almost all of your own classes become beans in a Spring Boot application.
- "Difference between `@Component`, `@Service` and `@Repository`" is asked in nearly every Spring interview — and the honest answer includes the one real behavioural difference (`@Repository` exception translation).
- Most "bean not found" startup errors are scanning problems: the class sits outside the scanned packages.

## Component Scanning

`@ComponentScan` on a `@Configuration` class enables scanning. Without explicit `basePackages`, it scans the **package of the annotated class and all sub-packages**.

```java
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@ComponentScan(basePackages = "com.example.shop")      // default: this class's package
public class AppConfig {
}
```

In Spring Boot, `@SpringBootApplication` includes `@ComponentScan`, so the **main class's package** is the root:

```text
com.example.shop                     ← ShopApplication (@SpringBootApplication)
├── order/OrderService               ✔ scanned
├── order/web/OrderController        ✔ scanned
└── ...
com.example.common/AuditService      ✘ NOT scanned (sibling package, not a sub-package)
```

Put the main class in the top-level package of your application. To include another package, add `scanBasePackages` to `@SpringBootApplication`, or define the bean with `@Bean`/`@Import`.

Scanning can be filtered:

```java
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.FilterType;
import org.springframework.stereotype.Controller;

@Configuration
@ComponentScan(
        basePackages = "com.example.shop",
        excludeFilters = @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = Controller.class))
public class ServiceLayerConfig {
}
```

## Stereotype Annotations

### @Component

The generic stereotype: "this class is a Spring-managed component". Use it for classes that are not a service, repository or controller — for example a scheduler, a mapper or a JWT utility.

### @Service

A `@Component` for the **business/service layer**. It adds no behaviour today; it documents intent and gives a pointcut target (for example, an aspect applied to all `@Service` classes).

### @Repository

A `@Component` for the **persistence layer** with one real extra: **persistence exception translation**. A `PersistenceExceptionTranslationPostProcessor` (auto-configured in Spring Boot) wraps `@Repository` beans in a proxy that converts technology-specific exceptions (`SQLException`, Hibernate/JPA exceptions) into Spring's unchecked `DataAccessException` hierarchy (`DuplicateKeyException`, `DataIntegrityViolationException`, …).

Spring Data repository interfaces (`interface OrderRepository extends JpaRepository<…>`) do **not** need `@Repository`; Spring Data creates the implementation and applies translation itself.

### @Controller

A `@Component` for the **web layer** (Spring MVC). `RequestMappingHandlerMapping` registers its `@RequestMapping` methods as handlers. Return values are treated as **view names** unless the method has `@ResponseBody`.

### @RestController

`@Controller` + `@ResponseBody` on the class: every handler method's return value is written to the response body (usually as JSON through an `HttpMessageConverter`). This is what REST APIs use.

```java
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController                         // = @Controller + @ResponseBody
public class HealthController {

    @GetMapping("/ping")
    public String ping() {
        return "pong";                  // written as the response body, not resolved as a view
    }
}
```

## How It Works

1. During context refresh, `ConfigurationClassPostProcessor` (a `BeanFactoryPostProcessor`) processes `@ComponentScan`.
2. `ClassPathBeanDefinitionScanner` reads `.class` files in the packages **using ASM metadata** — it does not load the classes yet.
3. Classes whose annotations (including meta-annotations) include `@Component` and pass the filters become bean definitions named by the `AnnotationBeanNameGenerator`.
4. Later, the beans are instantiated like any other bean.

Because detection uses meta-annotations, you can create your own stereotype:

```java
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.stereotype.Component;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Component                               // meta-annotation: classes with @UseCase are scanned
public @interface UseCase {
}
```

`@Service`, `@Repository`, `@Controller` and `@Configuration` are themselves meta-annotated with `@Component` in exactly this way.

## Comparison

| Annotation | Layer | Meta-annotated with | Extra behaviour |
|------------|-------|---------------------|-----------------|
| `@Component` | Any | — | None |
| `@Service` | Business logic | `@Component` | None (semantic) |
| `@Repository` | Persistence | `@Component` | Exception translation to `DataAccessException` |
| `@Controller` | Web (MVC) | `@Component` | Handler methods registered; returns view names |
| `@RestController` | Web (REST) | `@Controller`, `@ResponseBody` | Return values written to the body |
| `@Configuration` | Configuration | `@Component` | `@Bean` methods; CGLIB proxy for inter-bean calls |

## Common Mistakes

- Main class in a sub-package (`com.example.shop.app`) so that `com.example.shop.order` is not scanned.
- Annotating an **interface** with `@Service` — interfaces are not instantiated; annotate the implementation.
- Using `@Controller` for a REST endpoint and forgetting `@ResponseBody` → Spring looks for a view named after the returned string (error page or 404/500).
- Annotating Spring Data repository interfaces with `@Repository` and assuming it changes anything (harmless, but redundant).

## Common Interview Traps

- **"@Service, @Repository and @Component are completely identical."** `@Service` and `@Component` are, but `@Repository` enables exception translation, and stereotypes act as pointcut targets.
- **"@RestController is a different kind of controller."** It is `@Controller` plus `@ResponseBody`; the same `DispatcherServlet` pipeline handles both.
- **"Component scanning scans the whole classpath."** Only the configured base packages and their sub-packages.

## Key Takeaways

- Scanning = find `@Component` (and meta-annotated) classes under base packages → bean definitions.
- Boot scans from the main class's package downward.
- `@Service` is semantic; `@Repository` translates persistence exceptions; `@RestController` = `@Controller` + `@ResponseBody`.
