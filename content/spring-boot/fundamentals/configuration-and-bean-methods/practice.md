# @Configuration and @Bean — Practice

### P1. Bean name

**Difficulty:** Easy · **Type:** MCQ

What is the bean name of `@Bean public RestClient paymentClient(RestClient.Builder builder) { ... }`?

- A) `restClient`
- B) `paymentClient`
- C) `RestClient`
- D) `builder`

<details>
<summary>Answer</summary>

**Answer:** B) `paymentClient`

**Explanation:** A `@Bean` method's name is the bean name unless `name` is specified.

</details>

### P2. How many pools?

**Difficulty:** Medium · **Type:** Behavior

```java
@Component
class DbConfig {
    @Bean
    Pool pool() {
        return new Pool();
    }

    @Bean
    OrderDao orderDao() {
        return new OrderDao(pool());
    }

    @Bean
    UserDao userDao() {
        return new UserDao(pool());
    }
}
```

How many `Pool` objects exist after startup?

<details>
<summary>Answer</summary>

Three: the `pool` bean plus one extra per direct call, because `@Bean` methods in a `@Component` class are lite mode (no interception). With `@Configuration` (full mode) there would be one. Better: take `Pool pool` as a method parameter in both methods.

</details>

### P3. Rewrite for lite mode

**Difficulty:** Medium · **Type:** Coding

Rewrite `FullConfig` from the lesson so it is correct with `proxyBeanMethods = false`.

<details>
<summary>Answer</summary>

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
class LiteSafeConfig {

    static class ConnectionPool {
    }

    record Repository(ConnectionPool pool) {
    }

    @Bean
    ConnectionPool pool() {
        return new ConnectionPool();
    }

    @Bean
    Repository repository(ConnectionPool pool) {   // injected singleton, no direct call
        return new Repository(pool);
    }
}
```

</details>

### P4. Final class

**Difficulty:** Hard · **Type:** Debugging

Kotlin-style "everything final" is adopted for Java configuration classes: `public final class WebConfig` with `@Configuration`. Startup fails. Explain and give two fixes.

<details>
<summary>Answer</summary>

Full-mode configuration classes are subclassed by CGLIB, which cannot extend a final class. Fix 1: remove `final`. Fix 2: use `@Configuration(proxyBeanMethods = false)` and pass dependencies through method parameters.

</details>
