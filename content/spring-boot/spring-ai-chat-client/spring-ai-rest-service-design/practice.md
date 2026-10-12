# Designing the Controller, Service and REST Endpoint — Practice

### P1. Where does the prompt live?

**Difficulty:** Easy · **Type:** MCQ

In the three-layer design, which class owns the prompt text and the `ChatClient`?

- A) The controller
- B) The application service
- C) The AI gateway
- D) The repository

<details>
<summary>Answer</summary>

**Answer:** C) The AI gateway

</details>

### P2. Status for an outage

**Difficulty:** Easy · **Type:** MCQ

The provider returns repeated 500 errors. Which status should your API return?

- A) 200 with an empty answer
- B) 400 Bad Request
- C) 503 Service Unavailable
- D) 401 Unauthorized

<details>
<summary>Answer</summary>

**Answer:** C) 503 Service Unavailable

</details>

### P3. Transaction bug

**Difficulty:** Medium · **Type:** Code analysis

```java
// Illustrative fragment
@Transactional
public Answer answerAndSave(Long questionId) {
    Question q = questionRepository.findById(questionId).orElseThrow();
    String text = tutorGateway.ask(q.getText()).answer();
    return answerRepository.save(new Answer(q, text));
}
```

What is the problem under load, and how do you restructure it?

<details>
<summary>Answer</summary>

The database connection is held for the full model call. Under load the Hikari pool runs out. Restructure: load the question (short read), call the gateway with no transaction open, then save the answer in a separate `@Transactional` method on another bean (so the proxy applies).

</details>

### P4. Validate the request

**Difficulty:** Medium · **Type:** Coding

Write a request record for `POST /api/summarise` with a required `text` of at most 8,000 characters and an optional `language` of exactly two lowercase letters.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
public record SummariseRequest(
        @NotBlank @Size(max = 8000) String text,
        @Pattern(regexp = "[a-z]{2}") String language) {
}
```

`@Pattern` ignores `null`, so `language` stays optional.

</details>

### P5. End-to-end design

**Difficulty:** Hard · **Type:** Design

Design `POST /api/explain-code` for an internal developer portal: users paste up to 200 lines of Java and get an explanation. List the checks, layers, limits and failure responses.

<details>
<summary>Answer</summary>

- Controller: authenticated endpoint; `ExplainCodeRequest` with `@NotBlank` and a size limit (characters and line count); `400` on violations.
- Service: per-user rate limit and daily token budget (`429` when exceeded); optional caching by a hash of the code; save the explanation outside the model-call path.
- Gateway: system prompt that treats the code as data; code passed as a template value inside delimiters; output limit; checks for empty or truncated answers; translates provider errors.
- Failures: `503` for provider errors, `504` for timeouts, `200` with `truncated: true` when cut off.
- Tests: `MockMvc` with a scripted model for each path; an evaluation set of code snippets for answer quality.

</details>
