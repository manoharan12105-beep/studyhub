# Bean Lifecycle — Practice

### P1. Order the callbacks

**Difficulty:** Easy · **Type:** MCQ

Which order is correct for a singleton bean?

- A) `@PostConstruct` → constructor → `afterPropertiesSet` → field injection
- B) constructor → field injection → `@PostConstruct` → `afterPropertiesSet`
- C) constructor → `@PostConstruct` → field injection → `afterPropertiesSet`
- D) field injection → constructor → `afterPropertiesSet` → `@PostConstruct`

<details>
<summary>Answer</summary>

**Answer:** B) constructor → field injection → `@PostConstruct` → `afterPropertiesSet`

**Explanation:** The object must exist before fields can be injected, and initialisation callbacks run only after injection completes.

</details>

### P2. Predict the failure

**Difficulty:** Easy · **Type:** Behavior

```java
@Service
class ReportService {
    @Autowired
    private TemplateRepository templates;

    ReportService() {
        templates.loadAll();
    }
}
```

What happens at startup?

<details>
<summary>Answer</summary>

`NullPointerException` in the constructor, wrapped in a `BeanCreationException`, and the application fails to start. `templates` is injected only after construction. Use constructor injection (`ReportService(TemplateRepository templates)`) or move `loadAll()` into a `@PostConstruct` method.

</details>

### P3. Prototype cleanup

**Difficulty:** Medium · **Type:** Scenario

A prototype-scoped `ExportSession` opens a temporary file in `@PostConstruct` and deletes it in `@PreDestroy`. After a week, the disk is full of temporary files. Why, and how do you fix it?

<details>
<summary>Answer</summary>

The container never calls destroy callbacks on prototype beans, so `@PreDestroy` never runs. Make the caller responsible: implement `AutoCloseable` and use try-with-resources, or redesign so the file's lifetime is tied to the request (for example a request-scoped bean, whose destroy callbacks do run at the end of the request).

</details>

### P4. Third-party init

**Difficulty:** Medium · **Type:** Coding

A library class `LegacyCache` (which you cannot modify) needs `connect()` called after creation and `disconnect()` before shutdown. Register it correctly.

<details>
<summary>Answer</summary>

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

class LegacyCache {
    void connect() {
    }

    void disconnect() {
    }
}

@Configuration
class CacheConfig {

    @Bean(initMethod = "connect", destroyMethod = "disconnect")
    LegacyCache legacyCache() {
        return new LegacyCache();
    }
}
```

`initMethod`/`destroyMethod` attach callbacks without annotating the class.

</details>

### P5. Where do proxies come from?

**Difficulty:** Hard · **Type:** Conceptual

At which lifecycle step does a `@Transactional` service become a proxy, and what consequence does that have for `@PostConstruct`?

<details>
<summary>Answer</summary>

In `BeanPostProcessor.postProcessAfterInitialization`, after all init callbacks. `@PostConstruct` therefore runs on the unproxied target, so transactional, async or cached behaviour is not active for calls made from it.

</details>
