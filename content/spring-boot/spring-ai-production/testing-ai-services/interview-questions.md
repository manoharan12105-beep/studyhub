# Testing AI Services — Interview Questions

## Beginner

### Q1. How do you unit-test a service that uses `ChatClient`?

**Style:** How

<details>
<summary>Answer</summary>

Build the `ChatClient` from a stub `ChatModel` that records the `Prompt` and returns canned replies. Assert on the captured prompt (system rules, rendered user text, options, tools) and on your code's handling of replies (parsing, validation, fallbacks). No network, no key, deterministic.

</details>

### Q2. Why stub the `ChatModel` instead of mocking `ChatClient`?

**Style:** Why

<details>
<summary>Answer</summary>

Mocking the fluent chain is brittle and bypasses the real ChatClient behaviour — template rendering, advisors, structured-output conversion and the tool loop — which is exactly what your code depends on. Stubbing the `ChatModel` keeps that logic real and replaces only the remote call.

</details>

## Intermediate

### Q3. How do you test error handling for rate limits and timeouts?

**Style:** How

<details>
<summary>Answer</summary>

Point the provider module at a local stub HTTP server (`spring.ai.openai.base-url`) that returns 429, 500 or delays responses, with a short configured timeout. Assert the number of requests (retries), the exception type and your HTTP mapping (for example a 503 `ProblemDetail`). At the unit level, a stub `ChatModel` that throws the relevant exception tests fallbacks.

</details>

### Q4. What belongs in integration tests with a real (local) model?

**Style:** Scenario

<details>
<summary>Answer</summary>

Wiring and properties: the auto-configured beans start, the request reaches the model, structured output parses, tools are invoked, streaming completes, timeouts are honoured. Assertions on properties (non-blank, valid JSON, mentions an id) rather than exact text. Quality questions go to evaluation suites.

</details>

## Advanced

### Q5. Design the test strategy for a RAG assistant with tools.

**Style:** Design

<details>
<summary>Answer</summary>

Unit: stub `ChatModel` with scripted tool calls to test the tool loop and authorisation; tools and advisors tested directly; prompt assertions per feature; parsing and fallback cases from a library of canned replies; retrieval code with `SimpleVectorStore` and a deterministic embedding model. Integration: Testcontainers PostgreSQL with pgvector for ingestion and filters (tenant isolation tests), a stub HTTP server for provider errors, optionally a local model for end-to-end smoke tests. Evaluation: labelled retrieval set (hit rate/MRR) on every ingestion change; judge-based answer checks nightly; must-refuse and injection cases as release gates.

</details>
