# API Keys, Configuration Properties and Secret Management

**Module:** Spring AI: Foundations · **Interview priority:** Core · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Supply a provider API key through an environment variable, never through source control.
- Read and organise `spring.ai.*` properties: connection, model options and model selection.
- Use profiles to switch providers and models between environments.
- Keep secrets out of logs, Actuator endpoints and error messages, and add your own validated AI settings with `@ConfigurationProperties`.

## Definition

Spring AI is configured through **Spring Boot externalized configuration**: properties under `spring.ai.<provider>` for connection details and model options, `spring.ai.model.*` to select providers, and feature properties such as `spring.ai.chat.client.*`, `spring.ai.retry.*` and `spring.ai.tools.*`. **API keys are secrets**: they are injected at runtime from the environment or a secret store and never committed. The general rules are in [Externalized Configuration](../../spring-boot-core/externalized-configuration/content.md) and [Production Configuration](../../production/production-configuration/content.md).

## Why It Matters

A leaked API key is spent money and a security incident: anyone holding it can run requests on your account and sometimes read data the provider stores. Configuration mistakes are also the most common Spring AI startup failures. A clear structure makes it obvious which model, which provider and which limits each environment uses.

## How It Works

Spring Boot resolves each property from an ordered list of sources — command-line arguments, environment variables, profile-specific files, `application.properties` and more — and the first source that defines it wins. Placeholders like `${OPENAI_API_KEY}` are resolved from the environment at startup. Environment variables can also set properties directly through **relaxed binding**: `SPRING_AI_OPENAI_API_KEY` sets `spring.ai.openai.api-key`.

Property groups you will use most:

| Group | Examples | Purpose |
|-------|----------|---------|
| Connection | `spring.ai.openai.api-key`, `spring.ai.openai.base-url`, `spring.ai.openai.max-retries` | Who to call and how |
| Model options | `spring.ai.openai.chat.model`, `spring.ai.openai.chat.temperature`, `spring.ai.openai.chat.max-completion-tokens`, `spring.ai.openai.embedding.model` | Defaults for each request |
| Per-model override | `spring.ai.openai.chat.api-key`, `spring.ai.openai.embedding.base-url` | A different key or URL for one model type |
| Provider selection | `spring.ai.model.chat`, `spring.ai.model.embedding`, `spring.ai.model.image` | Which provider's auto-configuration is active, or `none` |
| Client behaviour | `spring.ai.chat.client.enabled`, `spring.ai.chat.client.tool-calling.enabled` | `ChatClient.Builder` auto-configuration and the tool loop |
| Observability | `spring.ai.chat.observations.log-prompt`, `spring.ai.chat.client.observations.log-completion` | Prompt/completion logging (off by default — keep it off in production) |

## Supplying the API Key

```properties
# application.properties (committed): only a placeholder, no secret
spring.ai.openai.api-key=${OPENAI_API_KEY}
spring.ai.openai.chat.model=gpt-5-mini
```

```bash
# Development shell (not committed)
export OPENAI_API_KEY="sk-...your-key..."
./mvnw spring-boot:run
```

On Windows PowerShell use `$env:OPENAI_API_KEY = "sk-..."`; in an IDE, set it in the run configuration's environment variables. In containers and Kubernetes, inject it from a secret object; in cloud deployments, from the platform's secret manager. Rotate a key immediately if it was ever committed — deleting the commit is not enough ([Secrets in Git History](../../../git-github/authentication-and-security/secrets-in-git-history/content.md)).

### What happens when the key is missing

The OpenAI chat model is created at startup, so a missing key fails fast. In Spring AI 2.0.1 the root cause in the startup log is:

```text
Caused by: java.lang.IllegalStateException: At least one credential source must be specified: credential (apiKey), workloadIdentity, or adminApiKey
```

It appears inside a `BeanCreationException` for the bean `openAiChatModel` (and every bean that depends on it, such as `chatClientBuilder`). A **wrong** key does not fail at startup; the first request fails with `com.openai.errors.UnauthorizedException: 401: …` from the OpenAI SDK.

## Profiles: Different Providers per Environment

```properties
# application-dev.properties: free local model
spring.ai.model.chat=ollama
spring.ai.model.embedding=ollama
spring.ai.ollama.chat.model=llama3.2
spring.ai.ollama.embedding.model=nomic-embed-text
```

