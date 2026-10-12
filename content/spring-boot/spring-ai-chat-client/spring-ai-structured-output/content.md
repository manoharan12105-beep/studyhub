# Structured Output: Mapping Responses to Records

**Module:** Spring AI: ChatClient · **Interview priority:** Core · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Map model output to records and generic types with `entity(...)`.
- Explain what Spring AI adds to the prompt and how the reply is parsed.
- Make parsing reliable with `validateSchema()` and `useProviderStructuredOutput()`.
- Diagnose parsing failures and choose a fallback.

## Definition

**Structured output** turns a model's text reply into a typed Java object. `entity(Type.class)` generates a JSON Schema from the type, asks the model to answer with matching JSON, and deserialises the reply with Jackson. The lower-level building block is `StructuredOutputConverter<T>` — `BeanOutputConverter`, `MapOutputConverter`, `ListOutputConverter` or your own. Two optional **reliability switches** (new in 2.0) make it stricter: `validateSchema()` validates the JSON and retries with the error message; `useProviderStructuredOutput()` sends the schema to the provider as an API-level constraint when the model supports it.

## Why It Matters

Downstream code needs fields, not prose: a quiz needs questions and options, a classifier needs an enum, an extractor needs amounts and dates. Typed output lets you validate, store and act on model results with normal Java code — and it is one of the most common interview topics about Spring AI.

## How It Works

1. `entity(StudyCard.class)` asks `BeanOutputConverter` for **format instructions** containing a JSON Schema derived from the record (DRAFT 2020-12; fields are `required`, `additionalProperties` is false).
2. Spring AI appends the instructions to the prompt (in 2.0.1 they are added to the user message) and sends the request — through `call()` only.
3. The reply text is parsed by Jackson into the record. A reply wrapped in a ```` ```json ```` fence is accepted; prose before or after the JSON is not.
4. With `validateSchema()`, the `StructuredOutputValidationAdvisor` validates the JSON against the schema; on failure it appends the validation error to the prompt and calls the model again (up to 3 attempts by default).
5. With `useProviderStructuredOutput()`, the schema goes to the provider as a native constraint (OpenAI Structured Outputs, Anthropic, Gemini, Mistral, some Ollama models). Models without support ignore the switch.

The format instructions sent for a two-field record look like this (captured from a real request):

````text
Your response should be in JSON format.
Do not include any explanations, only provide a RFC8259 compliant JSON response following this format without deviation.
Do not include markdown code blocks in your response.
Remove the ```json markdown from the output.
Here is the JSON Schema instance your output must adhere to:
```{
  "$schema" : "https://json-schema.org/draft/2020-12/schema",
  "type" : "object",
  "properties" : {
    "back" : {
      "type" : "string"
    },
    "front" : {
      "type" : "string"
    }
  },
  "required" : [ "back", "front" ],
  "additionalProperties" : false
}```
````

## API Summary

| Need | Call |
|------|------|
| One object | `.call().entity(StudyCard.class)` |
| A list or map | `.call().entity(new ParameterizedTypeReference<List<StudyCard>>() {})` |
| Object plus usage metadata | `.call().responseEntity(StudyCard.class)` → `result.entity()`, `result.response()` |
| Retry on invalid JSON | `.entity(StudyCard.class, spec -> spec.validateSchema())` |
| Native schema enforcement | `.entity(StudyCard.class, spec -> spec.useProviderStructuredOutput())` |
| Both | `spec -> spec.useProviderStructuredOutput().validateSchema()` |
| Lenient or non-JSON parsing | `.entity(new MyConverter())` implementing `StructuredOutputConverter<T>` |

**Design the type for the model:** use records with clear field names, enums for closed sets of values, `@JsonPropertyDescription` to explain a field, and wrapper records instead of top-level lists when using native output with OpenAI (its Structured Outputs API rejects a top-level array).

## Example

