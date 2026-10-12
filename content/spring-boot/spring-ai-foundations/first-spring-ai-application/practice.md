# Your First Spring AI Application — Practice

### P1. Which bean?

**Difficulty:** Easy · **Type:** MCQ

Which type do you normally inject into a service to talk to the configured chat model?

- A) `ChatClient`
- B) `ChatClient.Builder`
- C) `OpenAiApi`
- D) `RestClient`

<details>
<summary>Answer</summary>

**Answer:** B) `ChatClient.Builder`

**Explanation:** Spring AI auto-configures a builder, not a client; you build the client with your defaults (or declare a `ChatClient` bean yourself).

</details>

### P2. What reaches the model?

**Difficulty:** Easy · **Type:** Behavior

With the lesson's `StudyAssistantService`, what messages are sent for `explain("records")`, and in what order?

<details>
<summary>Answer</summary>

A `SYSTEM` message with the tutor instruction (from `defaultSystem`), then a `USER` message `Explain this topic: records`.

</details>

### P3. Add an output limit

**Difficulty:** Medium · **Type:** Coding

Make every response from the application at most 500 completion tokens using configuration only.

<details>
<summary>Answer</summary>

```properties
spring.ai.openai.chat.max-completion-tokens=500
```

(`max-completion-tokens` is the field OpenAI's newer and reasoning models use; older non-reasoning models use `max-tokens`. Set only one of them.)

</details>

### P4. Fix the controller

**Difficulty:** Medium · **Type:** Code analysis

```java
// Illustrative fragment
@PostMapping
public String explain(@RequestBody String topic) {
    return ChatClient.create(chatModel).prompt().user(topic).call().content();
}
```

List three improvements.

<details>
<summary>Answer</summary>

1. Accept a validated DTO (`@Valid ExplainRequest` with `@NotBlank @Size(max = …)`) instead of a raw string, so empty or huge input is rejected before a model call.
2. Move the AI call into a service that owns a `ChatClient` built once from the auto-configured builder (with a system instruction), instead of creating a client per request in the controller.
3. Return a structured response (`ExplainResponse`) and map model or provider errors to proper HTTP responses.

</details>

### P5. Extend the app

**Difficulty:** Hard · **Type:** Design

Add a second endpoint, `POST /api/quiz`, that returns three multiple-choice questions about a topic. Describe the classes you would add or change and how you would keep the two endpoints' prompts independent.

<details>
<summary>Answer</summary>

Add `QuizRequest` (validated topic), a `QuizService` that injects its own `ChatClient.Builder` with a quiz-specific default system message, a `QuizQuestion` record and `.entity(new ParameterizedTypeReference<List<QuizQuestion>>() {})` to return typed questions, and a `QuizController`. Because each service receives its own prototype builder, the tutor and quiz system messages stay separate while sharing the same `ChatModel`.

</details>
