# Constructor, Setter and Field Injection — Practice

### P1. Pick the style

**Difficulty:** Easy · **Type:** MCQ

`InvoiceService` cannot work without `InvoiceRepository`, and may use a `TaxCalculator` if one is configured. Best design?

- A) Field injection for both
- B) Constructor injection for `InvoiceRepository`; optional injection (`ObjectProvider` or setter) for `TaxCalculator`
- C) Setter injection for both
- D) Create both with `new` inside the constructor

<details>
<summary>Answer</summary>

**Answer:** B) Constructor injection for `InvoiceRepository`; optional injection (`ObjectProvider` or setter) for `TaxCalculator`

**Explanation:** Required dependencies belong in the constructor; optional ones should not block construction.

</details>

### P2. Two constructors

**Difficulty:** Medium · **Type:** Behavior

```java
@Service
class PriceService {
    private PriceRepository repository;

    PriceService() {
    }

    PriceService(PriceRepository repository) {
        this.repository = repository;
    }

    BigDecimal price(String sku) {
        return repository.find(sku);
    }
}
```

What happens when `price()` is called?

<details>
<summary>Answer</summary>

With two constructors and no `@Autowired`, Spring uses the no-arg constructor, so `repository` stays `null` and `price()` throws `NullPointerException`. Remove the no-arg constructor or annotate the other one with `@Autowired`, and make the field `final`.

</details>

### P3. Refactor for testability

**Difficulty:** Medium · **Type:** Coding

Refactor to constructor injection and show a plain unit test setup line.

```java
@Service
class OtpService {
    @Autowired
    private SmsSender smsSender;
    @Autowired
    private OtpStore otpStore;
}
```

<details>
<summary>Answer</summary>

```java
import org.springframework.stereotype.Service;

interface SmsSender {
    void send(String phone, String text);
}

interface OtpStore {
    void save(String phone, String otp);
}

@Service
class OtpService {
    private final SmsSender smsSender;
    private final OtpStore otpStore;

    OtpService(SmsSender smsSender, OtpStore otpStore) {
        this.smsSender = smsSender;
        this.otpStore = otpStore;
    }
}
```

Test setup without Spring: `OtpService service = new OtpService((phone, text) -> sent.add(text), new InMemoryOtpStore());`

</details>

### P4. Long constructor

**Difficulty:** Hard · **Type:** Scenario

A reviewer complains that `OrderService`'s constructor has nine parameters and suggests switching to field injection "to make it cleaner". How do you respond?

<details>
<summary>Answer</summary>

Field injection would hide the problem, not fix it. Nine collaborators indicate the class has too many responsibilities. Split it — for example extract pricing, inventory reservation and notification into separate services or a facade — so each class has a short, honest constructor.

</details>
