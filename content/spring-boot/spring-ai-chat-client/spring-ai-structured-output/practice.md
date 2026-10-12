# Structured Output: Mapping Responses to Records — Practice

### P1. Generic types

**Difficulty:** Easy · **Type:** MCQ

Which call returns `List<Question>`?

- A) `.entity(List.class)`
- B) `.entity(new ParameterizedTypeReference<List<Question>>() {})`
- C) `.entity(Question[].class).asList()`
- D) `.content().toList()`

<details>
<summary>Answer</summary>

**Answer:** B) `.entity(new ParameterizedTypeReference<List<Question>>() {})`

</details>

### P2. What does the model see?

**Difficulty:** Easy · **Type:** Behavior

When you call `.entity(StudyCard.class)`, what does Spring AI add to the request?

<details>
<summary>Answer</summary>

Format instructions telling the model to reply only with RFC 8259 JSON (no Markdown fences or explanations) and a JSON Schema generated from `StudyCard`, with all properties required and `additionalProperties: false`. In 2.0.1 these instructions are appended to the user message.

</details>

### P3. Retry cost

**Difficulty:** Medium · **Type:** Behavior

With `spec -> spec.validateSchema()`, the first reply misses a required field and the second is valid. How many model calls were made, and what did the second request contain that the first did not?

<details>
<summary>Answer</summary>

Two calls. The second user message additionally starts with the validation error, for example `Output JSON validation failed because of: required property 'back' not found`, so the model knows what to fix. Token usage of both calls is accumulated in the returned response.

</details>

### P4. Native output and lists

**Difficulty:** Medium · **Type:** Debugging

`.entity(new ParameterizedTypeReference<List<Card>>() {}, spec -> spec.useProviderStructuredOutput())` fails against OpenAI, while the same call without the switch works. Why, and what is the fix?

<details>
<summary>Answer</summary>

OpenAI's Structured Outputs API does not accept a top-level array as the response schema. Wrap the list: `record CardList(List<Card> cards)` and call `.entity(CardList.class, spec -> spec.useProviderStructuredOutput())`, then use `result.cards()`.

</details>

### P5. Design an extraction record

**Difficulty:** Hard · **Type:** Design

Design the Java type for extracting a support ticket's `category` (billing, technical, account), `priority` (1–3), `summary` (≤ 120 chars) and `orderId` (optional) from free text, plus the call. What still needs validating after parsing?

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
enum Category { BILLING, TECHNICAL, ACCOUNT }

record TicketExtraction(
        Category category,
        @JsonPropertyDescription("1 = low, 2 = normal, 3 = urgent") int priority,
        @JsonPropertyDescription("One sentence, at most 120 characters") String summary,
        @JsonPropertyDescription("Order id like ORD-12345, or null if none") String orderId) {}

TicketExtraction t = chatClient.prompt()
        .system("Extract ticket fields. Use null when a value is not present.")
        .user(ticketText)
        .call()
        .entity(TicketExtraction.class, spec -> spec.validateSchema());
```

After parsing, validate `priority` is 1–3, `summary` length ≤ 120, `orderId` format and that the order exists **and belongs to the requesting customer** — the schema cannot check any of these.

</details>
