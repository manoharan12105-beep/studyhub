# Profiles

**Module:** Spring Boot Core · **Interview priority:** Core

## Definition

A **profile** is a named set of configuration and beans that is active only in certain environments — `dev`, `test`, `prod`. Spring Boot loads **profile-specific property files** (`application-prod.yml`) on top of the defaults, and **`@Profile`** registers beans only when a matching profile is active.

## Why It Matters

- Real applications differ per environment: H2 locally, PostgreSQL in production; verbose logs in dev; a fake payment gateway in tests.
- Interviewers ask how to activate profiles, how profile-specific files override defaults, and what `@Profile` does.
- "Profile not activating" is a frequent debugging question.

## Profiles

```text
src/main/resources/
├── application.yml           always loaded (shared defaults)
├── application-dev.yml       loaded when "dev" is active  → overrides shared values
└── application-prod.yml      loaded when "prod" is active → overrides shared values
```

```yaml
# application.yml
spring:
  jpa:
    open-in-view: false
logging:
  level:
    root: INFO
```

```yaml
# application-dev.yml
spring:
  datasource:
    url: jdbc:h2:mem:shop
logging:
  level:
    com.example.shop: DEBUG
```

### Activating profiles

| Method | Example |
|--------|---------|
| Property in `application.yml` (default for every run) | `spring.profiles.active=dev` |
| Command-line argument | `java -jar shop.jar --spring.profiles.active=prod` |
| Environment variable (containers) | `SPRING_PROFILES_ACTIVE=prod` |
| JVM system property | `-Dspring.profiles.active=prod` |
| Tests | `@ActiveProfiles("test")` |
| Programmatically | `SpringApplication.setAdditionalProfiles("dev")` |

Multiple profiles: `spring.profiles.active=prod,eu`. Later profiles override earlier ones for the same key. If no profile is active, the **`default`** profile is active (change it with `spring.profiles.default`).

### Multi-document files

One file can hold several profile sections, separated by `---` (YAML) or `#---` (properties):

```yaml
server:
  port: 8080
---
spring:
  config:
    activate:
      on-profile: prod
server:
  port: 80
```

### Profile groups

```yaml
spring:
  profiles:
    group:
      prod: "proddb,prodmq,prodsecurity"
```

Activating `prod` activates the three member profiles too — useful for splitting configuration by concern.

## @Profile

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

interface PaymentGateway {
    String charge(String orderId, long amountPaise);
}

@Configuration
class PaymentConfig {

    @Bean
    @Profile("prod")
    PaymentGateway razorpayGateway() {
        return (orderId, amount) -> "rzp_" + orderId;
    }

    @Bean
    @Profile("!prod")                 // every environment except prod
    PaymentGateway fakeGateway() {
        return (orderId, amount) -> "fake_" + orderId;
    }
}
```

`@Profile` works on `@Component` classes, `@Configuration` classes and `@Bean` methods. Expressions are supported: `"prod & eu"`, `"dev | test"`, `"!prod"`.

## How It Works

1. While preparing the `Environment`, Boot determines active profiles from all property sources (command line, env vars, `application.yml`).
2. The config-data loader then loads `application-{profile}` files and `on-profile` documents for each active profile, placing them **above** the generic files in precedence.
3. During component scanning and configuration parsing, `@Profile` is evaluated as a condition (`ProfileCondition`); beans whose profiles are not active are never registered.

## Internal Behavior

- `@Profile` is implemented with `@Conditional(ProfileCondition.class)` — the same mechanism auto-configuration uses.
- `spring.profiles.active` cannot be set inside a profile-specific file or an `on-profile` document; Boot rejects it (profiles must be decided before those files are loaded). Use profile groups instead.
- The active profiles are logged at startup: `The following 1 profile is active: "prod"` — the first place to look when something seems unconfigured.

## Comparison

| | Profile-specific properties | `@Profile` beans |
|--|-----------------------------|------------------|
| Changes | Values (URLs, levels, flags) | Which beans exist (implementations) |
| Example | `application-prod.yml` with the production DB URL | `RazorpayGateway` only in `prod` |
| Mechanism | Config data loading order | Conditional bean registration |

## Common Mistakes

- Hard-coding `spring.profiles.active=dev` in the packaged `application.yml` and forgetting to override it in production.
- Typos in file names (`application-production.yml` vs profile `prod`) — the file is silently ignored.
- Putting production secrets in `application-prod.yml` in the repository.
- Using profiles as feature flags for business logic (`if (env.acceptsProfiles(...))` everywhere) — prefer properties.

## Common Interview Traps

- **"Profile-specific files replace `application.yml`."** They are loaded **in addition** and override only the keys they define.
- **"Only one profile can be active."** Several can; later ones win on conflicts.
- **"With no profile set, nothing is active."** The `default` profile is active.

## Key Takeaways

- Profiles = environment-specific configuration (`application-{profile}`) and beans (`@Profile`).
- Activate with `spring.profiles.active` via env var, command line or `@ActiveProfiles` in tests.
- Profile files override shared values; profile groups bundle several profiles.
