# @Validated, Custom Validators and Validation Errors — Practice

### P1. Groups support

**Difficulty:** Easy · **Type:** MCQ

Which annotation lets you validate only the `OnCreate` group of a request DTO?

- A) `@Valid(OnCreate.class)`
- B) `@Validated(OnCreate.class)`
- C) `@NotNull(OnCreate.class)`
- D) `@Constraint(OnCreate.class)`

<details>
<summary>Answer</summary>

**Answer:** B) `@Validated(OnCreate.class)`

**Explanation:** `@Valid` has no attributes; groups are a Spring `@Validated` feature at the injection point.

</details>

### P2. Which exception?

**Difficulty:** Medium · **Type:** Behavior

Name the exception for each failure (Spring Boot 3.2+/4): (a) `@Valid @RequestBody` DTO has a blank name; (b) `@RequestParam @Max(100) int size` receives 500; (c) a `@Validated` service method `transfer(@Positive BigDecimal amount)` receives -5.

<details>
<summary>Answer</summary>

(a) `MethodArgumentNotValidException` (400). (b) `HandlerMethodValidationException` (400). (c) `ConstraintViolationException` (500 unless handled).

</details>

### P3. Indian mobile number constraint

**Difficulty:** Medium · **Type:** Coding

Write a reusable `@IndianMobile` constraint: 10 digits starting with 6–9, optionally prefixed with `+91`. `null` is valid.

<details>
<summary>Answer</summary>

```java
import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.regex.Pattern;

@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = IndianMobileValidator.class)
@interface IndianMobile {
    String message() default "must be a valid Indian mobile number";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

class IndianMobileValidator implements ConstraintValidator<IndianMobile, String> {
    private static final Pattern MOBILE = Pattern.compile("^(\\+91)?[6-9]\\d{9}$");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return value == null || MOBILE.matcher(value).matches();
    }
}
```

(A simpler alternative is a composed constraint: an annotation meta-annotated with `@Pattern(regexp = …)` and `@Constraint(validatedBy = {})`.)

</details>

### P4. Silent 500s

**Difficulty:** Hard · **Type:** Debugging

After upgrading to Spring Boot 3.2, invalid `page` query parameters return 500 with `ConstraintViolationException` in logs. The controller class has `@Validated` and the parameter `@Min(0) int page`. Give the minimal fix.

<details>
<summary>Answer</summary>

Remove `@Validated` from the controller class so Spring MVC's built-in method validation handles the constraint and raises `HandlerMethodValidationException`, mapped to 400. (Alternatively keep it and add an exception handler for `ConstraintViolationException` returning 400.)

</details>
