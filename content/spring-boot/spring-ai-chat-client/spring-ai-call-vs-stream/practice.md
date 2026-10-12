# call() vs stream(): Blocking and Streaming Responses — Practice

### P1. Return type

**Difficulty:** Easy · **Type:** MCQ

What does `chatClient.prompt().user(q).stream().content()` return?

- A) `String`
- B) `Flux<String>`
- C) `Mono<String>`
- D) `CompletableFuture<String>`

<details>
<summary>Answer</summary>

**Answer:** B) `Flux<String>`

</details>

### P2. Lazy stream

**Difficulty:** Easy · **Type:** Behavior

```java
// Illustrative fragment
Flux<String> flux = chatClient.prompt().user("Explain JIT").stream().content();
log.info("created");
```

Has the provider been called when `created` is logged?

<details>
<summary>Answer</summary>

No. The request is sent only when the `Flux` is subscribed.

</details>

### P3. Pick the mode

**Difficulty:** Medium · **Type:** Scenario

For each feature choose `call()` or `stream()`: (a) a chat UI answering long questions; (b) extracting invoice fields into a record; (c) a nightly job summarising 5,000 tickets; (d) a code-explanation panel in an IDE plugin.

<details>
<summary>Answer</summary>

(a) `stream()` — users see text immediately. (b) `call()` with `entity(...)` — needs complete JSON and validation. (c) `call()` — nobody is waiting; simpler error handling. (d) `stream()` — long explanations benefit from progressive display.

</details>

### P4. Streaming endpoint

**Difficulty:** Medium · **Type:** Coding

Write a Spring MVC controller method `GET /api/summary/stream?text=…` that streams a summary as Server-Sent Events and fails the stream after 45 seconds.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
@GetMapping(path = "/api/summary/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
Flux<String> summary(@RequestParam @Size(max = 8000) String text) {
    return chatClient.prompt()
            .user(u -> u.text("Summarise:\n{text}").param("text", text))
            .stream()
            .content()
            .timeout(Duration.ofSeconds(45));
}
```

(For `@Size` on a request parameter, the controller class needs `@Validated`.)

</details>

### P5. Buffered stream

**Difficulty:** Hard · **Type:** Debugging

Locally the streaming endpoint works with `curl -N`, but behind the company's reverse proxy the browser receives the whole answer at once after 20 seconds. List the likely cause and two fixes.

<details>
<summary>Answer</summary>

The proxy buffers the response body before forwarding it. Fixes: disable response buffering for that route in the proxy (for Nginx, `proxy_buffering off;` or the `X-Accel-Buffering: no` response header), and make sure the response uses `Content-Type: text/event-stream` without compression that forces buffering. Test through the proxy with `curl -N`.

</details>