```properties
# application-prod.properties: hosted model, explicit limits
spring.ai.model.chat=openai
spring.ai.model.embedding=openai
spring.ai.openai.api-key=${OPENAI_API_KEY}
spring.ai.openai.chat.model=gpt-5-mini
spring.ai.openai.chat.max-completion-tokens=800
spring.ai.openai.embedding.model=text-embedding-3-small
spring.ai.openai.max-retries=2
```

Activate with `SPRING_PROFILES_ACTIVE=prod` ([Spring Profiles](../../spring-boot-core/spring-profiles/content.md)). Both starters are on the classpath; the selection properties decide which models exist. Remember that switching embedding models requires re-embedding stored documents.

## Your Own AI Settings

Application-specific limits (maximum question length, daily token budget, which prompt version to use) belong in your own validated properties class rather than scattered `@Value` strings:

```java
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "studyai")
public record StudyAiProperties(
        @NotBlank String systemPromptVersion,
        @Min(10) @Max(4000) int maxQuestionLength,
        @Min(1000) long dailyTokenBudgetPerUser) {
}
```

```java
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(StudyAiProperties.class)
class StudyAiConfiguration {
}
```

```properties
studyai.system-prompt-version=v2
studyai.max-question-length=2000
studyai.daily-token-budget-per-user=200000
```

### Code walkthrough

- The record binds everything under `studyai.*`; kebab-case keys map to camelCase components.
- `@Validated` plus Jakarta constraints make startup fail with a clear message when a value is missing or out of range — far better than discovering it on the first request.
- `@EnableConfigurationProperties` registers the record as a bean you can inject into services.

**Expected behaviour:** with `studyai.max-question-length=5` the application refuses to start and reports that the property must be greater than or equal to 10.

## Common Mistakes and Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `IllegalStateException: At least one credential source must be specified…` at startup | `spring.ai.openai.api-key` empty (environment variable not set in this shell/IDE/container) | Set `OPENAI_API_KEY` where the app runs; check with `echo $OPENAI_API_KEY` |
| `UnauthorizedException: 401` on the first call | Wrong, expired or revoked key; key for another organisation/project | Create a new key; check `spring.ai.openai.organization-id` and the key's project on the provider dashboard |
| Properties seem ignored | 1.x `.options.` keys; typo; wrong profile active | Use flat 2.0 keys; check `/actuator/configprops` in development; log active profiles |
| Calls go to the wrong server | `spring.ai.openai.base-url` left pointing at a test stub or proxy | Remove the override or set it per profile |
| Key visible in logs | Logging configuration objects, HTTP debug logging or prompts | Never log secrets; keep `log-prompt` off; review debug loggers |

## Production Considerations

- **Least privilege:** use a separate key per environment and per service, with spending limits on the provider account; never share a production key with developers' laptops.
- **Rotation:** design for rotating keys without redeploying code (restart with a new secret, or a secret manager that refreshes).
- **Actuator:** `env` and `configprops` sanitize values by default; keep them unexposed in production ([Actuator and Monitoring](../../production/actuator-and-monitoring/content.md)).
- **Front-end:** never send a provider key to a browser or mobile app; the client calls *your* API, and your server calls the provider.

## Common Interview Traps

- **"Putting the key in `application-prod.properties` is fine because it is a private repository."** Private repositories are cloned to many machines and backups; secrets belong in the runtime environment or a secret manager.
- **"If the app started, the key is valid."** Startup only checks that a key is present; validity is checked by the provider on the first call.
- **"Profiles are only for databases."** They are equally useful for switching AI providers, models and limits.

## Key Takeaways

- Commit placeholders (`${OPENAI_API_KEY}`), inject real keys from the environment or a secret manager.
- In 2.0, configure models with flat keys and pick providers with `spring.ai.model.*`.
- A missing key fails at startup; a wrong key fails with 401 on the first call.
- Put your own AI limits in a validated `@ConfigurationProperties` record.

## Official References

- [OpenAI chat: API key and properties](https://docs.spring.io/spring-ai/reference/api/chat/openai-chat.html)
- [Ollama chat properties](https://docs.spring.io/spring-ai/reference/api/chat/ollama-chat.html)
- [Spring Boot externalized configuration](https://docs.spring.io/spring-boot/reference/features/external-config.html)
