# Spring Container: BeanFactory and ApplicationContext — Practice

### P1. Which container?

**Difficulty:** Easy · **Type:** MCQ

Which feature does `ApplicationContext` provide that a bare `DefaultListableBeanFactory` does not provide out of the box?

- A) Creating beans from bean definitions
- B) Dependency injection through constructors
- C) Automatic registration of `BeanPostProcessor`s and event publishing
- D) Singleton scope

<details>
<summary>Answer</summary>

**Answer:** C) Automatic registration of `BeanPostProcessor`s and event publishing

**Explanation:** Both create beans, inject constructor dependencies and support singletons. Only the context detects post-processors automatically and publishes events.

</details>

### P2. When does the constructor run?

**Difficulty:** Easy · **Type:** Behavior

A singleton bean prints a line in its constructor. The application starts but no request is ever made. Is the line printed?

<details>
<summary>Answer</summary>

Yes. An `ApplicationContext` pre-instantiates non-lazy singletons during `refresh()`, so the constructor runs at startup regardless of use. It would not run if the bean were `@Lazy` (and nothing eager depended on it) or prototype-scoped.

</details>

### P3. Fail fast

**Difficulty:** Medium · **Type:** Scenario

A teammate sets `spring.main.lazy-initialization=true` to cut startup time from 12 s to 4 s. What should you warn them about?

<details>
<summary>Answer</summary>

Configuration errors (missing beans, bad properties, broken connection settings) will no longer stop startup; they will appear on the first request that needs the bean, possibly in production. The first requests also become slower because they trigger bean creation. A common compromise is lazy initialisation in development only, or `@Lazy` on specific heavy beans.

</details>

### P4. Second context

**Difficulty:** Medium · **Type:** Code analysis

```java
@Service
class ReportService {
    String build() {
        var context = new AnnotationConfigApplicationContext(AppConfig.class);
        return context.getBean(TemplateEngine.class).render();
    }
}
```

What is wrong?

<details>
<summary>Answer</summary>

Each call builds a brand-new container, creating a second set of singletons (and possibly connection pools) that is never closed — slow and leaky. It also hides the dependency. Inject `TemplateEngine` through `ReportService`'s constructor instead.

</details>
