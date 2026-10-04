# Spring Beans and Bean Creation — Interview Questions

## Beginner

### Q1. What is a Spring bean?

<details>
<summary>Answer</summary>

An object whose creation, dependency injection and lifecycle are managed by the Spring container. It is created from a bean definition — typically a class annotated with `@Component`/`@Service`/… found by component scanning, or the return value of a `@Bean` method.

</details>

### Q2. What are the ways to define a bean?

<details>
<summary>Answer</summary>

1. Stereotype annotations (`@Component`, `@Service`, `@Repository`, `@Controller`) plus component scanning.
2. `@Bean` methods in a `@Configuration` class.
3. Spring Boot auto-configuration (conditional `@Bean` methods shipped by Boot).
4. Programmatic registration (`registerBean`, `BeanDefinitionRegistry`).
5. XML `<bean>` elements in legacy applications.

</details>

### Q3. What is the default name of a bean?

<details>
<summary>Answer</summary>

For a scanned class, the simple class name with the first letter lower-cased (`OrderService` → `orderService`), except when the first two letters are upper case (`URLParser` stays `URLParser`). For a `@Bean` method, the method name. Both can be overridden: `@Service("orders")`, `@Bean("orders")`.

</details>

## Intermediate

### Q4. When would you use `@Bean` instead of `@Component`?

<details>
<summary>Answer</summary>

When you cannot annotate the class (third-party types such as `Clock`, `RestClient`, `ObjectMapper` customisations, `PasswordEncoder`), when construction needs logic or configuration values, or when you need several beans of the same class with different settings. Use `@Component` stereotypes for your own application classes.

</details>

### Q5. You `new` a class that has `@Autowired` fields. Why are the fields null?

<details>
<summary>Answer</summary>

Injection is performed by the container's post-processors while it creates beans. An object created with `new` never passes through the container, so no field is injected, no `@PostConstruct` runs and no proxy (transactions, security) wraps it. Inject the bean instead of instantiating it.

</details>

### Q6. Can two beans have the same class?

<details>
<summary>Answer</summary>

Yes — for example two `@Bean` methods both returning `DataSource` (primary and reporting). They have different names. Injecting by type then becomes ambiguous and must be resolved with `@Primary`, `@Qualifier` or a matching parameter name; otherwise Spring throws `NoUniqueBeanDefinitionException`.

</details>

## Advanced

### Q7. What happens if two bean definitions have the same name in Spring Boot?

<details>
<summary>Answer</summary>

It depends on where the definitions come from:

- **Two `@Bean` methods with the same name** (in different configuration classes): startup fails with `BeanDefinitionOverrideException`, because Spring Boot sets `spring.main.allow-bean-definition-overriding=false`.
- **Two scanned classes with the same simple name** in different packages: `ConflictingBeanDefinitionException` during component scanning — give one an explicit name.
- **A `@Bean` method with the same name as a scanned component:** allowed; the `@Bean` definition replaces the scanned one.

Plain Spring Framework allows overriding by default (the later definition wins), which can silently replace a bean. Enabling overriding in Boot is possible but usually hides a configuration mistake.

</details>

### Q8. Why might `bean.getClass()` not return your class?

<details>
<summary>Answer</summary>

Because the container injected a proxy. If the bean has `@Transactional`, `@Async`, `@Cacheable`, method security or an aspect, a `BeanPostProcessor` replaces it with a CGLIB subclass (`OrderService$$SpringCGLIB$$0`) or a JDK dynamic proxy implementing its interfaces. Use `AopUtils.getTargetClass(bean)` or `ClassUtils.getUserClass` to find the real class.

</details>
