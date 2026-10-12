# Caching, Latency and Streaming — Practice

### P1. Cache key

**Difficulty:** Easy · **Type:** MCQ

Which part is essential in an answer-cache key so prompt changes take effect immediately?

- A) The timestamp
- B) The prompt version
- C) The request id
- D) The client IP address

<details>
<summary>Answer</summary>

**Answer:** B) The prompt version

</details>

### P2. Count the calls

**Difficulty:** Easy · **Type:** Behavior

With the `AnswerCacheAdvisor` from the lesson, these requests arrive: "What is a TreeMap?", "what is a treemap", "What is a TreeMap?" with a conversation id. How many model calls happen?

<details>
<summary>Answer</summary>

Two: the first is a miss, the second a hit, the third bypasses the cache because it has a conversation id.

</details>

### P3. Stream to the browser

**Difficulty:** Medium · **Type:** Coding

Write a Spring MVC endpoint that streams the tutor's answer as Server-Sent Events.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
@GetMapping(value = "/api/tutor/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
Flux<String> stream(@RequestParam String question) {
    return tutorClient.prompt().user(question).stream().content();
}
```

Spring MVC supports returning a `Flux` for SSE when Reactor is on the classpath; WebFlux works too.

</details>

### P4. Wrong answer for the wrong user

**Difficulty:** Medium · **Type:** Debugging

After adding a cache, a learner sees "Your next exam is on 3 May" — another learner's exam date. What went wrong?

<details>
<summary>Answer</summary>

A personalised answer (based on tools or memory for one learner) was cached under a key without the user, and returned for the same question from someone else. Cache only stateless requests (bypass when a conversation id, tools with user data, or personal context are involved) or include the user in the key — and clear the existing cache.

</details>

### P5. Semantic cache risk

**Difficulty:** Hard · **Type:** Scenario

A semantic cache with similarity threshold 0.9 returns the cached answer for "How do I cancel my subscription?" to the question "How do I keep my subscription after cancelling the trial?". Explain and propose safeguards.

<details>
<summary>Answer</summary>

Embeddings of the two questions are close because they share most words and topic, but the intent differs. Safeguards: much stricter thresholds evaluated on labelled pairs (including near-miss negatives), restricting semantic caching to a curated set of FAQ intents with canonical questions, requiring an intent classifier match, keying by tenant and prompt version, and measuring wrong-hit rates before enabling it.

</details>
