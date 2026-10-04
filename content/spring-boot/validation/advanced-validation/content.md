# @Validated, Custom Validators and Validation Errors

**Module:** Validation · **Interview priority:** Frequently asked

## Definition

- **`@Validated`** is Spring's variant of `@Valid`. It supports **validation groups**, and on a class it enables **method validation**: Spring wraps the bean in a proxy that validates method parameters and return values annotated with constraints.
- **Validation errors** surface as different exceptions depending on where validation ran: `MethodArgumentNotValidException` (`@Valid @RequestBody`), `HandlerMethodValidationException` (constraints directly on controller method parameters, Spring 6.1+), and `ConstraintViolationException` (method validation on other beans).
- A **custom validator** is a constraint annotation plus a `ConstraintValidator` implementation for rules the built-in constraints cannot express.

## Why It Matters

- Real rules go beyond `@NotBlank`: strong passwords, `startDate` before `endDate`, allowed values.
- Interviewers ask "`@Valid` vs `@Validated`?", "How do you write a custom validator?" and "How do you return field-level errors?".
- Mapping the different validation exceptions consistently is what makes an API's errors predictable.

## @Valid vs @Validated

| Aspect | `@Valid` (Jakarta) | `@Validated` (Spring) |
|--------|--------------------|------------------------|
| Package | `jakarta.validation` | `org.springframework.validation.annotation` |
| Validation groups | No | Yes: `@Validated(OnCreate.class)` |
| Cascades into nested objects | Yes (on fields/elements) | No — use `@Valid` for nesting |
| On a class | No effect | Enables method validation for the bean (AOP proxy) |
| On a controller `@RequestBody` parameter | Yes | Yes (with optional groups) |
| Typical use | Request bodies, nested objects | Services, `@ConfigurationProperties`, group-based validation |

## Method Validation with @Validated

```java
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

@Service
@Validated                                           // proxy validates constrained parameters/return values
class WalletService {

    BigDecimal debit(@NotBlank String walletId, @Positive BigDecimal amount) {
        return amount;
    }

    int pageSize(@Min(1) int requested) {
        return Math.min(requested, 100);
    }
}
```

A violation throws `jakarta.validation.ConstraintViolationException` **before** the method body runs. Since it is proxy-based, it does not apply to calls from within the same class (self-invocation) — the same limitation as `@Transactional`.

### Controllers in Spring Framework 6.1+

Constraints placed **directly on controller method parameters** (`@RequestParam @Min(1) int page`, `@PathVariable @Positive long id`) are validated by Spring MVC's **built-in method validation** — no `@Validated` needed — and failures raise `HandlerMethodValidationException` (400). If you also put `@Validated` on the controller class, the older AOP-based method validation takes over and failures become `ConstraintViolationException`, which is **not** mapped to 400 by default (it becomes 500 unless you handle it). Spring's guidance: remove class-level `@Validated` from controllers.

## Validation Errors

| Exception | Raised when | Default status | Data |
|-----------|-------------|----------------|------|
| `MethodArgumentNotValidException` | `@Valid`/`@Validated` `@RequestBody` (or model attribute) fails | 400 | `getBindingResult().getFieldErrors()` |
| `HandlerMethodValidationException` | Constraints on controller parameters fail (6.1+) | 400 | `getParameterValidationResults()` |
| `ConstraintViolationException` | `@Validated` bean method validation fails | **500 unless handled** | `getConstraintViolations()` |
| `HttpMessageNotReadableException` | JSON cannot be parsed / converted | 400 | Cause message |
| `MethodArgumentTypeMismatchException` | Parameter conversion fails (`page=abc`) | 400 | Name, value, required type |

`BindingResult` as the parameter directly after the validated argument suppresses the exception and lets the controller inspect errors itself — mostly used in server-rendered forms, rarely in REST APIs.

## Custom Validation

1. Create the constraint annotation with `@Constraint(validatedBy = …)`, plus the three required attributes `message`, `groups`, `payload`.
2. Implement `ConstraintValidator<Annotation, Type>`; return `true` for `null` (leave required-ness to `@NotNull`/`@NotBlank`).
3. Validator instances are created by Spring's `SpringConstraintValidatorFactory` when used in a Spring application, so they **can inject beans** (e.g. a repository) — keep such checks cheap.

Cross-field rules (`password` equals `confirmPassword`, `from` before `to`) use a **class-level** constraint whose validator receives the whole object.

```java
import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.time.LocalDate;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = ValidDateRangeValidator.class)
@interface ValidDateRange {
    String message() default "'from' must not be after 'to'";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

class ValidDateRangeValidator implements ConstraintValidator<ValidDateRange, BookingRequest> {
    @Override
    public boolean isValid(BookingRequest value, ConstraintValidatorContext context) {
        if (value == null || value.from() == null || value.to() == null) {
            return true;
        }
        return !value.from().isAfter(value.to());
    }
}

@ValidDateRange
record BookingRequest(LocalDate from, LocalDate to) {
}
```

## Validation Groups Awareness

Groups let one DTO carry different rules per operation:

```java
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;

interface OnCreate {
}

interface OnUpdate {
}

record ProductRequest(@Null(groups = OnCreate.class) @NotNull(groups = OnUpdate.class) Long id,
                      @NotNull(groups = {OnCreate.class, OnUpdate.class}) String name) {
}
```

Then `create(@Validated(OnCreate.class) @RequestBody ProductRequest r)`. Constraints without `groups` belong to the `Default` group, which is **not** validated when a specific group is requested (unless the group extends `Default`). Many teams prefer **separate DTOs** per operation — simpler than groups.

## Global Validation Handling

