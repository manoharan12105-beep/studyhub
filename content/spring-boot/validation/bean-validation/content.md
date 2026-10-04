# Jakarta Bean Validation

**Module:** Validation · **Interview priority:** Core

## Definition

**Jakarta Bean Validation** (formerly JSR 380 / `javax.validation`) is the Java standard for declaring constraints on objects with annotations — `@NotNull`, `@Size`, `@Email` — and checking them with a `Validator`. **Hibernate Validator** is the reference implementation. Spring Boot adds it with `spring-boot-starter-validation`, and Spring MVC runs it automatically on controller arguments annotated with **`@Valid`**.

## Why It Matters

- Never trust client input: validation at the API boundary protects business logic and the database, and gives clients precise, field-level errors.
- `@NotNull` vs `@NotEmpty` vs `@NotBlank` is one of the most common Spring Boot interview questions.
- Knowing *where* validation runs in the request lifecycle explains which exception and status you get.

## Why Validation?

| Without validation | With Bean Validation |
|--------------------|---------------------|
| `if (req.getName() == null || req.getName().isBlank())` in every controller | `@NotBlank String name` — declarative, reusable |
| Bad data reaches the database → constraint violations → 500 | Rejected early with 400 and field errors |
| Inconsistent error messages | One mechanism, one error format |
| Rules scattered | Rules live on the DTO, visible in OpenAPI docs |

Validation is layered: **syntax/format** on DTOs (Bean Validation), **business rules** in services (stock available, email not taken), **integrity** in the database (unique, not null, foreign keys). Bean Validation does not replace the other two.

## Built-in Constraints

| Constraint | Valid when | `null` is | Applies to |
|------------|-----------|-----------|------------|
| `@NotNull` | not `null` | invalid | any type |
| `@NotEmpty` | not `null` and size/length > 0 | invalid | `String`, collection, map, array |
| `@NotBlank` | not `null` and contains at least one non-whitespace character | invalid | `CharSequence` |
| `@Size(min, max)` | length/size within bounds | **valid** | `String`, collection, map, array |
| `@Min(value)` / `@Max(value)` | number ≥ min / ≤ max | **valid** | integer types, `BigDecimal`, `BigInteger` |
| `@Positive` / `@PositiveOrZero` | > 0 / ≥ 0 | **valid** | numbers |
| `@Negative` / `@NegativeOrZero` | < 0 / ≤ 0 | **valid** | numbers |
| `@DecimalMin` / `@DecimalMax` / `@Digits` | decimal bounds / digit counts | **valid** | `BigDecimal`, strings, numbers |
| `@Email` | well-formed email address | **valid** | `CharSequence` |
| `@Pattern(regexp)` | entire value matches the regex | **valid** | `CharSequence` |
| `@Past` / `@Future` / `@PastOrPresent` / `@FutureOrPresent` | date/time relative to now | **valid** | `java.time` types, `Date` |
| `@AssertTrue` / `@AssertFalse` | boolean value | **valid** | `boolean`/`Boolean` |

> [!IMPORTANT]
> Almost every constraint treats **`null` as valid**. `@Size(min = 3) String name` accepts a missing name. Combine with `@NotNull`/`@NotBlank` when the field is required — this separation lets the same constraint work for optional fields.

## @NotNull

The value must be present. For strings, `""` and `"   "` pass. Use for required non-string fields (`@NotNull Long categoryId`, `@NotNull LocalDate dob`) and nested objects.

## @NotEmpty

Not null **and** not empty: `""` fails, but `"   "` passes. Use for collections that need at least one element (`@NotEmpty List<OrderItemRequest> items`).

## @NotBlank

Not null and at least one non-whitespace character: `""` and `"   "` fail. The right choice for required text such as names and passwords.

| Value | `@NotNull` | `@NotEmpty` | `@NotBlank` |
|-------|-----------|-------------|-------------|
| `null` | ✘ | ✘ | ✘ |
| `""` | ✔ | ✘ | ✘ |
| `"   "` | ✔ | ✔ | ✘ |
| `"Asha"` | ✔ | ✔ | ✔ |

### Verifying the behaviour

The program below runs Hibernate Validator directly (no Spring needed) and confirms the table, the "`null` is valid" rule and how permissive `@Email` is.

```java
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ConstraintBehaviourDemo {

    record Name(@NotNull String notNull, @NotEmpty String notEmpty, @NotBlank String notBlank) {
    }

    record OptionalFields(@Size(min = 3) String nickname, @Email String email) {
    }

    public static void main(String[] args) {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();
            String[] values = {null, "", "   ", "Asha"};
            for (String value : values) {
                var failed = validator.validate(new Name(value, value, value)).stream()
                        .map(v -> v.getPropertyPath().toString()).sorted().toList();
                System.out.printf("%-8s fails: %s%n", value == null ? "null" : "\"" + value + "\"", failed);
            }
            System.out.println("@Size(min=3) on null      -> violations: "
                    + validator.validate(new OptionalFields(null, null)).size());
            System.out.println("@Email on user@localhost  -> violations: "
                    + validator.validate(new OptionalFields("abc", "user@localhost")).size());
            System.out.println("@Email on not-an-email    -> violations: "
                    + validator.validate(new OptionalFields("abc", "not-an-email")).size());
        }
    }
}
```

