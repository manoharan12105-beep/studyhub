# @Autowired, @Qualifier and @Primary

**Module:** Spring Framework Fundamentals · **Interview priority:** Core

## Definition

**Autowiring** is Spring's process of finding the bean to inject into an injection point. It matches **by type** first. When more than one bean matches, Spring narrows the candidates using:

- **`@Qualifier`** — the injection point names (or qualifies) the exact bean it wants.
- **`@Primary`** — a bean declares itself the default choice among beans of its type.
- **`@Priority`** — a numeric ranking (`jakarta.annotation.Priority`), lower value wins.
- **Name fallback** — a parameter or field name equal to a bean name.

If none of these resolves the ambiguity, startup fails with `NoUniqueBeanDefinitionException`.

## Why It Matters

- "What happens when two beans implement the same interface?" is a Level-3 interview question that tests whether you know the resolution order.
- Multiple implementations are normal: payment providers, notification channels, data sources.
- Injecting **all** implementations (`List<T>`, `Map<String, T>`) is the Spring way to implement the strategy pattern without `if`/`switch`.

## @Autowired

`@Autowired` (or an unannotated single constructor) asks Spring to resolve dependencies. Resolution algorithm for one injection point of type `T`:

```text
1. Collect all beans assignable to T (respecting generics)
   ├─ 0 candidates → required? NoSuchBeanDefinitionException : inject null/Optional.empty
   └─ 1 candidate  → inject it
2. Several candidates:
   a. @Qualifier on the injection point → keep only matching beans
   b. exactly one @Primary candidate      → inject it
   c. @Priority ranking                   → inject the highest priority (lowest value)
   d. a candidate whose bean name equals the parameter/field name → inject it
   e. otherwise                           → NoUniqueBeanDefinitionException
```

## @Qualifier

`@Qualifier("beanName")` on a parameter or field selects a bean by name (or by a custom qualifier value). It **overrides** `@Primary`.

```java
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
class RefundService {
    private final PaymentGateway gateway;

    RefundService(@Qualifier("stripeGateway") PaymentGateway gateway) {
        this.gateway = gateway;
    }
}

interface PaymentGateway {
}
```

Custom qualifier annotations avoid string names:

```java
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.beans.factory.annotation.Qualifier;

@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Qualifier                                       // put @ReportingDb on both the bean and the injection point
public @interface ReportingDb {
}
```

## @Primary

`@Primary` on a bean (class or `@Bean` method) makes it the default when several beans of that type exist. Typical use: two `DataSource` beans where the main one is primary and the reporting one is injected with `@Qualifier`.

At most one candidate may be primary for a given injection point; two primary candidates also cause `NoUniqueBeanDefinitionException`. Spring Framework 6.2 added the opposite marker, `@Fallback`: a fallback bean is used only when no other candidate exists.

## How It Works

```java
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.annotation.Order;

public class BeanResolutionDemo {

    interface Notifier {
        String channel();
    }

    record Channel(String channel) implements Notifier {
    }

    record Consumers(Notifier byDefault, Notifier byQualifier, Notifier byName,
                     List<Notifier> all, Map<String, Notifier> byBeanName) {
    }

    @Configuration
    static class AppConfig {
        @Bean
        @Primary
        @Order(2)
        Notifier emailNotifier() {
            return new Channel("email");
        }

        @Bean
        @Order(1)
        Notifier smsNotifier() {
            return new Channel("sms");
        }

        @Bean
        @Order(3)
        Notifier pushNotifier() {
            return new Channel("push");
        }

        @Bean
        Consumers consumers(Notifier notifier,                          // several match → @Primary wins
                            @Qualifier("pushNotifier") Notifier chosen, // qualifier beats @Primary
                            Notifier smsNotifier,                       // @Primary still beats the name match
                            List<Notifier> all,                         // every Notifier, in @Order order
                            Map<String, Notifier> byBeanName) {         // bean name → bean
            return new Consumers(notifier, chosen, smsNotifier, all, byBeanName);
        }
    }

    public static void main(String[] args) {
        try (AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class)) {
            Consumers c = context.getBean(Consumers.class);
            System.out.println("default     -> " + c.byDefault().channel());
            System.out.println("@Qualifier  -> " + c.byQualifier().channel());
            System.out.println("param name  -> " + c.byName().channel());
            System.out.println("List        -> " + c.all().stream().map(Notifier::channel).toList());
            System.out.println("Map keys    -> " + c.byBeanName().keySet());
        }
    }
}
```

