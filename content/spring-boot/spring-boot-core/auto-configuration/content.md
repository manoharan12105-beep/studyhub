# Auto-Configuration

**Module:** Spring Boot Core · **Interview priority:** Core

## Definition

**Auto-configuration** is Spring Boot's mechanism for registering infrastructure beans automatically, based on **what is on the classpath**, **which properties are set**, and **which beans you have already defined**. Each auto-configuration is an ordinary configuration class whose `@Bean` methods are guarded by `@Conditional` annotations. If your application defines a bean of the same type, the auto-configured one **backs off**.

## Why It Matters

- It is the core of "Spring Boot magic": `DataSource`, `EntityManagerFactory`, `DispatcherServlet`, `ObjectMapper`/`JsonMapper`, `SecurityFilterChain` defaults all come from it.
- "How does Spring Boot decide what to configure?" is a Level-3 interview question.
- Debugging unexpected beans (or missing ones) requires reading the condition evaluation report.

## How Spring Boot Decides What to Configure

```text
@SpringBootApplication
   └── @EnableAutoConfiguration
          └── @Import(AutoConfigurationImportSelector)          (a DeferredImportSelector)
                 │
                 ▼  runs AFTER your @Configuration classes and component scan
     META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
       (one fully qualified class name per line, in every Boot/library JAR)
                 │
                 ▼  filter early on cheap conditions (@ConditionalOnClass) without loading classes
     Candidate auto-configuration classes (minus exclusions)
                 │
                 ▼  for each class and each @Bean method: evaluate @Conditional annotations
     Beans registered only where every condition matches
```

Three questions Boot asks for each auto-configured bean:

1. **Is the technology present?** `@ConditionalOnClass(DataSource.class)`, `@ConditionalOnWebApplication`.
2. **Did the user configure it?** `@ConditionalOnProperty("spring.datasource.url")`, property values.
3. **Did the user already define one?** `@ConditionalOnMissingBean(DataSource.class)` — if yes, back off.

## Common Conditions

| Annotation | Matches when |
|------------|--------------|
| `@ConditionalOnClass` / `@ConditionalOnMissingClass` | A class is / is not on the classpath |
| `@ConditionalOnBean` / `@ConditionalOnMissingBean` | A bean of a type/name exists / does not exist (so far) |
| `@ConditionalOnProperty` | A property has a value (`havingValue`, `matchIfMissing`) |
| `@ConditionalOnWebApplication` / `@ConditionalOnNotWebApplication` | Servlet/reactive web application or not |
| `@ConditionalOnResource` | A resource exists (e.g. `classpath:schema.sql`) |
| `@ConditionalOnSingleCandidate` | Exactly one bean of a type (or one primary) |
| `@ConditionalOnExpression` | A SpEL expression is true |
| `@ConditionalOnJava`, `@ConditionalOnThreading` | Java version; platform vs virtual threads |

All are built on Spring Framework's `@Conditional(Condition.class)`; Boot adds the ready-made conditions.

## How It Works

A simplified version of what a real auto-configuration looks like, tested with Boot's `ApplicationContextRunner` (the same tool Boot's own tests use):

```java
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

public class AutoConfigurationDemo {

    interface GreetingService {
        String greet(String name);
    }

    record DefaultGreetingService(String prefix) implements GreetingService {
        public String greet(String name) {
            return prefix + ", " + name;
        }
    }

    @AutoConfiguration
    static class GreetingAutoConfiguration {

        @Bean
        @ConditionalOnMissingBean                                   // back off if the user defined one
        @ConditionalOnProperty(name = "greeting.enabled", havingValue = "true", matchIfMissing = true)
        GreetingService greetingService(Environment environment) {
            return new DefaultGreetingService(environment.getProperty("greeting.prefix", "Hello"));
        }
    }

    @Configuration
    static class UserConfig {
        @Bean
        GreetingService customGreeting() {
            return name -> "Custom welcome, " + name;
        }
    }

    public static void main(String[] args) {
        ApplicationContextRunner runner = new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(GreetingAutoConfiguration.class));

        runner.run(context ->
                System.out.println("defaults:      " + context.getBean(GreetingService.class).greet("Asha")));

        runner.withPropertyValues("greeting.prefix=Namaste").run(context ->
                System.out.println("property set:  " + context.getBean(GreetingService.class).greet("Asha")));

        runner.withUserConfiguration(UserConfig.class).run(context ->
                System.out.println("user bean:     " + context.getBean(GreetingService.class).greet("Asha")
                        + " (beans: " + context.getBeansOfType(GreetingService.class).size() + ")"));

        runner.withPropertyValues("greeting.enabled=false").run(context ->
                System.out.println("disabled:      bean present = " + context.containsBean("greetingService")));
    }
}
```

