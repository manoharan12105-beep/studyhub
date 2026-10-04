# @Validated, Custom Validators and Validation Errors — Interview Questions

## Beginner

### Q1. What is the difference between `@Valid` and `@Validated`?

<details>
<summary>Answer</summary>

`@Valid` is the Jakarta annotation that triggers validation and cascades into nested objects and collection elements. `@Validated` is Spring's annotation that additionally supports validation groups and, placed on a class, enables method-level validation through a proxy; it does not cascade by itself.

</details>

### Q2. How do you create a custom validation annotation?

<details>
<summary>Answer</summary>

Declare an annotation with `@Constraint(validatedBy = MyValidator.class)`, `@Target`, `@Retention(RUNTIME)` and the attributes `message`, `groups` and `payload`. Implement `ConstraintValidator<MyAnnotation, FieldType>` with `isValid`, returning `true` for `null` so required-ness stays with `@NotNull`/`@NotBlank`. Use it like any built-in constraint.

</details>

### Q3. Which exception does Spring throw when `@Valid @RequestBody` fails?

<details>
<summary>Answer</summary>

`MethodArgumentNotValidException`, which contains a `BindingResult` with field errors. Spring maps it to 400 Bad Request by default; a `@RestControllerAdvice` can turn it into a structured error body.

</details>

## Intermediate

### Q4. How do you validate a `@RequestParam` or `@PathVariable`?

<details>
<summary>Answer</summary>

Put constraints directly on the parameter (`@RequestParam @Min(1) int page`). Since Spring Framework 6.1, Spring MVC validates such parameters itself and raises `HandlerMethodValidationException` (400). In older versions, you needed `@Validated` on the controller class, which uses AOP method validation and raises `ConstraintViolationException`.

</details>

### Q5. How do you validate cross-field rules such as "password equals confirmPassword"?

<details>
<summary>Answer</summary>

With a class-level constraint: an annotation with `@Target(TYPE)` placed on the DTO, and a `ConstraintValidator<Annotation, Dto>` that receives the whole object and compares the fields. To report the error on a specific field, use `context.buildConstraintViolationWithTemplate(...).addPropertyNode("confirmPassword").addConstraintViolation()` and disable the default violation.

</details>

### Q6. What are validation groups, and when would you use them?

<details>
<summary>Answer</summary>

Marker interfaces assigned to constraints (`groups = OnCreate.class`) so a subset can be validated with `@Validated(OnCreate.class)` — for example `id` must be null on create but present on update. Constraints without groups belong to `Default`, which is skipped when another group is requested unless the group extends `Default`. Separate DTOs per operation are often clearer.

</details>

## Advanced

### Q7. A service annotated with `@Validated` throws `ConstraintViolationException` and clients get 500. Why, and what do you do?

<details>
<summary>Answer</summary>

Method validation on non-controller beans throws `ConstraintViolationException`, which Spring MVC does not map to a status by default, so it falls through to 500. Add an `@ExceptionHandler(ConstraintViolationException.class)` returning 400 with the violations (property path and message). Also consider whether the validation belongs at the controller boundary instead.

</details>

### Q8. Why did adding `@Validated` to a controller class change the error from 400 to 500 after upgrading to Spring 6.1?

<details>
<summary>Answer</summary>

With class-level `@Validated`, the controller is proxied by `MethodValidationPostProcessor` and parameter constraints are checked by the AOP interceptor, which throws `ConstraintViolationException` (unmapped → 500) instead of Spring MVC's built-in `HandlerMethodValidationException` (400). Remove the class-level `@Validated` to use the built-in support, or map `ConstraintViolationException` explicitly.

</details>

### Q9. Can a custom `ConstraintValidator` use Spring beans, and should it?

<details>
<summary>Answer</summary>

Yes: in a Spring application, validators are created by `SpringConstraintValidatorFactory`, so constructor injection of beans (for example a repository to check uniqueness) works. Use it sparingly: validation runs on every request and may run outside transactions, and a uniqueness check is a race condition anyway — the database unique constraint must remain the source of truth, with a 409 mapping.

</details>
