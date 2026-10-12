# Validating AI Output: DTOs, Constraints and Business Rules

**Module:** Spring AI: ChatClient · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Separate the three layers of checks: shape (schema), field constraints (Bean Validation) and business rules.
- Validate records produced by `entity(...)` with Jakarta Bean Validation.
- Re-ask the model with precise feedback a bounded number of times, then fall back.
- Constrain output up front with enums, limits and instructions.

## Definition

**Output validation** is the deterministic check your code applies to a parsed model result before using it. Structured output gives you a typed object; validation decides whether that object's **values** are acceptable: required fields present, numbers in range, strings within length, references that exist and belong to the caller, totals that add up.

## Why It Matters

A model can produce perfectly shaped JSON with a wrong answer index, a negative price, an order id that belongs to another customer, or a summary three times longer than allowed. If that object reaches your database, an e-mail or a payment, the bug is yours. Validation turns "usually right" into "right or rejected".

## How It Works

```text
model text ──► parse (entity / converter)        shape: is it JSON of this type?
           ──► Bean Validation (@NotBlank, @Size…) field constraints
           ──► business rules (Java code)          cross-field and domain checks
           ──► accept │ re-ask with errors (bounded) │ fall back / human review
```

| Layer | Tool | Examples |
|-------|------|----------|
| Shape | `entity(...)`, `validateSchema()`, native structured output | Required properties, types, enum values |
| Field constraints | Jakarta Bean Validation (`spring-boot-starter-validation`) | `@NotBlank`, `@Size(max = 120)`, `@Min(0) @Max(3)`, `@Pattern` |
| Business rules | Plain Java with access to your data | Answer index matches an option; order belongs to the user; totals add up |

### Constrain before you validate

You reduce failures by telling the model the rules up front: enums for closed sets, `@JsonPropertyDescription` with limits, low temperature, a system instruction listing constraints. Validation then catches what still slips through.

### Re-asking with feedback

When validation fails, you can call the model again with the specific errors — the same idea `validateSchema()` applies to schema errors. Keep it **bounded** (one or two retries), because each retry costs a full call, and have a deterministic fallback.

## Example

A quiz generator that validates a question with Bean Validation and a business rule, re-asks once with the errors, and gives up after that.

```java
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;

public class QuizValidationDemo {

    record QuizQuestion(
            @NotBlank @Size(max = 200) String question,
            @Size(min = 4, max = 4) List<@NotBlank String> options,
            @Min(0) @Max(3) int answerIndex) {}

    static final Validator VALIDATOR = Validation.buildDefaultValidatorFactory().getValidator();

    static List<String> problems(QuizQuestion q) {
        Set<ConstraintViolation<QuizQuestion>> violations = VALIDATOR.validate(q);
        List<String> errors = violations.stream()
                .map(v -> v.getPropertyPath() + " " + v.getMessage())
                .sorted()
                .collect(Collectors.toList());
        if (q.options() != null && q.options().stream().distinct().count() != q.options().size()) {
            errors.add("options must be distinct");          // business rule
        }
        return errors;
    }

    static QuizQuestion generate(ChatClient client, String topic) {
        String feedback = "";
        for (int attempt = 1; attempt <= 2; attempt++) {
            String hint = feedback;
            QuizQuestion q = client.prompt()
                    .system("Write one multiple-choice question with exactly 4 distinct options.")
                    .user(u -> u.text("Topic: {topic}\n{feedback}").param("topic", topic).param("feedback", hint))
                    .call()
                    .entity(QuizQuestion.class);
            List<String> errors = problems(q);
            System.out.println("attempt " + attempt + ": " + (errors.isEmpty() ? "valid" : errors));
            if (errors.isEmpty()) {
                return q;
            }
            feedback = "Your previous answer was invalid: " + String.join("; ", errors) + ". Fix these problems.";
        }
        throw new IllegalStateException("No valid question after 2 attempts");
    }

    public static void main(String[] args) {
        ScriptedChatModel model = new ScriptedChatModel()
                .reply("{\"question\":\"Which keyword declares a constant?\",\"options\":[\"final\",\"static\",\"final\",\"const\"],\"answerIndex\":5}")
                .reply("{\"question\":\"Which keyword declares a constant?\",\"options\":[\"final\",\"static\",\"var\",\"const\"],\"answerIndex\":0}");
        QuizQuestion q = generate(ChatClient.create(model), "Java keywords");
        System.out.println("accepted: " + q.options().get(q.answerIndex()));
        System.out.println("feedback sent: " + model.lastPrompt().getUserMessage().getText().lines().skip(1).findFirst().orElse(""));
    }
}
```

**Output:**

```text
attempt 1: [answerIndex must be less than or equal to 3, options must be distinct]
attempt 2: valid
accepted: final
feedback sent: Your previous answer was invalid: answerIndex must be less than or equal to 3; options must be distinct. Fix these problems.
```

### Code walkthrough

- The record carries Jakarta constraints; `Validation.buildDefaultValidatorFactory()` uses Hibernate Validator from `spring-boot-starter-validation`. In a Spring bean, inject `jakarta.validation.Validator` instead.
- `problems(...)` combines constraint violations with a business rule that annotations cannot express (distinct options). Sorting makes messages stable for logs and tests.
- The loop makes at most two calls, and the second prompt contains the exact errors. The retry is not blind, so the model can fix the specific problem.
- After two failures it throws instead of returning bad data; the caller decides the fallback (skip the question, use a question bank, ask a human).

## Common Mistakes and Troubleshooting

- **Trusting `@Valid` on a controller to validate AI output.** `@Valid` validates *incoming requests*; output created inside a service must be validated explicitly.
- **Unbounded retry loops.** A model that keeps failing will burn tokens forever; cap attempts and alert on high retry rates.
- **Feedback that leaks secrets.** Error messages sent back to the model should describe the problem, not include other users' data or internal identifiers.
- **Validating only the schema.** `validateSchema()` cannot check that an order id belongs to the user; that check needs your database and the current principal.

## Production Considerations

- Log validation failures with the field names and prompt version (not full prompt text) and track the failure rate per prompt version — a rising rate signals a prompt or model regression.
- For irreversible actions (refunds, e-mails, deletions), add human review even when validation passes ([Human Approval](../../spring-ai-advanced/human-approval-for-tools/content.md)).
- Keep validation rules in shared code so the same rules apply to AI-produced and human-entered data.

## Common Interview Traps

- **"Structured output removes the need for validation."** It removes parsing work; values still need checking.
- **"Retrying until it works is fine."** Retries cost money and latency; bound them and fall back.
- **"Validation is the model's job — just tell it the rules."** Instructions reduce errors; deterministic code enforces rules.

## Key Takeaways

- Three layers: shape, field constraints, business rules.
- Validate parsed output explicitly with Bean Validation and Java checks.
- Re-ask with precise errors at most once or twice, then fall back deterministically.

## Official References

- [Structured output: schema validation and self-correction](https://docs.spring.io/spring-ai/reference/api/structured-output/validation.html)
- [Spring Boot validation](https://docs.spring.io/spring-boot/reference/io/validation.html)
- [Jakarta Bean Validation](https://beanvalidation.org/)
