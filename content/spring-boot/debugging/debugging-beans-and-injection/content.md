# Debugging Beans and Dependency Injection

**Module:** Debugging and Internal Behavior · **Interview priority:** Core

## How to Use This Topic

Each scenario follows the same structure: **Problem → Possible Causes → How to Diagnose → Fix → Prevention → Interview Explanation**. The explanations link back to the lessons that teach the underlying mechanism — [Spring Beans](../../fundamentals/spring-beans/content.md), [Component Scanning](../../fundamentals/component-scanning-and-stereotypes/content.md), [@Autowired, @Qualifier and @Primary](../../dependency-injection/autowiring-and-bean-resolution/content.md), [Circular Dependencies](../../dependency-injection/circular-dependencies/content.md).

## Why Is @Autowired Null?

### Problem

`NullPointerException` because a field annotated `@Autowired` is `null` at runtime.

### Possible Causes

1. The object was created with **`new`** — the container never injected it.
2. The field is used inside the **constructor** (field injection happens after construction).
3. The field is **static** (`@Autowired` ignores static fields).
4. The class is not a bean (no stereotype, outside component scan), or the object was created by another framework (JPA entity, Jackson-deserialised DTO, a thread/`Runnable` built by hand).
5. You are reading a **field of a CGLIB proxy** directly instead of calling a method on it.

### How to Diagnose

- Search for `new ThatClass(` in the code base.
- Check whether the failing line runs in the constructor or a static context.
- Log `AopUtils.isAopProxy(this)` / check if the object came from the context (`context.getBean`).
- Check the class's package against the main class's package.

### Fix

Use **constructor injection** with `final` fields and obtain the object from the container (inject it). Move constructor logic to `@PostConstruct` or an `ApplicationRunner`. For objects that cannot be beans (entities), pass dependencies as method arguments instead of injecting.

### Prevention

Constructor injection makes "half-built" objects impossible and turns missing beans into startup failures; code review for `new` on service classes; avoid static access to beans.

### Interview Explanation

"Injection is done by the container while it creates beans. A field stays null when the object was not created by Spring — usually someone used `new` — or when the field is accessed before injection, e.g. in the constructor, or it is static. I prefer constructor injection so an object can't exist without its dependencies."

## Why Is a Bean Not Detected?

### Problem

Startup fails with `NoSuchBeanDefinitionException` / "Parameter 0 of constructor in X required a bean of type 'Y' that could not be found."

### Possible Causes

1. `Y`'s class is **outside the scanned packages** (sibling of the main class's package).
2. Missing stereotype annotation, or the annotation is on the **interface** instead of the implementation.
3. A **condition** excludes it: `@Profile` not active, `@ConditionalOnProperty` false, `@ConditionalOnClass` missing dependency.
4. The bean comes from an auto-configuration that **backed off** or is excluded.
5. Spring Data repositories/entities outside the auto-configuration package.
6. A third-party class that needs an explicit `@Bean`.

### How to Diagnose

- Read the failure analysis (it names the missing type and the injection point).
- Run with `--debug` to see the **condition evaluation report** (negative matches explain skipped beans).
- `/actuator/beans` (if the app starts) or `context.getBeanNamesForType(Y.class)` in a test.
- Check active profiles in the startup log.

### Fix

Move the main class to the root package or set `scanBasePackages`; annotate the implementation; activate the profile or set the property; add the missing dependency; declare a `@Bean`; use `@EntityScan`/`@EnableJpaRepositories` for other packages.

### Prevention

Package-by-feature under one root package; integration test that starts the context (`@SpringBootTest`) in CI for every profile used in production.

### Interview Explanation

"Spring only knows beans it scanned, imported or created via `@Bean`/auto-configuration, and conditions can skip them. I check the package against the main class, the stereotype, the active profile and the condition report from `--debug`."

## Why Does Spring Create Multiple Beans?

### Problem

`NoUniqueBeanDefinitionException: expected single matching bean but found 2`, or unexpected multiple instances (two connection pools, a "singleton" constructor running twice, state not shared).

### Possible Causes

1. Two implementations of the same interface (legitimate) without `@Primary`/`@Qualifier`.
2. The same class **scanned and** returned from a differently named `@Bean` method.
3. A library auto-configures a bean of the same type as yours (and yours does not replace it because the types differ).
4. **Lite-mode `@Bean` methods** (`@Component` or `proxyBeanMethods = false`) calling each other directly → new instances each call.
5. **Prototype** scope (new instance per injection) or a scoped proxy creating instances per request.
6. **Two application contexts** (e.g. code calling `new AnnotationConfigApplicationContext(...)`, or a test context plus the app context).

### How to Diagnose

- The exception lists the candidate bean names — search for where each is defined.
- Log in the constructor with the bean name (`BeanNameAware`) and the identity hash code.
- Check `@Scope` and whether `@Bean` methods call other `@Bean` methods in lite mode.
- Search for manual context creation.

### Fix

Choose one definition; mark the default `@Primary` and qualify the others; pass dependencies as `@Bean` method parameters instead of calling methods; use `@Configuration` (full mode) where inter-bean calls are needed; remove manually created contexts.

### Prevention

Prefer explicit `@Qualifier`s for multiple implementations; keep one bean definition per class; inject dependencies via parameters in configuration classes.

### Interview Explanation

"Either there really are several beans of a type — then I use `@Primary`, `@Qualifier` or inject a `List` — or something creates extra instances: duplicate definitions, lite-mode `@Bean` calls, prototype scope, or a second application context."

## Why Does Circular Dependency Happen?

### Problem

"The dependencies of some of the beans in the application context form a cycle" / `BeanCurrentlyInCreationException`.

### Possible Causes

1. Two services that call each other (A → B → A), often after adding "just one more" dependency.
2. Longer cycles (A → B → C → A) through helper classes.
3. Self-injection to work around self-invocation.
4. Since Boot 2.6, even field/setter cycles fail (`spring.main.allow-circular-references=false`).

### How to Diagnose

The failure analysis prints the cycle diagram with bean names and classes; follow the arrows and ask which dependency is "against the grain" of your layering.

### Fix

Redesign: move the shared logic into a third bean, make one service the orchestrator, or replace the back-call with an **application event**. As a last resort, `@Lazy` on one injection point or `ObjectProvider`.

### Prevention

Clear layering (controllers → services → repositories), dependencies pointing one way between modules, architecture tests (ArchUnit) forbidding cycles.

### Interview Explanation

"A cycle means two beans need each other to be constructed. With constructor injection it can never be resolved, and Boot rejects all cycles by default. It's a design smell — I break it by extracting a shared component or using events, not by switching to field injection."

## Key Takeaways

- Null `@Autowired` → object not created by Spring, used too early, static, or field read on a proxy.
- Bean not found → scanning boundaries, stereotypes, profiles/conditions; read the condition report.
- Multiple beans → duplicate definitions, lite-mode calls, prototype scope, extra contexts; resolve with `@Primary`/`@Qualifier`.
- Cycles → redesign (extract, orchestrate, events); `@Lazy` only as a last resort.
