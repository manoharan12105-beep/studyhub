# Deploying Spring AI Applications

**Module:** Spring AI: Production · **Interview priority:** Sometimes asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Prepare a Spring AI application for production: configuration, secrets, timeouts, threads and shutdown.
- Make AI features safe to run on several instances (shared memory, vector store, caches, budgets).
- Design health checks that reflect the AI provider without calling it on every probe.
- Plan rollout, kill switches and cost controls for AI features.

## Definition

**Deploying a Spring AI application** is deploying a Spring Boot application with an extra external dependency that is slow, metered and occasionally unavailable. Everything from [Production Configuration](../../production/production-configuration/content.md) and [Docker Deployment](../../production/docker-deployment/content.md) applies; this lesson adds the AI-specific parts.

## Why It Matters

AI features fail in production in ways a demo never shows: keys missing in one environment, in-memory chat history lost on restart or split across instances, request threads blocked on slow model calls, health checks that call the model thousands of times a day, and a deploy that triples token spend overnight.

## How It Works

Production checklist by concern:

| Concern | Decision |
|---------|----------|
| Secrets | API keys from environment variables or a secret manager (`spring.ai.openai.api-key=${OPENAI_API_KEY}`); never in images or Git; one key per environment |
| Model and options | Pinned model names per environment; output limits; temperatures in configuration |
| Timeouts and retries | Provider timeout (`spring.ai.openai.chat.timeout`), one retry layer ([Resilience](../ai-resilience-and-provider-errors/content.md)) |
| Threads | Model calls block for seconds: enable virtual threads (`spring.threads.virtual.enabled=true`) or use streaming/reactive endpoints |
| State | Chat memory in JDBC/Redis, vector store in PostgreSQL/pgvector or another server, caches and budgets in Redis — not in instance memory |
| Schema | Memory and vector tables created by migrations, not at startup ([pgvector](../../spring-ai-rag/pgvector-with-spring-ai/content.md)) |
| Shutdown | Graceful shutdown so in-flight (possibly streaming) answers complete: `server.shutdown=graceful`, `spring.lifecycle.timeout-per-shutdown-phase` |
| Health | Liveness independent of the provider; readiness/health may report AI status from recent calls |
| Observability | Metrics, traces, cost dashboards ([Observability](../spring-ai-observability/content.md)) |
| Control | Feature flag / kill switch per AI feature; per-tenant budgets |

```properties
# application-prod.properties (illustrative)
spring.ai.model.chat=openai
spring.ai.openai.api-key=${OPENAI_API_KEY}
spring.ai.openai.chat.model=${AI_CHAT_MODEL:gpt-5-mini}
spring.ai.openai.chat.max-completion-tokens=800
spring.ai.openai.chat.timeout=30s
spring.ai.openai.chat.max-retries=2
spring.ai.chat.memory.repository.jdbc.initialize-schema=never
spring.ai.vectorstore.pgvector.initialize-schema=false
spring.threads.virtual.enabled=true
server.shutdown=graceful
spring.lifecycle.timeout-per-shutdown-phase=45s
management.endpoint.health.probes.enabled=true
management.endpoint.health.group.readiness.include=readinessState,db
studyai.features.tutor.enabled=true
```

## Example

A health indicator that reflects the provider from **recent real calls** instead of calling the model on every health probe:

```java
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Supplier;

import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;

public class AiHealthDemo {

    /** Records the outcome of real AI calls; the health check never calls the model itself. */
    static class AiProviderHealth implements HealthIndicator {
        record Outcome(boolean success, String detail, Instant at) {
        }

        private final AtomicReference<Outcome> last = new AtomicReference<>();
        private final Supplier<Instant> now;

        AiProviderHealth(Supplier<Instant> now) {
            this.now = now;
        }

        void recordSuccess() {
            last.set(new Outcome(true, "ok", now.get()));
        }

        void recordFailure(String detail) {
            last.set(new Outcome(false, detail, now.get()));
        }

        @Override
        public Health health() {
            Outcome o = last.get();
            if (o == null) {
                return Health.unknown().withDetail("reason", "no AI calls yet").build();
            }
            long ageSeconds = Duration.between(o.at(), now.get()).toSeconds();
            if (!o.success() && o.detail().startsWith("401")) {
                return Health.down().withDetail("lastError", o.detail()).withDetail("ageSeconds", ageSeconds).build();
            }
            // Degraded, not DOWN: transient provider trouble should not make the platform restart the app
            return Health.status(o.success() ? "UP" : "DEGRADED")
                    .withDetail("last", o.detail()).withDetail("ageSeconds", ageSeconds).build();
        }
    }

    public static void main(String[] args) {
        Instant[] clock = {Instant.parse("2026-10-12T09:00:00Z")};
        AiProviderHealth health = new AiProviderHealth(() -> clock[0]);

        System.out.println("startup:        " + health.health());
        health.recordSuccess();
        clock[0] = clock[0].plusSeconds(30);
        System.out.println("after success:  " + health.health());
        health.recordFailure("503 overloaded");
        System.out.println("after 503:      " + health.health());
        health.recordFailure("401 invalid API key");
        System.out.println("after 401:      " + health.health());
    }
}
```