The program below shows a realistic setup in one file: a custom `@StrongPassword` constraint, body validation, a constrained `@RequestParam`, and a `@RestControllerAdvice` that turns both kinds of failures into RFC 9457 `ProblemDetail` responses with field-level errors. The complete handler architecture is in [Global Exception Handling](../../exception-handling/global-exception-handling/content.md).

```java
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

public class ValidationErrorsDemo {

    @Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
    @Retention(RetentionPolicy.RUNTIME)
    @Constraint(validatedBy = StrongPasswordValidator.class)
    @interface StrongPassword {
        String message() default "must have 8+ characters including a digit and an upper-case letter";

        Class<?>[] groups() default {};

        Class<? extends Payload>[] payload() default {};
    }

    public static class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {
        @Override
        public boolean isValid(String value, ConstraintValidatorContext context) {
            if (value == null) {
                return true;                                   // required-ness is @NotBlank's job
            }
            return value.length() >= 8
                    && value.chars().anyMatch(Character::isDigit)
                    && value.chars().anyMatch(Character::isUpperCase);
        }
    }

    record RegisterRequest(@NotBlank String name, @Email String email, @StrongPassword String password) {
    }

    @RestController
    static class UserController {
        @PostMapping("/api/users")
        String register(@Valid @RequestBody RegisterRequest request) {
            return "registered " + request.name();
        }

        @GetMapping("/api/users")
        String list(@RequestParam @Min(1) int page) {          // built-in method validation (Spring 6.1+)
            return "page " + page;
        }
    }

    @RestControllerAdvice
    static class ValidationErrorHandler {
        @ExceptionHandler(MethodArgumentNotValidException.class)
        ProblemDetail onInvalidBody(MethodArgumentNotValidException ex) {
            ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Invalid request body");
            problem.setProperty("errors", ex.getBindingResult().getFieldErrors().stream()
                    .map(e -> e.getField() + ": " + e.getDefaultMessage()).sorted().toList());
            return problem;
        }

        @ExceptionHandler(HandlerMethodValidationException.class)
        ProblemDetail onInvalidParameters(HandlerMethodValidationException ex) {
            ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Invalid parameters");
            problem.setProperty("errors", ex.getParameterValidationResults().stream()
                    .flatMap(r -> r.getResolvableErrors().stream()
                            .map(e -> r.getMethodParameter().getParameterName() + ": " + e.getDefaultMessage()))
                    .toList());
            return problem;
        }
    }

    public static void main(String[] args) throws Exception {
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new UserController())
                .setControllerAdvice(new ValidationErrorHandler())
                .build();

        String body = "{\"name\":\" \",\"email\":\"asha-at-example\",\"password\":\"secret\"}";
        var invalidBody = mvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON).content(body))
                .andReturn().getResponse();
        System.out.println(invalidBody.getStatus() + " " + invalidBody.getContentAsString());

        var invalidParam = mvc.perform(get("/api/users").param("page", "0")).andReturn().getResponse();
        System.out.println(invalidParam.getStatus() + " " + invalidParam.getContentAsString());

        var valid = mvc.perform(get("/api/users").param("page", "2")).andReturn().getResponse();
        System.out.println(valid.getStatus() + " " + valid.getContentAsString());
    }
}
```

**Output:**

```text
400 {"detail":"Invalid request body","instance":"/api/users","status":400,"title":"Bad Request","errors":["email: must be a well-formed email address","name: must not be blank","password: must have 8+ characters including a digit and an upper-case letter"]}
400 {"detail":"Invalid parameters","instance":"/api/users","status":400,"title":"Bad Request","errors":["page: must be greater than or equal to 1"]}
200 page 2
```

The validator class is `public` because Hibernate Validator instantiates it through its public no-argument constructor (top-level classes in your project normally are). With Jackson 3 (Boot 4), `ProblemDetail`'s standard fields are written in alphabetical order.

## Internal Behavior

- `@Valid @RequestBody` validation is performed by `RequestResponseBodyMethodProcessor` using the MVC `Validator` (Boot auto-configures a `LocalValidatorFactoryBean` backed by Hibernate Validator).
- Built-in controller method validation (6.1+) is performed by `RequestMappingHandlerAdapter` through a `MethodValidator` when parameters carry constraints.
- Class-level `@Validated` on other beans is processed by `MethodValidationPostProcessor` (auto-configured by Boot), which creates an AOP proxy with a `MethodValidationInterceptor`.
- Error messages come from `ValidationMessages.properties` (customisable, internationalised) or the annotation's `message`; `{min}`/`{max}` placeholders are interpolated.

## Common Mistakes

- Class-level `@Validated` on a controller in Spring 6.1+, turning 400s into 500s (`ConstraintViolationException`).
- Not handling `ConstraintViolationException` from service-level validation.
- A custom validator that rejects `null`, making optional fields impossible.
- Expensive database checks inside validators on every request (and they still race under concurrency — keep a unique constraint).
- Expecting `@Validated` on a field to cascade (use `@Valid`).

## Common Interview Traps

- **"`@Validated` and `@Valid` are interchangeable."** `@Validated` adds groups and method validation but does not cascade; `@Valid` cascades but has no groups.
- **"Method validation works on any method call."** It is proxy-based; self-invocation and non-bean objects are not validated.
- **"All validation failures are 400."** `ConstraintViolationException` from method validation is 500 unless you map it.

## Key Takeaways

- `@Valid`: trigger + cascade. `@Validated`: groups + method validation via proxy.
- Know the three exceptions: `MethodArgumentNotValidException`, `HandlerMethodValidationException`, `ConstraintViolationException` — map all to 400 with field errors.
- Custom constraint = annotation (`message`, `groups`, `payload`) + `ConstraintValidator` that treats `null` as valid; class-level constraints for cross-field rules.
