# Caching, Latency and Streaming — Interview Questions

## Beginner

### Q1. Does streaming make the model answer faster?

**Style:** Direct

<details>
<summary>Answer</summary>

No. Total generation time is roughly the same; streaming shows tokens as they are produced, so the user sees the first words much earlier (lower perceived latency).

</details>

### Q2. When is it safe to cache an AI answer?

**Style:** Scenario

<details>
<summary>Answer</summary>

When the answer depends only on the (normalised) question, the prompt version and the model — not on conversation history, user data or frequently changing sources — and the answer completed normally and passed validation. The key must include the prompt version and, if content differs per tenant, the tenant.

</details>

## Intermediate

### Q3. Compare answer caching, semantic caching and provider prompt caching.

**Style:** Compare

<details>
<summary>Answer</summary>

Answer caching stores the final answer under an exact (normalised) key and skips the model call on a hit. Semantic caching looks up answers by embedding similarity, catching paraphrases but risking wrong matches for questions that look similar but differ in meaning. Provider prompt caching is done by the provider: repeated prompt prefixes are processed faster and often billed lower; the model is still called.

</details>

### Q4. A RAG assistant takes 8 seconds. List the levers you would check.

**Style:** How

<details>
<summary>Answer</summary>

Trace the request: number of model calls (query rewriting, tool rounds), input size (history, retrieved chunks), output length and limit, model size, retrieval latency, slow tools, retries. Then: remove or cheapen extra calls, shrink context, cap output, use a faster model for auxiliary steps, parallelise independent work, cache frequent answers, and stream the final answer.

</details>

## Advanced

### Q5. Design caching for a multi-tenant FAQ assistant with 100,000 daily questions.

**Style:** Design

<details>
<summary>Answer</summary>

Redis cache with keys `tenant:promptVersion:model:locale:normalisedQuestion`, TTL aligned with content updates, invalidated when the tenant's documents are re-ingested; only stateless FAQ requests (no conversation id) and validated `STOP` answers are cached; optional semantic cache per tenant with a strict, evaluated similarity threshold and an allow-list of intents; pre-warm popular questions; metrics on hit rate, latency saved and cost saved; and tests proving one tenant never receives another tenant's cached answer.

</details>
