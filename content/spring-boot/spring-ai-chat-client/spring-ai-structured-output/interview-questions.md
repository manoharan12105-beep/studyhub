# Structured Output: Mapping Responses to Records — Interview Questions

## Beginner

### Q1. How does `entity(MyRecord.class)` work?

**Style:** How

<details>
<summary>Answer</summary>

`BeanOutputConverter` generates a JSON Schema from the record, Spring AI appends format instructions with that schema to the prompt, the model replies with JSON, and Jackson deserialises it into the record. It works with every provider because it relies on prompt instructions, not provider features.

</details>

### Q2. How do you get a `List<T>` back?

**Style:** Direct

<details>
<summary>Answer</summary>

Pass a `ParameterizedTypeReference`: `.entity(new ParameterizedTypeReference<List<StudyCard>>() {})`. For provider-native structured output with OpenAI, wrap the list in a record because a top-level array schema is rejected.

</details>

## Intermediate

### Q3. What do `validateSchema()` and `useProviderStructuredOutput()` do, and why combine them?

**Style:** Comparison

<details>
<summary>Answer</summary>

`validateSchema()` is a response-side safety net: `StructuredOutputValidationAdvisor` validates the reply against the JSON Schema and, on failure, re-asks the model with the validation error appended (3 attempts by default). `useProviderStructuredOutput()` is a request-side constraint: the schema is sent to the provider's native structured-output feature so invalid output cannot be produced, where supported. Native support is often partial (some schema features unsupported), so validation catches the residual failures.

</details>

### Q4. The model sometimes answers "Sure! Here is the JSON: {...}". What happens and how do you fix it?

**Style:** Debugging

<details>
<summary>Answer</summary>

Jackson fails on the prose — in Spring AI 2.0 (Jackson 3) with `tools.jackson.core.exc.StreamReadException: Unrecognized token 'Sure'`. Fixes, in order of preference: enable `validateSchema()` so the model is re-asked with the error; enable native structured output if the model supports it; lower temperature and strengthen the instruction; or, as a last resort, a custom `StructuredOutputConverter` that extracts the JSON (delegating `getJsonSchema()` so the switches still work).

</details>

### Q5. Why can't you use `entity(...)` with streaming?

**Style:** Why

<details>
<summary>Answer</summary>

Parsing and schema validation require the complete JSON document. Streaming returns partial text chunks. You can collect the streamed text and convert it at the end with a converter whose format instructions you put in the prompt, but `entity(...)` and `validateSchema()` are call-only.

</details>

## Advanced

### Q6. A valid `Invoice` record comes back with a total that does not equal the sum of its lines. Whose job is it to catch that?

**Style:** Scenario

<details>
<summary>Answer</summary>

Yours. Structured output guarantees, at best, the *shape* of the data; it says nothing about correctness. After parsing, apply Bean Validation and business rules (recompute totals, check ranges and references), and decide what to do on failure: re-ask the model with the specific problem, fall back, or send to a human.

</details>

### Q7. How do you influence which values the model puts in a field?

**Style:** How

<details>
<summary>Answer</summary>

Through the schema: use enums for closed sets (the schema lists the allowed values), choose descriptive field names, add `@JsonPropertyDescription` text, and order properties with `@JsonPropertyOrder` when it helps reasoning (for example a `reasoning` field before `answer`). Also state constraints in the system message, and validate afterwards.

</details>
