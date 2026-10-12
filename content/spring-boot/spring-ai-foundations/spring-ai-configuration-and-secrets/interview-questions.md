# API Keys, Configuration Properties and Secret Management — Interview Questions

## Beginner

### Q1. How should a Spring AI application receive its API key?

**Style:** How

<details>
<summary>Answer</summary>

Commit only a placeholder such as `spring.ai.openai.api-key=${OPENAI_API_KEY}` and supply the real value at runtime from an environment variable, a container or Kubernetes secret, or a cloud secret manager. Never hard-code it, commit it, log it or send it to a browser.

</details>

### Q2. What is the difference between `spring.ai.model.chat` and `spring.ai.openai.chat.model`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`spring.ai.model.chat` selects which provider's chat auto-configuration is active (`openai`, `anthropic`, `ollama`, or `none`). `spring.ai.openai.chat.model` sets which OpenAI model name that provider uses by default (for example `gpt-5-mini`).

</details>

## Intermediate

### Q3. The application fails to start with "At least one credential source must be specified". What do you check?

**Style:** Debugging

<details>
<summary>Answer</summary>

The OpenAI key resolved to nothing. Check that `OPENAI_API_KEY` (or `SPRING_AI_OPENAI_API_KEY`) is set in the environment the application actually runs in — the IDE run configuration, the shell, the container or the deployment manifest — and that the property placeholder name matches. Then confirm the right profile is active.

</details>

### Q4. The app starts but every request fails with a 401. Why didn't it fail at startup?

**Style:** Why

<details>
<summary>Answer</summary>

Startup only verifies that a key value is present so the client can be built. Whether the key is valid, revoked, expired or belongs to another organisation is checked by the provider when the first request arrives; the OpenAI SDK then throws `UnauthorizedException` (401).

</details>

### Q5. How would you run Ollama locally and OpenAI in production without code changes?

**Style:** Scenario

<details>
<summary>Answer</summary>

Include both starters and use profile-specific files. `application-dev.properties` sets `spring.ai.model.chat=ollama` and `spring.ai.model.embedding=ollama` with Ollama model names; `application-prod.properties` sets them to `openai` with the key placeholder, model names and limits. The code depends only on `ChatClient` and `EmbeddingModel`. Embeddings from the two providers are not interchangeable, so each environment needs its own vector data.

</details>

### Q6. Why use a validated `@ConfigurationProperties` record for your own AI settings?

**Style:** Why

<details>
<summary>Answer</summary>

It groups settings such as maximum input length, token budgets and prompt versions in one typed object, documents them, and with `@Validated` and Jakarta constraints makes startup fail immediately on missing or invalid values instead of failing on a user request.

</details>

## Advanced

### Q7. A developer accidentally pushed a production API key to a public repository. What do you do, in order?

**Style:** Scenario

<details>
<summary>Answer</summary>

1. Revoke (rotate) the key at the provider immediately — assume it is already copied.
2. Deploy the new key from the secret store and confirm services work.
3. Check provider usage and billing for abuse during the exposure window.
4. Remove the secret from the repository history if required by policy, and add secret scanning and pre-commit checks so it does not happen again.

Deleting the commit alone does not help; forks, caches and clones may still contain it.

</details>
