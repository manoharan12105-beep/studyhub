# The Advisors API — Practice

### P1. Which method?

**Difficulty:** Easy · **Type:** MCQ

Which method must a `CallAdvisor` call to continue to the next advisor and, eventually, the model?

- A) `request.proceed()`
- B) `chain.nextCall(request)`
- C) `chatModel.call(request.prompt())`
- D) `chain.after(response)`

<details>
<summary>Answer</summary>

**Answer:** B) `chain.nextCall(request)`

</details>

### P2. Count the calls

**Difficulty:** Easy · **Type:** Behavior

A client has `InputLimitAdvisor(40)` (order -100, short-circuits long questions) and `UsageAuditAdvisor` (order 0, prints before and after). One short and one long question are sent. How many times does the audit advisor print "audit before", and how many model calls happen?

<details>
<summary>Answer</summary>

Once, and one model call. The long question is answered by `InputLimitAdvisor` before the audit advisor or the model runs.

</details>

### P3. Write an advisor

**Difficulty:** Medium · **Type:** Coding

Write a `BaseAdvisor` that measures how long the downstream call takes and stores the milliseconds in the response context under `"latencyMs"`.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
class LatencyAdvisor implements BaseAdvisor {
    @Override
    public ChatClientRequest before(ChatClientRequest request, AdvisorChain chain) {
        request.context().put("startNanos", System.nanoTime());
        return request;
    }

    @Override
    public ChatClientResponse after(ChatClientResponse response, AdvisorChain chain) {
        long start = (long) response.context().get("startNanos");
        response.context().put("latencyMs", (System.nanoTime() - start) / 1_000_000);
        return response;
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;   // outermost: measures everything below it
    }
}
```

The request context travels to the response, so `after` can read what `before` stored. For streams, `after` runs on the chunk with a finish reason.

</details>

### P4. Missing on streams

**Difficulty:** Medium · **Type:** Debugging

An audit advisor implementing only `CallAdvisor` logs every `.call()` but no `.stream()` requests. Why, and what is the fix?

<details>
<summary>Answer</summary>

Streaming requests go through the stream advisor chain, which only includes `StreamAdvisor`s. Implement `StreamAdvisor` as well (`adviseStream` returning `Flux<ChatClientResponse>`), or extend `BaseAdvisor`, which handles both paths.

</details>

### P5. Choose the mechanism

**Difficulty:** Medium · **Type:** Scenario

For each requirement, choose an advisor, a service method or a controller filter: (a) add the learner's preferred language to every system prompt, (b) reject requests without a valid JWT, (c) record token usage per feature.

<details>
<summary>Answer</summary>

(a) An advisor (or `defaultSystem` with a template parameter) — it changes the prompt for every call. (b) Spring Security, before the controller — authentication is not an AI concern. (c) An advisor reading usage in `after`, with the feature name passed as an advisor parameter (or the built-in observations' metrics).

</details>
