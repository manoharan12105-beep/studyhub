# The Advisors API — Interview Questions

## Beginner

### Q1. What is an advisor in Spring AI?

**Style:** Direct

<details>
<summary>Answer</summary>

An interceptor around a `ChatClient` call. It can modify the `ChatClientRequest` (prompt and context), pass it on through the chain, and modify the `ChatClientResponse` on the way back — like a servlet filter for model calls. Chat memory, `QuestionAnswerAdvisor`, the tool loop and `SafeGuardAdvisor` are all advisors.

</details>

### Q2. How do you pass a per-request value, such as a conversation id, to advisors?

**Style:** How

<details>
<summary>Answer</summary>

With advisor parameters: `.advisors(a -> a.param(ChatMemory.CONVERSATION_ID, id))`. Parameters land in the request's context map, which every advisor in the chain can read.

</details>

## Intermediate

### Q3. When would you implement `CallAdvisor` instead of `BaseAdvisor`?

**Style:** Compare

<details>
<summary>Answer</summary>

`BaseAdvisor` is for "change the request, then change the response" logic; it implements both the call and stream paths around `before` and `after`. `CallAdvisor` (and `StreamAdvisor`) give full control over whether and how the chain continues — for example short-circuiting with a cached answer or a refusal, retrying, or timing the downstream call. A `CallAdvisor` alone does not run for `.stream()` requests.

</details>

### Q4. How does an advisor answer without calling the model?

**Style:** How

<details>
<summary>Answer</summary>

In `adviseCall`, skip `chain.nextCall(request)` and return its own response: `ChatClientResponse.builder().chatResponse(new ChatResponse(List.of(new Generation(new AssistantMessage("...")))) ).context(request.context()).build()`. Advisors after it and the model are not invoked.

</details>

## Advanced

### Q5. Design an advisor that enforces a per-user daily token budget.

**Style:** Design

<details>
<summary>Answer</summary>

A `CallAdvisor` + `StreamAdvisor` with a low order (runs early). Before: read the user id from the context (set by the controller with `.advisors(a -> a.param("userId", id))`), check the budget in a shared store (Redis, database) and short-circuit with a polite refusal if exhausted. After: read `chatResponse().getMetadata().getUsage()` and add the total tokens atomically; for streams, record usage on the chunk with a finish reason. Keep it stateless, make the store failure mode explicit (fail open or closed), and expose metrics. Note the budget can be exceeded by one request, since usage is known only afterwards.

</details>
