# Docker and Deploying Spring Boot

**Module:** Production Spring Boot · **Interview priority:** Frequently asked

## Definition

**Docker** packages an application with its runtime (JRE, OS libraries) into an **image** that runs identically everywhere as a **container**. A Spring Boot executable JAR fits naturally: one process, configuration from environment variables, logs to stdout, health endpoints for orchestration. **Deployment** is getting that image running reliably — on a VM, a PaaS, or an orchestrator such as **Kubernetes**.

## Why It Matters

- Almost every modern Java service ships as a container image.
- "How would you deploy your Spring Boot application?" closes many project interviews; good answers mention image building, configuration, health checks, graceful shutdown and the database.

## Docker + Spring Boot

### Option 1: a Dockerfile with layered extraction

Spring Boot JARs are **layered**: dependencies change rarely, your code changes often. Extracting layers into separate image layers means a code change rebuilds only a few MB.

```dockerfile
# ---- build stage: compile and extract layers ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw -q dependency:go-offline          # cached unless pom.xml changes
COPY src/ src/
RUN ./mvnw -q package -DskipTests
RUN java -Djarmode=tools -jar target/*.jar extract --layers --destination extracted

# ---- runtime stage: small JRE image, non-root user ----
FROM eclipse-temurin:21-jre
RUN useradd --system --uid 10001 spring
USER spring
WORKDIR /application
COPY --from=build /workspace/extracted/dependencies/ ./
COPY --from=build /workspace/extracted/spring-boot-loader/ ./
COPY --from=build /workspace/extracted/snapshot-dependencies/ ./
COPY --from=build /workspace/extracted/application/ ./
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "application.jar"]
```

- **Multi-stage build:** the JDK and Maven stay in the build stage; the runtime image contains only a JRE and the app.
- **Non-root user** limits damage if the container is compromised.
- `-XX:MaxRAMPercentage` sizes the heap from the container memory limit (the JVM is container-aware).
- `java -Djarmode=tools … extract --layers` is the Boot 3.3+ way (`layertools` is the deprecated predecessor).

### Option 2: Cloud Native Buildpacks (no Dockerfile)

```bash
./mvnw spring-boot:build-image -Dspring-boot.build-image.imageName=registry.example.com/shop:1.4.0
```

Produces an optimised, layered OCI image with a tuned JVM memory calculator — good defaults, no Dockerfile to maintain.

### Running locally with dependencies

```yaml
# compose.yaml
services:
  db:
    image: postgres:17
    environment:
      POSTGRES_DB: shop
      POSTGRES_USER: shop
      POSTGRES_PASSWORD: shop
    ports: ["5432:5432"]
  app:
    image: registry.example.com/shop:1.4.0
    environment:
      SPRING_PROFILES_ACTIVE: prod
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/shop
      SPRING_DATASOURCE_USERNAME: shop
      SPRING_DATASOURCE_PASSWORD: shop
    ports: ["8080:8080"]
    depends_on: [db]
```

Spring Boot's `spring-boot-docker-compose` module can also start `compose.yaml` services automatically during development and configure connection properties for you.

## Deployment

A typical pipeline:

```text
git push → CI: build, unit + integration tests (Testcontainers) → build image (tagged with version/commit)
        → push to registry → deploy (Kubernetes rolling update / PaaS)
        → readiness probe passes → traffic shifts → old pods get SIGTERM → graceful shutdown
```

Kubernetes essentials for a Spring Boot service:

| Concern | Setting |
|---------|---------|
| Configuration | Env vars / ConfigMaps; secrets from Secrets or a secret manager |
| Health | `livenessProbe: /actuator/health/liveness`, `readinessProbe: /actuator/health/readiness` (startupProbe for slow starts) |
| Resources | CPU/memory requests and limits; heap via `MaxRAMPercentage` |
| Shutdown | `terminationGracePeriodSeconds` > Spring's shutdown timeout; optional `preStop` sleep |
| Scaling | Replicas/HPA on CPU or custom metrics; stateless app so any pod serves any request |
| Database migrations | Flyway/Liquibase at startup or as a separate job before rollout; backward-compatible changes for rolling deploys |
| Observability | JSON logs to stdout, Prometheus scraping, tracing |

### Startup and memory optimisations (awareness)

- **Class Data Sharing (CDS)** / AOT cache — faster startup by reusing class metadata (supported by Boot's extraction tooling).
- **Spring AOT + GraalVM native images** — millisecond startup and low memory, at the cost of longer builds and reflection constraints.
- **Virtual threads** — high concurrency without large thread pools.

## Common Mistakes

- Single-stage images containing the JDK, Maven repository and source code (huge, larger attack surface).
- Copying the fat JAR as one layer — every code change re-uploads all dependencies.
- Running as root; baking secrets or environment-specific config into the image.
- Using the `latest` tag in deployments (not reproducible).
- Fixed `-Xmx` larger than the container memory limit → OOM kills.
- Liveness probes depending on the database; no graceful shutdown.

## Common Interview Traps

- **"The container needs Tomcat installed."** The executable JAR embeds the server.
- **"Docker makes the app scalable."** Statelessness, external sessions/caches and database capacity make it scalable; Docker only packages it.
- **"Each environment needs its own image."** One image, different configuration.

## Key Takeaways

- Build small, layered, non-root images (multi-stage Dockerfile with `jarmode=tools` extraction, or buildpacks via `spring-boot:build-image`).
- Configure via environment variables and secrets; one immutable image per version.
- In orchestration: liveness/readiness probes, resource limits, graceful shutdown, safe migrations, JSON logs and metrics.
