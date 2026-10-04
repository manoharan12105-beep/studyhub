# IoC and Dependency Injection in Spring — Practice

### P1. Principle or technique?

**Difficulty:** Easy · **Type:** MCQ

Which statement is correct?

- A) DI is a principle and IoC is one way to implement it
- B) IoC is a principle and DI is one way to implement it
- C) IoC and DI are two names for the same thing
- D) IoC applies only to web applications

<details>
<summary>Answer</summary>

**Answer:** B) IoC is a principle and DI is one way to implement it

**Explanation:** DI applies IoC to obtaining dependencies; events, template methods and callbacks are other forms of IoC.

</details>

### P2. Spot the coupling

**Difficulty:** Easy · **Type:** Code analysis

```java
@Service
class InvoiceService {
    private final SmtpMailer mailer;

    InvoiceService(SmtpMailer mailer) {
        this.mailer = mailer;
    }
}
```

DI is used. What is still wrong, and how would you improve it?

<details>
<summary>Answer</summary>

The dependency is a concrete class, so `InvoiceService` is coupled to SMTP (DIP is not applied). Introduce an interface `Mailer` owned by the invoicing module, have `SmtpMailer` implement it, and inject `Mailer`. Tests can then pass a fake implementation.

</details>

### P3. IoC beyond DI

**Difficulty:** Medium · **Type:** Conceptual

Give two examples of IoC in a Spring Boot application that are not dependency injection.

<details>
<summary>Answer</summary>

`DispatcherServlet` calling your `@GetMapping` method when a request arrives; the container calling `@PostConstruct`/`@PreDestroy`; `@Scheduled` methods invoked by the scheduler; `@EventListener` methods invoked when an event is published; `JdbcTemplate` calling your `RowMapper` for each row.

</details>

### P4. Missing bean

**Difficulty:** Medium · **Type:** Debugging

Startup fails: "Parameter 0 of constructor in CheckoutService required a bean of type 'PaymentGateway' that could not be found." The implementation `RazorpayGateway implements PaymentGateway` exists. List three likely causes.

<details>
<summary>Answer</summary>

1. `RazorpayGateway` has no stereotype annotation and no `@Bean` method creates it.
2. It is outside the component-scan base packages.
3. It is conditional and the condition is false — for example `@Profile("prod")` while running the `dev` profile, or a `@ConditionalOnProperty` whose property is missing.

</details>
