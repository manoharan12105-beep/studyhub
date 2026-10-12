# Designing the Controller, Service and REST Endpoint — Interview Questions

## Beginner

### Q1. How would you structure a Spring Boot endpoint that answers questions with an LLM?

**Style:** Design

<details>
<summary>Answer</summary>

A thin `@RestController` with a validated request DTO; an application service for the use case (authorization, limits, persistence, fallbacks); and an AI gateway component that owns the prompt, the `ChatClient` built from the injected builder, options, output checks and translation of provider exceptions. The response is a DTO you control.

</details>

### Q2. Which HTTP status codes fit common AI failures?

**Style:** Direct

<details>
<summary>Answer</summary>

`400` for invalid input (rejected before the model call), `429` when your own per-user limit is exceeded, `503` when the provider is unavailable or erroring, `504` when the model call times out. A truncated but usable answer can be `200` with a `truncated` flag.

</details>

## Intermediate

### Q3. Why should a model call not run inside a `@Transactional` method?

**Style:** Why

<details>
<summary>Answer</summary>

The transaction holds a database connection (and possibly locks) for the whole method. A model call can take many seconds, so under load the connection pool is exhausted and unrelated requests wait. Read data, commit, call the model outside a transaction, then save results in a separate short transaction.

</details>

### Q4. How do virtual threads help an AI-backed Spring MVC service?

**Style:** How

<details>
<summary>Answer</summary>

Model calls block while waiting for the provider. With `spring.threads.virtual.enabled=true` on Java 21, each request runs on a cheap virtual thread, so thousands of waiting calls do not exhaust a fixed pool of platform threads. They do not make the provider faster or remove rate limits; you still need concurrency limits and budgets.

</details>

### Q5. How do you test the endpoint without calling a provider?

**Style:** How

<details>
<summary>Answer</summary>

Inject a `ChatClient.Builder` built on a scripted `ChatModel` into the gateway and drive the controller with `MockMvc` (standalone setup or `@WebMvcTest` with a test configuration). Assert status codes and JSON bodies for success, validation errors and model failures, and check that invalid requests never call the model.

</details>

## Advanced

### Q6. A client retries `POST /api/ask` after a timeout, and the question is answered and billed twice. How do you prevent that?

**Style:** Scenario

<details>
<summary>Answer</summary>

Make the operation idempotent: the client sends an idempotency key, the service stores the key with the result (or an in-progress marker) and returns the stored result for repeats. Combine with a server-side timeout shorter than the client's, so the server does not finish work the client has already abandoned without recording it.

</details>
