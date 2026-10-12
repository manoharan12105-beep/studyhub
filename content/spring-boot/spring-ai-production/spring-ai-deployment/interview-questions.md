# Deploying Spring AI Applications — Interview Questions

## Beginner

### Q1. Where should the model provider's API key come from in production?

**Style:** Direct

<details>
<summary>Answer</summary>

From the runtime environment — an environment variable or a secret manager — referenced in configuration (`spring.ai.openai.api-key=${OPENAI_API_KEY}`), with a separate key per environment. Never from source code, `application.properties` in Git, or the container image.

</details>

### Q2. Why can't chat memory stay in memory when you run three instances?

**Style:** Why

<details>
<summary>Answer</summary>

Each instance would hold its own history: a user routed to another instance loses context, and every restart deletes conversations. Use a shared repository (JDBC, Redis, …) for chat memory.

</details>

## Intermediate

### Q3. How should health checks treat the AI provider?

**Style:** How

<details>
<summary>Answer</summary>

Liveness must not depend on the provider — restarting doesn't fix an external outage. Report provider status from recent real calls (no probe calls, which cost tokens), as a separate indicator or health group, using a degraded status for transient problems and DOWN only for configuration errors such as a revoked key.

</details>

### Q4. Why enable virtual threads for a Spring MVC application with AI features?

**Style:** Why

<details>
<summary>Answer</summary>

Model calls block for seconds. With platform threads, a burst of AI requests can exhaust the request thread pool and stall unrelated endpoints. Virtual threads make blocked waits cheap, so the application can hold many concurrent model calls; concurrency toward the provider still needs explicit limits.

</details>

## Advanced

### Q5. Plan the production rollout of a new AI feature.

**Style:** Design

<details>
<summary>Answer</summary>

Before: evaluation suite passing on staging with production configuration; secrets and per-environment keys; migrations for memory/vector tables; dashboards for latency, errors, tokens and cost; budgets and rate limits; kill switch tested. Rollout: feature flag to internal users, then a percentage of tenants, watching quality signals and spend against forecasts; on-call runbook for provider outages (fallback/degraded mode) and key problems. After: compare actual cost per request with estimates, feed failures into the evaluation set, and only then enable for everyone.

</details>
