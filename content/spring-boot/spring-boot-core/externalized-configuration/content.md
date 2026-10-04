# Externalized Configuration: Properties, YAML, @Value and @ConfigurationProperties

**Module:** Spring Boot Core · **Interview priority:** Core

## Definition

**Externalized configuration** means keeping settings (URLs, credentials, timeouts, feature flags) **outside the code**, so the same JAR runs in every environment with different values. Spring Boot collects settings from many **property sources** — `application.properties`/`application.yml`, environment variables, system properties, command-line arguments and more — into one `Environment`, applies a fixed **precedence order**, and lets beans read values through **`@Value`** or bind groups of them to typed objects with **`@ConfigurationProperties`**.

## Why It Matters

- The Twelve-Factor App rule "store config in the environment" is how containers and cloud platforms configure services.
- "Which value wins if a property is set in two places?" is a classic question.
- `@Value` vs `@ConfigurationProperties` is a standard comparison.
- Secrets must never be committed in `application.properties`; knowing the alternatives matters.

## application.properties

The default file, loaded from `src/main/resources` (packaged into the JAR):

```properties
spring.application.name=shop-service
server.port=8080

spring.datasource.url=jdbc:postgresql://localhost:5432/shop
spring.datasource.username=shop
spring.datasource.password=${DB_PASSWORD}

app.mail.from=noreply@shop.example
app.mail.retry-count=3
app.mail.timeout=5s
```

`${DB_PASSWORD}` is a **placeholder** resolved from any property source (here an environment variable); `${DB_PASSWORD:changeme}` adds a default.

## application.yml

The same settings in YAML (hierarchical; indentation matters):

```yaml
spring:
  application:
    name: shop-service
  datasource:
    url: jdbc:postgresql://localhost:5432/shop
    username: shop
    password: ${DB_PASSWORD}

app:
  mail:
    from: noreply@shop.example
    retry-count: 3
    timeout: 5s
    recipients:
      - ops@shop.example
      - audit@shop.example
```

| | `.properties` | `.yml` |
|--|---------------|--------|
| Syntax | Flat `key=value` | Hierarchical, indentation |
| Lists | `app.mail.recipients[0]=…` | `- item` |
| Multiple documents in one file | `#---` separator | `---` separator |
| Both present in the same location | **`.properties` wins** for keys in both | |
| `@PropertySource` support | Yes | No |

## Externalized Configuration

Spring Boot reads property sources in a fixed order. **Later sources override earlier ones.** The most useful part of the order, lowest to highest priority:

1. Default properties (`SpringApplication.setDefaultProperties`)
2. `@PropertySource` on `@Configuration` classes
3. **Config data files** (`application.properties`/`.yml`, see below)
4. `random.*` values
5. **OS environment variables**
6. **Java system properties** (`-Dserver.port=9000`)
7. JNDI, servlet context/config parameters
8. `SPRING_APPLICATION_JSON` (inline JSON in an env var or system property)
9. **Command-line arguments** (`--server.port=9000`)
10. Test properties (`@TestPropertySource`, `@SpringBootTest(properties = …)`, `@DynamicPropertySource`)

Within config data files, the order (lowest to highest) is:

1. `application.properties` **inside** the JAR
2. `application-{profile}.properties` **inside** the JAR
3. `application.properties` **outside** the JAR (next to it, or in `./config/`)
4. `application-{profile}.properties` **outside** the JAR

So: profile-specific beats generic, outside beats inside, env vars beat files, command line beats env vars.

```text
java -jar shop.jar                         # server.port from application.properties (8080)
SERVER_PORT=9000 java -jar shop.jar        # env var wins → 9000
SERVER_PORT=9000 java -jar shop.jar --server.port=9100   # command line wins → 9100
```

Extra locations: `spring.config.import=optional:file:./secrets.properties` or `spring.config.additional-location`.

## Environment Variables

Environment variables cannot contain dots or dashes, so Spring Boot applies **relaxed binding** rules:

| Property | Environment variable |
|----------|---------------------|
| `server.port` | `SERVER_PORT` |
| `spring.datasource.url` | `SPRING_DATASOURCE_URL` |
| `app.mail.retry-count` | `APP_MAIL_RETRYCOUNT` (dashes removed, dots → `_`, upper case) |
| `app.mail.recipients[0]` | `APP_MAIL_RECIPIENTS_0` (index between underscores: `my.list[0].name` → `MY_LIST_0_NAME`) |

In containers and Kubernetes, nearly all production configuration arrives this way.

## @Value

Injects a single value, with optional default and SpEL:

```java
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
class MailSender {
    private final String from;
    private final int retryCount;
    private final Duration timeout;

    MailSender(@Value("${app.mail.from}") String from,
               @Value("${app.mail.retry-count:3}") int retryCount,          // default 3
               @Value("${app.mail.timeout:10s}") Duration timeout) {        // "5s" converted to Duration
        this.from = from;
        this.retryCount = retryCount;
        this.timeout = timeout;
    }
}
```

