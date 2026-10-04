# Jakarta Bean Validation — Interview Questions

## Beginner

### Q1. What is the difference between `@NotNull`, `@NotEmpty` and `@NotBlank`?

<details>
<summary>Answer</summary>

`@NotNull` only rejects `null`. `@NotEmpty` rejects `null` and empty values (`""`, empty collection) but accepts `"   "`. `@NotBlank` (strings only) rejects `null`, empty and whitespace-only strings. Use `@NotBlank` for required text, `@NotEmpty` for required collections, `@NotNull` for required non-string values.

</details>

### Q2. How do you enable validation in a Spring Boot REST API?

<details>
<summary>Answer</summary>

Add `spring-boot-starter-validation`, annotate request DTO fields with constraints, and annotate the controller parameter with `@Valid` (`@Valid @RequestBody CreateUserRequest request`). Spring validates the object after deserialisation; violations raise `MethodArgumentNotValidException`, resolved to 400 by default.

</details>

### Q3. What does `@Valid` do?

<details>
<summary>Answer</summary>

It marks an object for validation: on a controller argument it makes Spring run the validator; on a field, or on a type argument such as `List<@Valid ItemRequest>`, it cascades validation into the nested object or each element. Without it, nested constraints are ignored.

</details>

## Intermediate

### Q4. Why does `@Size(min = 3) String name` accept a request with no name?

<details>
<summary>Answer</summary>

Most built-in constraints consider `null` valid, so that each constraint checks one thing and optional fields can still have format rules. To require the field, add `@NotBlank` (or `@NotNull`).

</details>

### Q5. Where in the request lifecycle does validation run?

<details>
<summary>Answer</summary>

During argument resolution inside the `DispatcherServlet`: the JSON body is converted by the message converter, then `@Valid` triggers the validator, and only if there are no violations does the controller method execute. Filters (including security) and interceptor `preHandle` have already run; the service and repository have not.

</details>

### Q6. Should validation annotations go on entities or DTOs?

<details>
<summary>Answer</summary>

On request DTOs, because rules depend on the operation (create vs update) and validation should reject input at the API boundary with a clean 400. Entities can additionally carry constraints that Hibernate checks before insert/update as a safety net, and the database enforces integrity constraints.

</details>

### Q7. Is `@Email` enough to validate email addresses?

<details>
<summary>Answer</summary>

It checks syntax only and is permissive — `user@localhost` passes. It cannot tell whether the address exists. Combine it with `@NotBlank`, optionally a stricter `@Pattern`, and confirm ownership by sending a verification link.

</details>

## Advanced

### Q8. A nested object's constraints are ignored. Why?

<details>
<summary>Answer</summary>

Validation does not cascade by default. The nested field needs `@Valid` (`@Valid AddressRequest address`), and list elements need `List<@Valid ItemRequest>` (or `@Valid` on the list field). Also confirm the validation starter is present and that the outer parameter has `@Valid`.

</details>

### Q9. Validation passes, but the database still throws a constraint violation on insert. How can that happen?

<details>
<summary>Answer</summary>

DTO validation and database constraints can drift apart: `@Size(max = 200)` on the DTO but `VARCHAR(100)` in the table, a unique constraint that Bean Validation cannot check (duplicate email under concurrency), or fields set by the service rather than the client. Align column sizes with DTO constraints, check uniqueness in the service, and still handle `DataIntegrityViolationException` (409) because concurrent requests can race past the check.

</details>
