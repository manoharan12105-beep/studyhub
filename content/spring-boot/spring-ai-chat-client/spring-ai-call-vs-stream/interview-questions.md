# call() vs stream(): Blocking and Streaming Responses — Interview Questions

## Beginner

### Q1. What is the difference between `call()` and `stream()`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`call()` blocks until the full answer is generated and returns it as a `String`, `ChatResponse` or entity. `stream()` returns a `Flux` that emits chunks (`String` or `ChatResponse`) as the provider generates them, so the user sees text sooner.

</details>

### Q2. Does streaming make the model generate faster?

**Style:** Trap

<details>
<summary>Answer</summary>

No. The model does the same work; streaming reduces *time to first token*, the perceived latency. Total time is about the same or slightly longer.

</details>

## Intermediate

### Q3. When is the provider called in `chatClient.prompt().user(q).stream().content()`?

**Style:** What happens internally

<details>
<summary>Answer</summary>

When the returned `Flux` is subscribed — for example when a controller returns it and Spring writes the response, or when code calls `subscribe()`, `collectList()` or `blockLast()`. Creating the `Flux` itself sends nothing.

</details>

### Q4. How do you stream a model's answer to a browser from a Spring MVC application?

**Style:** How

<details>
<summary>Answer</summary>

Return `Flux<String>` from a controller method with `produces = MediaType.TEXT_EVENT_STREAM_VALUE`; Spring writes each element as a Server-Sent Event. Add `spring-boot-starter-webflux` so Reactor and the streaming client support are on the classpath; the app remains a servlet application. The browser reads it with `EventSource` or `fetch` streaming.

</details>

### Q5. Why can't you use `entity(...)` with `stream()`?

**Style:** Why

<details>
<summary>Answer</summary>

Converting to a typed object needs the complete JSON text, and schema validation retries need the whole response. Stream the text if you must show progress, collect it at the end, and convert it with a `BeanOutputConverter` whose format instructions you added to the prompt — or use `call()`.

</details>

## Advanced

### Q6. The provider fails halfway through a streamed answer. What does the client see, and how do you handle it?

**Style:** Scenario

<details>
<summary>Answer</summary>

The HTTP response already started with status 200, so the error cannot change the status code. The `Flux` signals an error after some chunks. Handle it with `onErrorResume` to emit a final error event the UI understands (and maybe log the partial answer), add an overall `.timeout(...)`, and let the user retry. Do not store the partial answer as if it were complete.

</details>

### Q7. Which use cases should not stream?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Structured extraction and classification (you need the full JSON and possibly validation retries), background jobs and batch processing (no user waiting), short answers (no visible benefit), and flows where the answer is post-processed or approved before display.

</details>