**Output:**

```text
default     -> email
@Qualifier  -> push
param name  -> email
List        -> [sms, email, push]
Map keys    -> [emailNotifier, smsNotifier, pushNotifier]
```

Note the third line: the parameter is named `smsNotifier`, yet `email` is injected, because `@Primary` is checked **before** the name fallback. Use `@Qualifier` when you want a specific bean.

### Strategy pattern with `Map` injection

```java
import java.math.BigDecimal;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

interface DiscountPolicy {
    BigDecimal apply(BigDecimal amount);
}

@Component("festival")
class FestivalDiscount implements DiscountPolicy {
    public BigDecimal apply(BigDecimal amount) {
        return amount.multiply(new BigDecimal("0.80"));
    }
}

@Component("none")
class NoDiscount implements DiscountPolicy {
    public BigDecimal apply(BigDecimal amount) {
        return amount;
    }
}

@Service
class PricingService {
    private final Map<String, DiscountPolicy> policies;     // {"festival" → …, "none" → …}

    PricingService(Map<String, DiscountPolicy> policies) {
        this.policies = policies;
    }

    BigDecimal price(BigDecimal amount, String policyName) {
        DiscountPolicy policy = policies.getOrDefault(policyName, policies.get("none"));
        return policy.apply(amount);
    }
}
```

Adding a new policy means adding a new `@Component` — `PricingService` does not change (open/closed principle).

## Comparison

| | `@Primary` | `@Qualifier` |
|--|------------|--------------|
| Declared on | The **bean** (provider side) | The **injection point** (consumer side) |
| Meaning | "Use me by default" | "I want exactly this one" |
| Scope of effect | All injection points of that type | One injection point |
| Precedence | Lower — overridden by `@Qualifier` | Higher |
| Typical use | A main `DataSource`, a default `ObjectMapper` | The secondary `DataSource`, a specific gateway |
| Ambiguity left | Two `@Primary` beans → error | Qualifier matching nothing → `NoSuchBeanDefinitionException` |

## Internal Behavior

- Resolution lives in `DefaultListableBeanFactory.doResolveDependency` → `findAutowireCandidates` → `determineAutowireCandidate`, which applies primary, priority and name matching in that order.
- `@Qualifier` matching is done by a `QualifierAnnotationAutowireCandidateResolver` while collecting candidates, which is why it overrides `@Primary`.
- Name matching relies on parameter names being available: Spring Boot's Maven/Gradle plugins compile with `-parameters`. Without it (plain `javac`), constructor parameter-name fallback does not work for constructor injection.
- Collection injection orders beans by `@Order`/`Ordered`, then registration order; `Map` keys are bean names.

## Common Mistakes

- Relying on parameter names for selection, then renaming a parameter and silently changing behaviour — prefer `@Qualifier`.
- Marking two beans `@Primary`.
- Qualifier typos: `@Qualifier("stripeGatway")` → no bean found at startup.
- `@Qualifier` on a Lombok-generated constructor's fields without `lombok.copyableAnnotations` — the qualifier is lost.

## Common Interview Traps

- **"Spring autowires by name."** It autowires **by type**; names are used only to break ties.
- **"`@Primary` and `@Qualifier` conflict — Spring fails."** `@Qualifier` wins at that injection point; `@Primary` still applies elsewhere.
- **"`List<Notifier>` injection fails when several beans exist."** Collection injection is how you ask for all of them.

## Key Takeaways

- By type first; then `@Qualifier` → `@Primary` → `@Priority` → name.
- `@Primary` is provider-side default; `@Qualifier` is consumer-side precise choice.
- Inject `List<T>`/`Map<String, T>` to work with all implementations (strategy pattern).
