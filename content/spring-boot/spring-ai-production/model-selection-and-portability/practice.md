# Model Selection, Routing and Portability — Practice

### P1. Route the task

**Difficulty:** Easy · **Type:** MCQ

Which task is usually the best fit for a small, cheap model?

- A) Classifying a question into one of eight topics
- B) Writing a detailed architecture explanation
- C) Multi-step reasoning over a long contract
- D) Generating a full lesson plan

<details>
<summary>Answer</summary>

**Answer:** A) Classifying a question into one of eight topics

</details>

### P2. Options override

**Difficulty:** Medium · **Type:** Behavior

A client has `defaultOptions(ChatOptions.builder().model("large-model").temperature(0.3))`. The application properties set the provider's default model to `small-model`. A request calls `.options(ChatOptions.builder().maxTokens(50))`. Which model and temperature does the provider receive?

<details>
<summary>Answer</summary>

`small-model` (from the provider defaults) with the provider's default temperature, plus `maxTokens=50` — the client's `defaultOptions` are replaced by the request options in 2.0.1.

</details>

### P3. Write a gateway

**Difficulty:** Medium · **Type:** Coding

Write a Spring bean that routes `Task.SUMMARISE` to a `cheapClient` and `Task.REVIEW_CODE` to a `strongClient`, both injected by qualifier.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
@Service
class AiGateway {
    private final Map<Task, ChatClient> clients;

    AiGateway(@Qualifier("cheapClient") ChatClient cheap, @Qualifier("strongClient") ChatClient strong) {
        this.clients = Map.of(Task.SUMMARISE, cheap, Task.REVIEW_CODE, strong);
    }

    String run(Task task, String input) {
        return clients.get(task).prompt().user(input).call().content();
    }
}
```

</details>

### P4. Portability leak

**Difficulty:** Medium · **Type:** Code analysis

Twelve services import `com.openai.errors.RateLimitException` and `OpenAiChatOptions`. The company wants to evaluate another provider. What is the problem and the refactoring?

<details>
<summary>Answer</summary>

Provider details have leaked into business code, so a switch touches twelve services. Introduce one adapter/gateway that owns provider options and translates provider exceptions into application exceptions (for example `AiRateLimitedException`, `AiUnavailableException`); services use portable `ChatClient` calls or the gateway only. Then the alternative provider needs one new adapter configuration.

</details>

### P5. Choose for a region

**Difficulty:** Hard · **Type:** Design

EU customers require that prompts never leave the EU; US customers have no restriction. How do you design model selection?

<details>
<summary>Answer</summary>

Make the region part of the routing decision: tenant → region → client bean. EU tenants use an EU-hosted model (a provider's EU region endpoint or a self-hosted model), US tenants the default provider. Keep both clients configured with the same prompts and evaluation sets, verify feature parity (tools, structured output), keep vector stores and memory in-region too, and log the model used per request for audits.

</details>