**Output:**

```text
defaults:      Hello, Asha
property set:  Namaste, Asha
user bean:     Custom welcome, Asha (beans: 1)
disabled:      bean present = false
```

A real auto-configuration is registered by listing its class in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` inside a JAR:

```text
com.example.greeting.autoconfigure.GreetingAutoConfiguration
```

Library authors usually split this into an `-autoconfigure` module (the configuration classes) and a `-starter` module (a POM that depends on it and on the library).

## Internal Behavior

- **Ordering is the key to back-off.** `AutoConfigurationImportSelector` is a `DeferredImportSelector`, so auto-configurations are processed after all user configuration. When `@ConditionalOnMissingBean` is evaluated, your beans are already registered.
- **Conditions are evaluated on bean definitions, not instances** — at registration time, before beans are created.
- Auto-configurations order among themselves with `@AutoConfiguration(before = …, after = …)`; for example JPA auto-configuration runs after `DataSource` auto-configuration.
- `@AutoConfiguration` is a `@Configuration(proxyBeanMethods = false)`; auto-configuration classes must not be picked up by component scanning.
- **Since Boot 2.7/3.0**, the `.imports` file replaced the `EnableAutoConfiguration` key in `META-INF/spring.factories` (removed in 3.0).
- **Boot 4** splits auto-configuration into many technology modules (`spring-boot-webmvc`, `spring-boot-jdbc`, `spring-boot-data-jpa`, …), so package names of auto-configuration classes changed; prefer property-based exclusion over importing those classes.

## Seeing and Controlling It

| Need | How |
|------|-----|
| Why was (not) a bean configured? | Start with `--debug` or `debug=true` → **condition evaluation report** (positive and negative matches) |
| Same at runtime | Actuator `/actuator/conditions` |
| Turn one off | `spring.autoconfigure.exclude=<fully.qualified.AutoConfigClass>` or `@SpringBootApplication(exclude = …)` |
| Replace a bean | Define your own bean of that type → `@ConditionalOnMissingBean` backs off |
| Tweak a bean | Properties (`spring.jackson.*`, `spring.datasource.hikari.*`) or `*Customizer` beans (e.g. `Jackson2ObjectMapperBuilderCustomizer`, `JsonMapperBuilderCustomizer` in Boot 4) |

Example report excerpt:

```text
============================
CONDITIONS EVALUATION REPORT
============================

Positive matches:
-----------------
   DataSourceAutoConfiguration matched:
      - @ConditionalOnClass found required classes 'javax.sql.DataSource', ... (OnClassCondition)

Negative matches:
-----------------
   MongoAutoConfiguration:
      Did not match:
         - @ConditionalOnClass did not find required class 'com.mongodb.client.MongoClient' (OnClassCondition)
```

## Common Mistakes

- Defining a bean of a type Boot also configures and losing Boot's defaults without realising (e.g. your own `ObjectMapper` drops Boot's module registration and `spring.jackson.*` properties).
- Excluding an auto-configuration instead of setting one property.
- Placing a custom auto-configuration class inside a component-scanned package — it is then processed as normal configuration, too early, and back-off conditions misbehave.

## Common Interview Traps

- **"Auto-configuration overrides my beans."** The opposite: it is designed to back off when your bean exists.
- **"Auto-configuration scans the classpath at runtime for everything."** It reads a fixed candidate list from `.imports` files and filters by conditions; `@ConditionalOnClass` filtering is done cheaply without loading classes.
- **"`@EnableAutoConfiguration` and `@ComponentScan` do the same thing."** Scanning finds *your* components; auto-configuration imports *Boot's and libraries'* configuration classes.

## Key Takeaways

- Auto-configuration = conditional `@Configuration` classes listed in `AutoConfiguration.imports`, processed after your configuration.
- Decisions: classpath (`@ConditionalOnClass`), properties (`@ConditionalOnProperty`), existing beans (`@ConditionalOnMissingBean`).
- Debug with `--debug` / `/actuator/conditions`; customise with properties, your own beans, customizers or exclusions.
