# Bean Lifecycle

**Module:** Spring Framework Fundamentals · **Interview priority:** Core

## Definition

The **bean lifecycle** is the sequence of steps the container performs for a bean: instantiate it, inject its dependencies, run awareness and initialisation callbacks, let `BeanPostProcessor`s inspect or replace it (this is where proxies appear), hand it out for use, and — for singletons — run destruction callbacks when the context closes.

## Why It Matters

- "Explain the bean lifecycle" is one of the most frequent Spring interview questions.
- It explains practical rules: why a field injected by `@Autowired` is still `null` inside the constructor, where to put start-up logic (`@PostConstruct`), and why `@PreDestroy` never runs for prototype beans.
- It explains **where proxies come from**: `postProcessAfterInitialization` is the hook that wraps beans for `@Transactional`, `@Async` and AOP.

## Bean Lifecycle

```text
 ┌─────────────────────────────── container startup (refresh) ───────────────────────────────┐
 │ 1. Instantiate              constructor / @Bean factory method (constructor injection here) │
 │ 2. Populate properties      @Autowired fields and setters, @Value                            │
 │ 3. Aware callbacks          BeanNameAware → BeanClassLoaderAware → BeanFactoryAware          │
 │                             (ApplicationContextAware & co. via a post-processor)             │
 │ 4. BPP before-init          BeanPostProcessor.postProcessBeforeInitialization                │
 │ 5. @PostConstruct           (executed by CommonAnnotationBeanPostProcessor)                  │
 │ 6. afterPropertiesSet()     InitializingBean                                                 │
 │ 7. Custom init method       @Bean(initMethod = "...")                                        │
 │ 8. BPP after-init           BeanPostProcessor.postProcessAfterInitialization → may PROXY     │
 └──────────────────────────────────────────────────────────────────────────────────────────────┘
   9. Ready — stored in the singleton cache, injected, used
 ┌─────────────────────────────── context close (singletons only) ────────────────────────────┐
 │ 10. @PreDestroy  →  11. DisposableBean.destroy()  →  12. Custom destroy method             │
 └──────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Initialisation callbacks: which to use

| Mechanism | Coupling to Spring | Use when |
|-----------|-------------------|----------|
| `@PostConstruct` (`jakarta.annotation`) | None (Jakarta annotation) | Your own classes — the normal choice |
| `InitializingBean.afterPropertiesSet()` | Implements a Spring interface | Framework/library code |
| `@Bean(initMethod = "start")` | None in the class | Third-party classes you cannot annotate |

Destruction mirrors this: `@PreDestroy`, `DisposableBean.destroy()`, `@Bean(destroyMethod = "close")`. For `@Bean` methods, Spring infers a public `close()` or `shutdown()` method automatically (`destroyMethod` defaults to "inferred"), which is how connection pools and clients are closed without any configuration.

## How It Works

The program below implements every callback and prints the order.

```java
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.BeanNameAware;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

public class BeanLifecycleDemo {

    static class CacheWarmer implements BeanNameAware, ApplicationContextAware, InitializingBean, DisposableBean {

        CacheWarmer() {
            System.out.println("1. constructor");
        }

        @Override
        public void setBeanName(String name) {
            System.out.println("2. BeanNameAware.setBeanName(" + name + ")");
        }

        @Override
        public void setApplicationContext(ApplicationContext context) {
            System.out.println("3. ApplicationContextAware.setApplicationContext");
        }

        @PostConstruct
        void postConstruct() {
            System.out.println("5. @PostConstruct");
        }

        @Override
        public void afterPropertiesSet() {
            System.out.println("6. InitializingBean.afterPropertiesSet");
        }

        void customInit() {
            System.out.println("7. custom init method");
        }

        @PreDestroy
        void preDestroy() {
            System.out.println("9. @PreDestroy");
        }

        @Override
        public void destroy() {
            System.out.println("10. DisposableBean.destroy");
        }

        void customDestroy() {
            System.out.println("11. custom destroy method");
        }
    }

    static class LoggingPostProcessor implements BeanPostProcessor {

        @Override
        public Object postProcessBeforeInitialization(Object bean, String beanName) {
            if (bean instanceof CacheWarmer) {
                System.out.println("4. BeanPostProcessor.before");
            }
            return bean;
        }

        @Override
        public Object postProcessAfterInitialization(Object bean, String beanName) {
            if (bean instanceof CacheWarmer) {
                System.out.println("8. BeanPostProcessor.after (proxies are created here)");
            }
            return bean;
        }
    }

