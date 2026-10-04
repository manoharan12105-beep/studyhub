# Spring Beans and Bean Creation — Practice

### P1. Default bean names

**Difficulty:** Easy · **Type:** MCQ

What are the default bean names for the scanned classes `PaymentService` and `JWTFilter`?

- A) `PaymentService`, `JWTFilter`
- B) `paymentService`, `jWTFilter`
- C) `paymentService`, `JWTFilter`
- D) `payment-service`, `jwt-filter`

<details>
<summary>Answer</summary>

**Answer:** C) `paymentService`, `JWTFilter`

**Explanation:** The first letter is lower-cased unless the first two letters are both upper case, in which case the name is kept as is.

</details>

### P2. Bean or not?

**Difficulty:** Easy · **Type:** Conceptual

Which of these are typically Spring beans: an `OrderController`, an `Order` JPA entity, an `OrderResponse` DTO, a `PasswordEncoder` returned from a `@Bean` method?

<details>
<summary>Answer</summary>

`OrderController` (stereotype annotation) and `PasswordEncoder` (`@Bean` method) are beans. Entities are managed by JPA's persistence context, not the Spring container, and DTOs are plain objects created per request.

</details>

### P3. Third-party class

**Difficulty:** Medium · **Type:** Coding

Register `java.time.Clock` as a bean that always returns UTC time, and inject it into a `TokenService` through its constructor.

<details>
<summary>Answer</summary>

```java
import java.time.Clock;
import java.time.Instant;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Service;

@Configuration
class ClockConfig {

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}

@Service
class TokenService {
    private final Clock clock;

    TokenService(Clock clock) {          // single constructor: no @Autowired needed
        this.clock = clock;
    }

    Instant issuedAt() {
        return Instant.now(clock);
    }
}
```

`Clock` is a JDK class, so it cannot be annotated — a `@Bean` method is the way to register it. Tests can pass `Clock.fixed(...)`.

</details>

### P4. Duplicate definition

**Difficulty:** Medium · **Type:** Debugging

A class `PricingService` is annotated `@Service`, and a configuration class also has `@Bean PricingService pricingService() { return new PricingService(); }`. What happens at startup in Spring Boot?

<details>
<summary>Answer</summary>

The application starts, and there is only **one** `pricingService` bean: the `@Bean` method's definition replaces the scanned one. Spring treats a configuration-class `@Bean` method overriding a *scanned* component of the same name as intentional, even though Boot disables general bean overriding. The trap is the opposite naming: if the `@Bean` method had a different name (say `pricing`), there would be two `PricingService` beans and injection by type would fail with `NoUniqueBeanDefinitionException`. Keep one definition so nobody has to know this rule.

</details>
