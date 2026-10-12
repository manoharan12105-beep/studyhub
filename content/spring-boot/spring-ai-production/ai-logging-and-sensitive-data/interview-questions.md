# Logging AI Calls Without Leaking Sensitive Data — Interview Questions

## Beginner

### Q1. What should you log for every AI call?

**Style:** Direct

<details>
<summary>Answer</summary>

Metadata: feature, model, token usage (input/output), finish reason, latency, error type, conversation id, a pseudonymous user/tenant id, and ids of retrieved documents or tools called. Not the full prompt or answer by default.

</details>

### Q2. Does Spring AI log prompts by default?

**Style:** Direct

<details>
<summary>Answer</summary>

No. The observation options `spring.ai.chat.client.observations.log-prompt`/`log-completion`, `spring.ai.chat.observations.log-prompt`/`log-completion`, `spring.ai.tools.observations.include-content` and `spring.ai.vectorstore.observations.log-query-response` all default to `false`. `SimpleLoggerAdvisor` logs full content at DEBUG only if you register it.

</details>

## Intermediate

### Q3. A support engineer needs to debug a bad answer. How do you help without logging all prompts?

**Style:** Scenario

<details>
<summary>Answer</summary>

Use metadata (model, retrieved document ids, tool calls, finish reason, tokens) to locate the stage that failed; reproduce with the conversation stored in chat memory under access control; enable redacted content logging for that feature or tenant temporarily with an expiry, or sample a small percentage with short retention and restricted access. Record the access for audit.

</details>

### Q4. Why is hashing a user id not anonymisation?

**Style:** Why

<details>
<summary>Answer</summary>

If ids are guessable (sequential numbers, emails), anyone can hash candidates and match them. A plain hash is a pseudonym. Use a keyed hash (HMAC with a secret) for correlation in logs, and treat the result as personal data under regulations like GDPR.

</details>

## Advanced

### Q5. Design data protection for an AI customer-support feature end to end.

**Style:** Design

<details>
<summary>Answer</summary>

Input: detect and mask payment data and secrets before the model call; refuse to process data classes that are not allowed. Provider: contract with appropriate retention/training terms and region. Memory: store only what's needed, encrypt at rest, retention policy, deletion by user. Vector store: no customer messages unless required; tenant filters. Logs/traces: metadata only, keyed-hash pseudonyms, redacted samples with short retention; observation content options off. Tools: authorise with `ToolContext`, audit actions separately. Deletion requests propagate to memory, logs (where feasible), vector store and caches; document all of it in a data-flow record.

</details>
