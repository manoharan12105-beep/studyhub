# @Configuration and @Bean

**Module:** Spring Framework Fundamentals · **Interview priority:** Core

## Definition

- **`@Configuration`** marks a class as a source of bean definitions. It is itself a `@Component`, so it is found by scanning.
- **`@Bean`** marks a method whose return value is registered as a bean. The method name is the bean name and the return type is the bean type. Method parameters are dependencies, resolved from the container.

## Why It Matters

- `@Bean` is how you register objects whose classes you do not own: `PasswordEncoder`, `SecurityFilterChain`, `RestClient`, `Clock`, `ObjectMapper` customisations.
- Spring Boot's auto-configuration is nothing more than `@Configuration` classes with conditional `@Bean` methods — understanding this demystifies Boot.
- "Why does `@Configuration` use a CGLIB proxy?" and "What is `proxyBeanMethods = false`?" are common follow-up questions.

## @Configuration

```java
import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class SecurityBeans {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
```

Related annotations:

| Annotation | Purpose |
|------------|---------|
| `@Import(OtherConfig.class)` | Pull in another configuration class explicitly |
| `@PropertySource("classpath:x.properties")` | Add a properties file to the `Environment` (Boot already loads `application.*`) |
| `@Profile("prod")` | Register the class's beans only when the profile is active |
| `@Conditional…` | Register only when a condition holds (heavily used by Boot) |

## @Bean

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Scope;

@Configuration
public class NotificationConfig {

    interface Notifier {
        void send(String to, String text);
    }

    record SmtpNotifier(String host) implements Notifier {
        public void send(String to, String text) {
        }
    }

    @Bean                                         // name "emailNotifier", type Notifier
    @Primary                                      // preferred when several Notifier beans exist
    Notifier emailNotifier() {
        return new SmtpNotifier("smtp.example.com");
    }

    @Bean(name = "auditNotifier")
    @Scope("prototype")                           // a new instance per injection / getBean
    Notifier auditNotifier() {
        return new SmtpNotifier("audit-smtp.example.com");
    }
}
```

`@Bean` attributes and companions: `name`/`value`, `initMethod`, `destroyMethod`, `autowireCandidate`, plus `@Scope`, `@Lazy`, `@Primary`, `@Qualifier`, `@Profile`, `@Conditional…` on the method.

### Injecting dependencies into `@Bean` methods

Prefer **method parameters** over calling other `@Bean` methods:

```java
import javax.sql.DataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class JdbcConfig {

    @Bean
    JdbcTemplate jdbcTemplate(DataSource dataSource) {   // DataSource comes from the container (e.g. Boot)
        return new JdbcTemplate(dataSource);
    }
}
```

## Internal Behavior: Full Mode vs Lite Mode

In a `@Configuration` class (default `proxyBeanMethods = true`), Spring creates a **CGLIB subclass** of the class. That subclass intercepts calls between `@Bean` methods: when one `@Bean` method calls another, the proxy returns the **existing singleton** from the container instead of running the method again. This is **full mode**.

With `@Configuration(proxyBeanMethods = false)`, or `@Bean` methods inside a plain `@Component`, there is no proxy — **lite mode**. A direct call is an ordinary Java call that creates a **new object**.

```java
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

public class FullVsLiteMode {

    static class ConnectionPool {
    }

    record Repository(ConnectionPool pool) {
    }

    @Configuration                                   // full mode: CGLIB-proxied
    static class FullConfig {
        @Bean
        ConnectionPool pool() {
            return new ConnectionPool();
        }

        @Bean
        Repository repository() {
            return new Repository(pool());           // intercepted → returns the container's singleton
        }
    }

    @Configuration(proxyBeanMethods = false)         // lite mode: no proxy
    static class LiteConfig {
        @Bean
        ConnectionPool pool() {
            return new ConnectionPool();
        }

        @Bean
        Repository repository() {
            return new Repository(pool());           // plain Java call → a second ConnectionPool
        }
    }

    static void check(Class<?> config) {
        try (AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext(config)) {
            boolean same = context.getBean(Repository.class).pool() == context.getBean(ConnectionPool.class);
            boolean proxied = context.getBean(config).getClass() != config;
            System.out.println(config.getSimpleName() + ": proxied=" + proxied + ", same pool=" + same);
        }
    }

    public static void main(String[] args) {
        check(FullConfig.class);
        check(LiteConfig.class);
    }
}
```

**Output:**

```text
FullConfig: proxied=true, same pool=true
LiteConfig: proxied=false, same pool=false
```

Why lite mode exists: no CGLIB subclass means faster startup and less memory, and it works with `final` classes. Spring Boot's own auto-configuration classes use `proxyBeanMethods = false`. In lite mode, always pass dependencies as **method parameters**, never by calling another `@Bean` method.

## Comparison

| | Full mode (`@Configuration`) | Lite mode (`proxyBeanMethods = false` or `@Component`) |
|--|------------------------------|----------------------------------------------------------|
| CGLIB proxy of the config class | Yes | No |
| Inter-bean method call | Returns the singleton | Creates a new object |
| Class/methods can be `final` | No | Yes |
| Startup cost | Slightly higher | Lower |
| Recommended style | Either style works | Use method parameters for dependencies |

## Common Mistakes

- Calling another `@Bean` method in lite mode and accidentally creating two instances (two connection pools, two caches).
- Making a `@Configuration` class or its `@Bean` methods `final` (or `private`) in full mode — CGLIB cannot override them, and startup fails.
- Non-static `@Bean` methods for `BeanPostProcessor`/`BeanFactoryPostProcessor` — see [Bean Lifecycle](../spring-bean-lifecycle/content.md).
- Putting business logic in configuration classes; they should only assemble objects.

## Common Interview Traps

- **"Calling a `@Bean` method always creates a new object."** In full-mode `@Configuration` classes the call is intercepted and returns the singleton.
- **"`@Bean` methods in a `@Component` class behave the same."** They are lite mode: no interception.
- **"`@Configuration` is required for `@Bean` to work."** `@Bean` works in any bean class (lite mode); `@Configuration` adds the inter-bean call guarantee.

## Key Takeaways

- `@Configuration` = bean-definition source; `@Bean` = factory method whose return value becomes a bean.
- Full mode proxies the configuration class so inter-bean calls return singletons; lite mode does not.
- Prefer method parameters to express dependencies — they work in both modes.
- Spring Boot auto-configuration = `@Configuration(proxyBeanMethods = false)` classes with conditional `@Bean` methods.
