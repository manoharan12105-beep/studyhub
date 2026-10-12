# Your First Spring AI Application — Interview Questions

## Beginner

### Q1. Which beans does the OpenAI starter give you for a chat endpoint, and which one do you inject?

**Style:** Direct

<details>
<summary>Answer</summary>

It auto-configures an `OpenAiChatModel` (a `ChatModel`) and a prototype-scoped `ChatClient.Builder` bean named `chatClientBuilder`. Application services usually inject `ChatClient.Builder`, set defaults such as the system instruction, and build their own `ChatClient`.

</details>

### Q2. Why is the `ChatClient.Builder` bean prototype-scoped?

**Style:** Why

<details>
<summary>Answer</summary>

So each injection point gets its own builder. One service can set a tutor system prompt and another a summariser prompt without their defaults leaking into each other, while both share the same underlying `ChatModel`.

</details>

## Intermediate

### Q3. Where should the prompt be built — controller or service? Why?

**Style:** Design

<details>
<summary>Answer</summary>

In the service. The controller handles HTTP concerns (validation, status codes, DTO mapping); the service owns the AI behaviour (system instruction, prompt text, options, parsing). That keeps the AI logic testable without HTTP, reusable from other entry points (jobs, message listeners) and easy to change.

</details>

### Q4. How would you test `StudyAssistantService` without calling a provider?

**Style:** How

<details>
<summary>Answer</summary>

Construct it with `ChatClient.builder(scriptedModel)`, where the scripted model returns a known reply and records prompts. Assert the returned value and inspect the recorded prompt (system and user messages). The service's constructor only depends on `ChatClient.Builder`, which makes this easy.

</details>

### Q5. Why validate the request DTO before calling the model?

**Style:** Why

<details>
<summary>Answer</summary>

Invalid input should be rejected cheaply and clearly with a 400, before spending tokens and seconds on a model call. Size limits also cap input tokens (cost), protect the context window and reduce the room for abuse such as huge prompt-injection payloads.

</details>

## Advanced

### Q6. The endpoint works locally but every request in staging returns 500, and logs show `UnauthorizedException: 401`. Walk through the diagnosis.

**Style:** Debugging

<details>
<summary>Answer</summary>

The app started, so a key was present; the provider rejected it. Check which key staging injects (secret name, environment variable, profile), whether it was revoked or belongs to another organisation, and whether a stale secret version is mounted. Fix the secret, restart, and add an error mapping so provider authentication failures return a clear 503-style error instead of a generic 500, plus an alert on repeated 401s.

</details>