**Output:**

```text
null     fails: [notBlank, notEmpty, notNull]
""       fails: [notBlank, notEmpty]
"   "    fails: [notBlank]
"Asha"   fails: []
@Size(min=3) on null      -> violations: 0
@Email on user@localhost  -> violations: 0
@Email on not-an-email    -> violations: 1
```

## @Size

Length of strings or size of collections: `@Size(min = 8, max = 72) String password`, `@Size(max = 10) List<String> tags`. Keep `max` aligned with the database column length so the API rejects what the database would.

## @Min

Lower bound for integral numbers: `@Min(1) int quantity`. Not for `double`/`float` (rounding); use `@DecimalMin` or `@Positive` there, ideally on `BigDecimal`.

## @Max

Upper bound: `@Max(10) int quantity` ("max 10 per order").

## @Positive

Strictly greater than zero: prices, quantities. `@PositiveOrZero` allows 0 (stock, discount).

## @Negative

Strictly less than zero; rare in APIs (adjustment entries). `@NegativeOrZero` allows 0.

## @Email

A syntactically valid address. Hibernate Validator's check is permissive (for example `user@localhost` passes — no dot required in the domain), so combine with `@Pattern` or verify ownership by sending a confirmation email.

## @Pattern

The **whole** value must match a regular expression: `@Pattern(regexp = "\\d{6}") String pincode`, `@Pattern(regexp = "^[6-9]\\d{9}$") String mobile`. Add a `message` because the default message shows the raw regex.

## @Valid

Triggers validation:

- On a controller parameter: `create(@Valid @RequestBody CreateOrderRequest request)` — Spring validates after JSON conversion, before calling the method.
- On a field or type argument: **cascades** into nested objects and collection elements.

```java
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

record AddressRequest(@NotBlank @Size(max = 120) String line1,
                      @NotBlank String city,
                      @NotBlank @Pattern(regexp = "\\d{6}", message = "must be a 6-digit pincode") String pincode) {
}

record OrderItemRequest(@NotNull Long productId,
                        @Min(1) @Max(10) int quantity) {
}

record CreateOrderRequest(@NotEmpty @Size(max = 50) List<@Valid OrderItemRequest> items,   // validate each element
                          @NotNull @Valid AddressRequest shippingAddress,                   // validate nested object
                          @Size(max = 20) String couponCode) {                              // optional
}
```

Without `@Valid` on `shippingAddress`, an address with a blank city would pass — constraints on nested objects are not checked automatically.

## Validation in DTOs

Put constraints on **request DTOs**, not on entities used as API input:

- Different operations need different rules (create requires a password; update forbids it).
- Entities may also carry constraints — Hibernate validates them before insert/update (`spring.jpa.properties.jakarta.persistence.validation.mode`) — but that is a last line of defence, producing a `ConstraintViolationException` deep in the persistence layer rather than a clean 400.

## Where Validation Happens in the Request Lifecycle

```text
Request ─► filters ─► DispatcherServlet ─► HandlerMapping ─► interceptors.preHandle
        ─► argument resolution:
             1. HttpMessageConverter: JSON → CreateOrderRequest      (bad JSON → 400 HttpMessageNotReadableException)
             2. @Valid → Validator.validate(request)                   (violations → MethodArgumentNotValidException → 400)
        ─► controller method runs ONLY if valid
        ─► service (@Validated method validation, business rules)  ─► repository ─► DB constraints
```

The default 400 response can be replaced by a consistent error body in [Global Exception Handling](../../exception-handling/global-exception-handling/content.md); advanced options (`@Validated`, custom constraints, groups) are in [@Validated, Custom Validators and Validation Errors](../advanced-validation/content.md).

## Common Mistakes

- Missing `spring-boot-starter-validation` — annotations compile (if the API JAR is present transitively) but nothing is validated.
- `@Size`/`@Email` without `@NotBlank` on required fields.
- Forgetting `@Valid` on the controller parameter, on nested objects, or on list elements.
- Using `javax.validation` imports in Boot 3/4.
- `@Min` on `double` fields, or `double` for money.

## Common Interview Traps

- **"`@NotEmpty` rejects whitespace-only strings."** Only `@NotBlank` does.
- **"`@Size(min = 1)` makes a field required."** `null` still passes.
- **"Validation annotations validate automatically everywhere."** Only where a validator is invoked: `@Valid`/`@Validated` at controller arguments, method validation on `@Validated` beans, JPA lifecycle validation, or explicit `Validator` calls.

## Key Takeaways

- Bean Validation = declarative constraints (Jakarta) + Hibernate Validator; enable with the validation starter.
- `@NotNull` ⊂ `@NotEmpty` ⊂ `@NotBlank` in strictness for strings; most other constraints accept `null`.
- `@Valid` triggers validation and cascades into nested objects/elements.
- In Spring MVC, validation runs during argument resolution; failure → `MethodArgumentNotValidException` → 400 before the controller runs.
