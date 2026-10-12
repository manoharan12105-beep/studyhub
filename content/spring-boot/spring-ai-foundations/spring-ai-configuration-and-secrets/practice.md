# API Keys, Configuration Properties and Secret Management — Practice

### P1. Safe configuration

**Difficulty:** Easy · **Type:** MCQ

Which line belongs in a committed `application.properties`?

- A) `spring.ai.openai.api-key=sk-proj-1234...`
- B) `spring.ai.openai.api-key=${OPENAI_API_KEY}`
- C) `spring.ai.openai.api-key=` followed by the key in a comment
- D) None — Spring AI reads keys only from code

<details>
<summary>Answer</summary>

**Answer:** B) `spring.ai.openai.api-key=${OPENAI_API_KEY}`

</details>

### P2. Relaxed binding

**Difficulty:** Easy · **Type:** MCQ

Which environment variable sets `spring.ai.openai.api-key` directly, without a placeholder?

- A) `OPENAI_KEY`
- B) `SPRING_AI_OPENAI_API_KEY`
- C) `spring.ai.openai.api-key`
- D) `SPRING_OPENAI_APIKEY`

<details>
<summary>Answer</summary>

**Answer:** B) `SPRING_AI_OPENAI_API_KEY`

</details>

### P3. Startup or request?

**Difficulty:** Medium · **Type:** Behavior

For each situation, say whether the failure appears at startup or on the first request: (a) `OPENAI_API_KEY` is not set; (b) the key was revoked yesterday; (c) `spring.ai.openai.chat.model` names a model your account cannot use.

<details>
<summary>Answer</summary>

(a) Startup — the OpenAI model bean cannot be created without a credential. (b) First request — 401 from the provider. (c) First request — the provider rejects the unknown or unavailable model (typically a 404 or 400 error).

</details>

### P4. Validated settings

**Difficulty:** Medium · **Type:** Coding

Write a `@ConfigurationProperties` record with prefix `tutor` holding `maxAnswerTokens` (between 50 and 2000) and `defaultLanguage` (not blank), validated at startup.

<details>
<summary>Answer</summary>

```java
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "tutor")
public record TutorProperties(
        @Min(50) @Max(2000) int maxAnswerTokens,
        @NotBlank String defaultLanguage) {
}
```

Register it with `@EnableConfigurationProperties(TutorProperties.class)` or `@ConfigurationPropertiesScan`.

</details>

### P5. Environment design

**Difficulty:** Hard · **Type:** Design

Design the configuration for three environments — `dev` (Ollama), `staging` (OpenAI, cheap limits) and `prod` (OpenAI) — including where each key comes from and one safety setting per environment.

<details>
<summary>Answer</summary>

- `application.properties`: shared, non-secret defaults (`spring.ai.model.image=none`, your own `studyai.*` limits).
- `application-dev.properties`: `spring.ai.model.chat=ollama`, `spring.ai.model.embedding=ollama`, local model names; no key needed. Safety: prompt logging may be enabled locally only.
- `application-staging.properties`: `spring.ai.model.chat=openai`, key `${OPENAI_API_KEY}` from the staging secret, a low `spring.ai.openai.chat.max-completion-tokens`; a separate staging key with a small spending limit.
- `application-prod.properties`: OpenAI with the production key from the secret manager, explicit model names and limits, `spring.ai.openai.max-retries` set deliberately, prompt and completion logging off, Actuator `env`/`configprops` not exposed.

</details>