**Output:**

```text
startup:        UNKNOWN {reason=no AI calls yet}
after success:  UP {last=ok, ageSeconds=30}
after 503:      DEGRADED {last=503 overloaded, ageSeconds=0}
after 401:      DOWN {lastError=401 invalid API key, ageSeconds=0}
```

### Code walkthrough

- In Spring Boot 4 health types live in `org.springframework.boot.health.contributor`.
- An advisor or service records outcomes of real calls (`recordSuccess`/`recordFailure`); the indicator only reads them — no tokens spent on probes.
- A transient 503 reports a custom `DEGRADED` status: operators see the problem, but the platform does not restart healthy instances because a third-party API is overloaded. Configure `management.endpoint.health.status.order` and `management.endpoint.health.status.http-mapping.degraded` so the aggregated status and HTTP code behave as intended.
- A 401 is a configuration problem (wrong or revoked key) → `DOWN`, which should page someone.
- Keep this indicator **out of the liveness group**; at most include it in a separate health group or in readiness if the instance is useless without the provider.

### Container image

```dockerfile
# Illustrative — build with Maven first: ./mvnw -DskipTests package
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY target/studyai.jar app.jar
USER 10001
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
```

The image contains no keys; they are injected at runtime. For a full Docker, Compose, Nginx and CI/CD walkthrough see the DevOps & Deployment course.

## Common Mistakes and Troubleshooting

- **In-memory chat memory with several instances.** Users lose history on restart or when the load balancer switches instance; use a JDBC/Redis repository.
- **`SimpleVectorStore` in production.** Use a real store; re-ingestion should not depend on instance startup.
- **Health check that calls the model.** Costs money, adds load and couples restarts to provider outages.
- **Platform threads blocked by model calls.** Under load, the request pool is exhausted; enable virtual threads or stream.
- **Same API key for all environments.** A dev bug can exhaust production quota; separate keys and budgets.

## Production Considerations

- Roll out AI features behind flags, to a percentage of users or tenants, watching cost and quality dashboards.
- A kill switch (configuration property or flag) that disables a feature and shows a fallback must be testable and fast.
- Provider quotas and rate limits are per key/organisation: size concurrency limits accordingly across all instances.
- Back up chat memory and vector data like any other data; document retention.
- Run the evaluation suite against staging with production configuration before each release ([AI Evaluation](../ai-evaluation-and-regression/content.md)).

## Common Interview Traps

- **"The app is stateless, so any instance can answer."** Not if chat memory, caches or budgets live in instance memory.
- **"If the provider is down, mark the app DOWN."** That triggers restarts that don't help; degrade and report instead.
- **"Keys in `application.properties` are fine for a private repo."** Secrets belong in the environment or a secret manager.

## Key Takeaways

- Secrets from the environment; pinned models; timeouts, output limits and one retry layer.
- Shared state (memory, vectors, caches, budgets) in external stores; schemas by migration.
- Virtual threads or streaming for long calls; graceful shutdown for in-flight answers.
- Health from recent outcomes, never from probing the model; flags, kill switches and cost alerts for every AI feature.

## Official References

- [Spring Boot: Deploying to the Cloud and Containers](https://docs.spring.io/spring-boot/how-to/deployment/index.html)
- [Spring Boot Actuator: Health](https://docs.spring.io/spring-boot/reference/actuator/endpoints.html)
- [Spring AI Chat Memory: repositories](https://docs.spring.io/spring-ai/reference/api/chat-memory.html)
- Related: [Production Configuration](../../production/production-configuration/content.md) · [Actuator and Monitoring](../../production/actuator-and-monitoring/content.md) · [Configuration and Secrets](../../spring-ai-foundations/spring-ai-configuration-and-secrets/content.md)
