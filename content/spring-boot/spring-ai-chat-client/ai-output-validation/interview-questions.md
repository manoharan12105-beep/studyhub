# Validating AI Output: DTOs, Constraints and Business Rules — Interview Questions

## Beginner

### Q1. Why validate output that already matches the JSON Schema?

**Style:** Why

<details>
<summary>Answer</summary>

The schema guarantees types and required fields, not values. The model can return an answer index out of range, an over-long summary, duplicate options or an id that belongs to someone else. Bean Validation and business rules check values before the object is used.

</details>

### Q2. Does `@Valid` on a controller parameter validate the model's output?

**Style:** Trap

<details>
<summary>Answer</summary>

No. `@Valid` validates the incoming request body. Output produced inside a service must be validated explicitly — inject `jakarta.validation.Validator` and call `validate(result)`, or annotate a service method's return value with `@Valid` on a `@Validated` bean.

</details>

## Intermediate

### Q3. What are the three layers of checks for AI output?

**Style:** Direct

<details>
<summary>Answer</summary>

Shape (is it parseable JSON of the expected type — `entity`, `validateSchema`, native output), field constraints (Bean Validation annotations such as `@NotBlank`, `@Size`, `@Min`), and business rules (Java code with access to your data and the current user: cross-field checks, ownership, totals).

</details>

### Q4. How would you implement a retry when validation fails, and what limits do you set?

**Style:** How

<details>
<summary>Answer</summary>

Call the model again with the specific validation errors in the prompt, so the retry is informed rather than blind. Cap attempts (one or two), measure the retry rate, and after the cap fall back deterministically — a default, a cached answer, a human queue or an error. Every retry costs a full call.

</details>

## Advanced

### Q5. An AI feature extracts refund requests from e-mails and calls a refund service. Where do you put validation and approval?

**Style:** Scenario

<details>
<summary>Answer</summary>

Parse into a typed record, validate fields (amount positive, currency known, order id format), then apply business rules using your database: the order exists, belongs to the e-mail's verified customer, is refundable, and the amount does not exceed what was paid. Only then create a refund *request*; above a threshold or on any doubt, require human approval. The model never calls the refund service directly.

</details>

### Q6. How can validation failures help you detect a regression?

**Style:** Design

<details>
<summary>Answer</summary>

Record a metric per prompt version and model (validation failures, retries, fallbacks). A jump after a prompt edit or a provider model update shows a regression before users complain, and the logged field names show which part of the output degraded.

</details>
