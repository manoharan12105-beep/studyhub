# Production Configuration, Secrets and Graceful Shutdown — Interview Questions

## Beginner

### Q1. How do you manage configuration for different environments?

<details>
<summary>Answer</summary>

Build one artifact and externalise configuration: shared defaults in `application.yml`, environment-specific defaults in profile files (`application-prod.yml`) activated with `SPRING_PROFILES_ACTIVE`, and deployment-specific or secret values from environment variables, mounted files or a secret manager.

</details>

### Q2. How do you keep secrets out of the codebase?

<details>
<summary>Answer</summary>

Reference them as properties (`${DB_PASSWORD}`) or rely on relaxed binding, and supply them at runtime from platform secrets (Kubernetes Secrets, Docker secrets) or a secret manager (Vault, AWS Secrets Manager). Add secret scanning to CI, never log them, and rotate them.

</details>

### Q3. What is graceful shutdown?

<details>
<summary>Answer</summary>

Stopping the application so that it stops accepting new requests but lets in-flight requests complete (up to a timeout) before closing resources. Spring Boot enables it with `server.shutdown=graceful` (the default since 3.4) and `spring.lifecycle.timeout-per-shutdown-phase`.

</details>

## Intermediate

### Q4. What happens in a Spring Boot app when Kubernetes stops a pod?

<details>
<summary>Answer</summary>

Kubernetes sends SIGTERM (after an optional `preStop` hook) and removes the pod from service endpoints. The JVM shutdown hook closes the Spring context: readiness switches to refusing traffic, the web server stops accepting connections and waits for active requests, then beans are destroyed and pools closed. If the process has not exited when `terminationGracePeriodSeconds` elapses, Kubernetes sends SIGKILL.

</details>

### Q5. What is `spring.config.import=configtree:` used for?

<details>
<summary>Answer</summary>

It imports properties from a directory tree where each file name is a property name and the file content its value — the format used by Kubernetes and Docker secrets mounted as files. It avoids putting secrets in environment variables, which may leak through process listings or crash reports.

</details>

## Advanced

### Q6. Name ten settings you would review before going to production.

<details>
<summary>Answer</summary>

`ddl-auto=validate` with Flyway/Liquibase; `spring.jpa.open-in-view=false`; Hikari pool size and timeouts; HTTP client connect/read timeouts; Actuator exposure and security; structured logging at INFO; error responses without stack traces; graceful shutdown and probe configuration; CORS origins; secrets from the environment; JVM memory settings for the container; virtual threads or Tomcat thread limits; forward-headers strategy behind proxies.

</details>

### Q7. Why is a single immutable artifact per release important?

<details>
<summary>Answer</summary>

What you test is exactly what you deploy; only configuration changes between environments. Building separately per environment risks untested differences, makes rollbacks harder and allows secrets to be baked into images. Container images tagged by version (or digest) with external configuration make deployments reproducible.

</details>