    @Configuration
    static class AppConfig {

        @Bean
        static LoggingPostProcessor loggingPostProcessor() {   // static: post-processors must exist before other beans
            return new LoggingPostProcessor();
        }

        @Bean(initMethod = "customInit", destroyMethod = "customDestroy")
        CacheWarmer cacheWarmer() {
            return new CacheWarmer();
        }
    }

    public static void main(String[] args) {
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
        System.out.println("-- bean in use --");
        context.close();
    }
}
```

**Output:**

```text
1. constructor
2. BeanNameAware.setBeanName(cacheWarmer)
3. ApplicationContextAware.setApplicationContext
4. BeanPostProcessor.before
5. @PostConstruct
6. InitializingBean.afterPropertiesSet
7. custom init method
8. BeanPostProcessor.after (proxies are created here)
-- bean in use --
9. @PreDestroy
10. DisposableBean.destroy
11. custom destroy method
```

> [!NOTE]
> `@PostConstruct` is itself implemented by a `BeanPostProcessor` (`CommonAnnotationBeanPostProcessor`). Spring registers its internal annotation processors last in the before-initialisation chain, which is why a custom `BeanPostProcessor`'s *before* hook runs ahead of `@PostConstruct`.

## Internal Behavior

- **Constructor vs `@PostConstruct`:** inside the constructor, field-injected and setter-injected dependencies are still `null`; they are populated in step 2. Constructor-injected dependencies are available immediately. Code that needs everything injected belongs in `@PostConstruct`.
- **Proxies:** if the bean needs a proxy (transactions, AOP, `@Async`), `postProcessAfterInitialization` returns the proxy, and **the proxy** is what gets cached and injected. `@PostConstruct` runs on the raw object — so a `@Transactional` method called from `@PostConstruct` runs without a transaction.
- **`BeanPostProcessor`s are beans too**, created before ordinary beans. Declare `@Bean` methods for them as `static` so the configuration class itself is not created too early.
- **Prototype beans:** Spring runs initialisation callbacks but **never** destruction callbacks — the container hands the object over and forgets it. The caller must clean up.
- **Shutdown:** in Spring Boot, a JVM shutdown hook closes the context on normal termination and `SIGTERM`, so `@PreDestroy` runs. It does not run on `kill -9` or a JVM crash.
- **After all singletons exist:** `SmartInitializingSingleton.afterSingletonsInstantiated()` runs once every singleton is created; `ContextRefreshedEvent` and Boot's `ApplicationReadyEvent` come later. Use `ApplicationReadyEvent` (or an `ApplicationRunner`) for work that should start only when the application is fully up.

## Comparison

| | `@PostConstruct` | Constructor | `ApplicationRunner` / `ApplicationReadyEvent` |
|--|------------------|-------------|-----------------------------------------------|
| Dependencies available | All injected | Constructor-injected only | All beans |
| Proxies active on `this` | No | No | Yes (when you call other beans) |
| Runs | Once per bean, during creation | Once per bean | Once, after the whole context is ready |
| Good for | Validating config, building internal caches | Assigning final fields | Warming caches via other services, starting consumers |

## Common Mistakes

- Using field-injected dependencies inside the constructor → `NullPointerException`.
- Long-running or remote calls inside `@PostConstruct` — they block startup and failures stop the application.
- Relying on `@PreDestroy` of a prototype bean to release resources.
- Calling a `@Transactional` method of the same bean from `@PostConstruct` and expecting a transaction.

## Common Interview Traps

- **"`BeanPostProcessor` runs once."** It runs for **every** bean the container creates, before and after each bean's initialisation.
- **"`@PostConstruct` runs before injection."** It runs after all injection is complete — that is its purpose.
- **"Destroy callbacks run for all beans."** Only for singletons (and other container-managed scopes such as request/session at the end of the scope); never for prototypes.

## Key Takeaways

- Order: constructor → inject → Aware → BPP before → `@PostConstruct` → `afterPropertiesSet` → init method → BPP after (proxy) → ready → `@PreDestroy` → `destroy` → destroy method.
- Use `@PostConstruct`/`@PreDestroy` in your classes; `initMethod`/`destroyMethod` for third-party ones.
- Proxies are created in `postProcessAfterInitialization`; the proxy is what other beans receive.
- Prototype beans get no destroy callbacks.
