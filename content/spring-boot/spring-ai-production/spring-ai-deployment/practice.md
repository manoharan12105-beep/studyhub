# Deploying Spring AI Applications — Practice

### P1. Liveness

**Difficulty:** Easy · **Type:** MCQ

Should the liveness probe fail when the AI provider returns 503?

- A) Yes, so the platform restarts the instance
- B) No — restarting doesn't fix an external outage; report it elsewhere
- C) Only if the outage lasts 10 seconds
- D) Only for streaming endpoints

<details>
<summary>Answer</summary>

**Answer:** B) No — restarting doesn't fix an external outage; report it elsewhere

</details>

### P2. Predict the health status

**Difficulty:** Easy · **Type:** Behavior

Using the lesson's `AiProviderHealth`, the last recorded outcome is a failure "429 rate limited". What status is reported?

<details>
<summary>Answer</summary>

`DEGRADED` — only failures starting with "401" are reported as `DOWN`.

</details>

### P3. Production properties

**Difficulty:** Medium · **Type:** Coding

Write production properties that read the key from `OPENAI_API_KEY`, allow overriding the chat model with `AI_CHAT_MODEL` (default `gpt-5-mini`), set a 30-second timeout, enable virtual threads and graceful shutdown.

<details>
<summary>Answer</summary>

```properties
spring.ai.openai.api-key=${OPENAI_API_KEY}
spring.ai.openai.chat.model=${AI_CHAT_MODEL:gpt-5-mini}
spring.ai.openai.chat.timeout=30s
spring.threads.virtual.enabled=true
server.shutdown=graceful
```

</details>

### P4. Lost conversations

**Difficulty:** Medium · **Type:** Debugging

After moving from one to four instances behind a load balancer, users report the assistant "forgets" what they said. Nothing else changed. Explain and fix.

<details>
<summary>Answer</summary>

Chat memory uses the default in-memory repository, so history lives on whichever instance handled earlier requests. Configure a shared `ChatMemoryRepository` (JDBC or Redis) with schema migrations; sticky sessions would only hide the problem until the next restart.

</details>

### P5. Cost incident

**Difficulty:** Hard · **Type:** Scenario

A release accidentally sets `max-completion-tokens` to 32,000 and enables query rewriting for all requests. Token spend triples in two hours. What should have caught it, and what do you do now?

<details>
<summary>Answer</summary>

Now: flip the kill switch or roll back configuration, confirm spend drops on the token dashboards, and check budgets prevented runaway tenants. Prevention: configuration reviewed like code; evaluation runs on staging reporting tokens and cost per request versus baseline; cost-anomaly alerts on `gen_ai.client.token.usage`; per-tenant budgets; gradual rollout behind a flag so a small percentage of traffic reveals the change first.

</details>
