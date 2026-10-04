# @Autowired, @Qualifier and @Primary — Practice

### P1. Which wins?

**Difficulty:** Easy · **Type:** MCQ

`StripeGateway` is `@Primary`; `RazorpayGateway` is not. A constructor parameter is `@Qualifier("razorpayGateway") PaymentGateway gateway`. What is injected?

- A) `StripeGateway`
- B) `RazorpayGateway`
- C) Startup fails: conflict between `@Primary` and `@Qualifier`
- D) `null`

<details>
<summary>Answer</summary>

**Answer:** B) `RazorpayGateway`

**Explanation:** A qualifier at the injection point overrides the provider-side `@Primary` default.

</details>

### P2. Ambiguity error

**Difficulty:** Easy · **Type:** Debugging

Startup fails with `NoUniqueBeanDefinitionException: expected single matching bean but found 2: emailSender,smsSender` for `NotificationService(Sender sender)`. Give three fixes.

<details>
<summary>Answer</summary>

1. Mark one implementation `@Primary`.
2. Add `@Qualifier("emailSender")` to the parameter.
3. Inject `List<Sender>` (or `Map<String, Sender>`) if the service should use both.

(Renaming the parameter to `emailSender` also works through the name fallback, but it is fragile.)

</details>

### P3. Strategy without switch

**Difficulty:** Medium · **Type:** Coding

Shipping cost depends on the courier (`"bluedart"`, `"delhivery"`). Design beans so that adding a courier needs no change in `ShippingService`.

<details>
<summary>Answer</summary>

```java
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

interface CourierRate {
    String courier();

    BigDecimal cost(int weightGrams);
}

@Component
class BlueDartRate implements CourierRate {
    public String courier() {
        return "bluedart";
    }

    public BigDecimal cost(int weightGrams) {
        return BigDecimal.valueOf(50 + weightGrams / 100);
    }
}

@Service
class ShippingService {
    private final Map<String, CourierRate> rates;

    ShippingService(List<CourierRate> all) {
        this.rates = all.stream().collect(Collectors.toMap(CourierRate::courier, Function.identity()));
    }

    BigDecimal cost(String courier, int weightGrams) {
        CourierRate rate = rates.get(courier);
        if (rate == null) {
            throw new IllegalArgumentException("Unknown courier: " + courier);
        }
        return rate.cost(weightGrams);
    }
}
```

Each courier is a bean; the list injection picks up new ones automatically. Keying by a method (`courier()`) instead of the bean name keeps business keys independent of Spring naming.

</details>

### P4. Silent behaviour change

**Difficulty:** Hard · **Type:** Scenario

`ReportService(DataSource reportingDataSource)` worked because the parameter name matched the bean `reportingDataSource`. After someone marked `mainDataSource` as `@Primary`, reports started reading from the main database. Explain and fix.

<details>
<summary>Answer</summary>

Before, there was no primary, so Spring fell back to name matching. `@Primary` is evaluated before the name fallback, so the main data source now wins. Fix: `ReportService(@Qualifier("reportingDataSource") DataSource dataSource)` — explicit qualifiers are immune to such changes.

</details>