```java
import java.util.List;

import com.example.studyai.lab.ScriptedChatModel;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.ResponseEntity;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.core.ParameterizedTypeReference;

public class StructuredOutputDemo {

    enum Level { BEGINNER, INTERMEDIATE, ADVANCED }

    record StudyCard(
            @JsonPropertyDescription("A question that fits on one line") String front,
            @JsonPropertyDescription("A complete answer in at most two sentences") String back,
            Level level) {}

    public static void main(String[] args) {
        // The generated schema: enum values and descriptions are part of it
        String schema = new BeanOutputConverter<>(StudyCard.class).getJsonSchema();
        System.out.println("Schema mentions enum: " + schema.contains("\"BEGINNER\""));
        System.out.println("Schema has description: " + schema.contains("fits on one line"));

        ScriptedChatModel model = new ScriptedChatModel()
                .reply("{\"front\":\"What is a record?\",\"back\":\"An immutable data carrier.\",\"level\":\"BEGINNER\"}")
                .reply("[{\"front\":\"What is var?\",\"back\":\"Local type inference.\",\"level\":\"BEGINNER\"},"
                        + "{\"front\":\"What is a sealed class?\",\"back\":\"A class with a fixed set of subclasses.\",\"level\":\"INTERMEDIATE\"}]")
                .reply("Sure! Here is your card: {\"front\":\"Q\"}")
                .reply("{\"front\":\"What is JIT?\"}")
                .reply("{\"front\":\"What is JIT?\",\"back\":\"Compilation of hot bytecode at run time.\",\"level\":\"ADVANCED\"}");
        ChatClient client = ChatClient.create(model);

        StudyCard card = client.prompt().user("Make one card about records.").call().entity(StudyCard.class);
        System.out.println("1 " + card);

        List<StudyCard> cards = client.prompt().user("Make two cards.").call()
                .entity(new ParameterizedTypeReference<List<StudyCard>>() {});
        System.out.println("2 " + cards.size() + " cards, second level " + cards.get(1).level());

        try {
            client.prompt().user("Make a card.").call().entity(StudyCard.class);
        } catch (RuntimeException e) {
            System.out.println("3 " + e.getClass().getSimpleName() + ": " + e.getMessage().lines().findFirst().orElse(""));
        }

        int before = model.prompts().size();
        ResponseEntity<ChatResponse, StudyCard> validated = client.prompt().user("Make a card about JIT.").call()
                .responseEntity(StudyCard.class, spec -> spec.validateSchema());
        System.out.println("4 " + validated.entity() + " after " + (model.prompts().size() - before) + " model calls");
        System.out.println("  retry prompt starts with: " + model.lastPrompt().getUserMessage().getText().lines().skip(1).findFirst().orElse(""));
    }
}
```

**Output:**

```text
Schema mentions enum: true
Schema has description: true
1 StudyCard[front=What is a record?, back=An immutable data carrier., level=BEGINNER]
2 2 cards, second level INTERMEDIATE
3 StreamReadException: Unrecognized token 'Sure': was expecting (JSON String, Number, Array, Object or token 'null', 'true' or 'false')
4 StudyCard[front=What is JIT?, back=Compilation of hot bytecode at run time., level=ADVANCED] after 2 model calls
  retry prompt starts with: Output JSON validation failed because of: required property 'back' not found; required property 'level' not found
```

### Code walkthrough

- `getJsonSchema()` shows the contract the model receives; enum constants and `@JsonPropertyDescription` text are included, which is how you steer field values.
- **1–2:** `entity(Class)` and `entity(ParameterizedTypeReference)` parse objects and lists.
- **3:** prose before the JSON breaks parsing with Jackson 3's `tools.jackson.core.exc.StreamReadException`. Without a reliability switch, the exception reaches your code.
- **4:** `validateSchema()` caught the missing `back` and `level` fields, appended the validation error to the prompt (the line printed) and asked again. Two model calls were made — remember that retries cost tokens; `responseEntity` reports the accumulated usage.

## Common Mistakes and Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `StreamReadException: Unrecognized token …` | The model added prose around the JSON | `validateSchema()`; stronger instruction; native output; lenient custom converter |
| `MismatchedInputException` / unknown enum value | Field type or enum value does not match | Describe allowed values; use enums; `validateSchema()` |
| OpenAI error when requesting `List<T>` with native output | OpenAI rejects a top-level array schema | Wrap: `record Cards(List<StudyCard> cards)` |
| `entity(...)` not available after `stream()` | Typed output is call-only | Use `call()`, or collect the stream and convert manually |
| Correct JSON, wrong facts | Schema checks shape, not truth | Validate values and business rules ([Validating AI Output](../ai-output-validation/content.md)) |

## Production Considerations

- **Cost:** each validation retry is a full model call; cap attempts (`StructuredOutputValidationAdvisor.builder().maxRepeatAttempts(n)`) and monitor how often retries happen.
- **Provider support:** native structured output support varies by model and schema feature (`$ref`, `anyOf`, deep nesting); test with your exact model version and keep `validateSchema()` as a safety net.
- **Schema evolution:** adding a field changes the prompt for every call; version DTOs used for AI output like any API contract.

## Common Interview Traps

- **"`entity()` guarantees valid JSON."** By default it is a best effort; use `validateSchema()` and/or native output when correctness matters.
- **"Structured output means the data is correct."** It means the *shape* is correct; values still need validation.
- **"Tool calling needs output converters."** Tool calls are already structured; converters are for the final answer.

## Key Takeaways

- `entity(Type)` = generated JSON Schema in the prompt + Jackson parsing.
- Add `validateSchema()` for self-correcting retries and `useProviderStructuredOutput()` for API-level enforcement where supported.
- Design records with enums and descriptions; validate values after parsing.

## Official References

- [Structured output](https://docs.spring.io/spring-ai/reference/api/structured-output.html)
- [Schema validation and self-correction](https://docs.spring.io/spring-ai/reference/api/structured-output/validation.html)
- [Provider-native structured output](https://docs.spring.io/spring-ai/reference/api/structured-output/native.html)
- [Output converters](https://docs.spring.io/spring-ai/reference/api/structured-output/converters.html)