A missing property without a default fails startup: `Could not resolve placeholder 'app.mail.from'`.

## @ConfigurationProperties

Binds a whole prefix to a type-safe object — the recommended approach for groups of settings.

```java
import java.time.Duration;
import java.util.List;
import java.util.Map;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.env.SystemEnvironmentPropertySource;
import org.springframework.validation.annotation.Validated;

public class ConfigurationPropertiesDemo {

    @ConfigurationProperties(prefix = "app.mail")
    @Validated                                       // fail startup on invalid values
    record MailProperties(@Email String from,
                          @Min(0) int retryCount,
                          Duration timeout,
                          List<String> recipients) {
    }

    @Configuration
    @EnableConfigurationProperties(MailProperties.class)
    static class AppConfig {
    }

    public static void main(String[] args) {
        new ApplicationContextRunner()
                .withUserConfiguration(AppConfig.class)
                .withPropertyValues(
                        "app.mail.from=noreply@shop.example",     // kebab-case/dotted keys, as in files
                        "app.mail.timeout=5s",
                        "app.mail.recipients=ops@shop.example,audit@shop.example")
                .withInitializer(context -> context.getEnvironment().getPropertySources().addFirst(   // simulates an OS env var
                        new SystemEnvironmentPropertySource(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME,
                                Map.of("APP_MAIL_RETRYCOUNT", "7"))))
                .run(context -> {
                    MailProperties mail = context.getBean(MailProperties.class);
                    System.out.println("from       = " + mail.from());
                    System.out.println("retryCount = " + mail.retryCount() + "  (bound from APP_MAIL_RETRYCOUNT)");
                    System.out.println("timeout    = " + mail.timeout());
                    System.out.println("recipients = " + mail.recipients());
                });

        new ApplicationContextRunner()
                .withUserConfiguration(AppConfig.class)
                .withPropertyValues("app.mail.from=not-an-email", "app.mail.retry-count=-1")
                .run(context -> System.out.println("invalid config starts? " + (context.getStartupFailure() == null)));
    }
}
```

**Output:**

```text
from       = noreply@shop.example
retryCount = 7  (bound from APP_MAIL_RETRYCOUNT)
timeout    = PT5S
recipients = [ops@shop.example, audit@shop.example]
invalid config starts? false
```

Ways to register `@ConfigurationProperties` classes: `@EnableConfigurationProperties(X.class)`, `@ConfigurationPropertiesScan` on the main class, or (for JavaBean-style classes with setters) annotating the class `@Component`. Records and classes with a single constructor use **constructor binding** automatically, which makes the properties object immutable.

Add `spring-boot-configuration-processor` (annotation processor) to generate metadata, which gives IDE auto-completion and documentation for your own properties.

## Comparison

| | `@Value` | `@ConfigurationProperties` |
|--|----------|----------------------------|
| Granularity | One value | A group under a prefix |
| Type safety | Converted per field | Whole typed object (records, nested, lists, maps) |
| Relaxed binding | Limited (use the canonical kebab-case name) | Full |
| Validation (`@Validated`) | No | Yes |
| SpEL expressions | Yes (`#{...}`) | No |
| IDE metadata | No | Yes (configuration processor) |
| Best for | A single setting or SpEL | Any structured configuration |

## Internal Behavior

- The `Environment` is a list of `PropertySource`s searched in order; the first source containing the key wins. Spring Boot builds this list during `SpringApplication.run`, before the context is created.
- `@Value` placeholders are resolved by an embedded value resolver while beans are created; `@ConfigurationProperties` objects are bound by `ConfigurationPropertiesBindingPostProcessor` using Boot's `Binder`, which applies relaxed binding and conversion (`5s` → `Duration`, `10MB` → `DataSize`, comma lists → `List`).
- Values are read **at startup**. Changing a file later has no effect without a restart (unless a refresh mechanism such as Spring Cloud's `@RefreshScope` is used).

## Common Mistakes

- Committing passwords and API keys to `application.properties` — use environment variables or a secrets manager (see [Production Configuration](../../production/production-configuration/content.md)).
- Using `@Value` with a camelCase name (`${app.mail.retryCount}`) and expecting the kebab-case file key to match — use the canonical kebab-case form.
- Static fields with `@Value` — not injected.
- Tab characters in YAML or wrong indentation — the property silently ends up under another key or parsing fails.
- Both `application.properties` and `application.yml` defining the same key, then editing the YAML and seeing no change.

## Common Interview Traps

- **"application.yml has higher priority than environment variables."** Environment variables override config files.
- **"`@Value` and `@ConfigurationProperties` are interchangeable."** Only `@ConfigurationProperties` gives full relaxed binding, validation and structured types.
- **"Properties are re-read on every access."** They are bound once at startup.

## Key Takeaways

- One `Environment`, many property sources; command line > system props > env vars > external profile files > external files > packaged files.
- `SPRING_DATASOURCE_URL` maps to `spring.datasource.url` by relaxed binding.
- Prefer immutable, validated `@ConfigurationProperties` records for groups; `@Value` for one-offs.
