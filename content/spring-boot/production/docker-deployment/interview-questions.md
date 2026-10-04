# Docker and Deploying Spring Boot — Interview Questions

## Beginner

### Q1. How do you containerise a Spring Boot application?

<details>
<summary>Answer</summary>

Either write a multi-stage Dockerfile — build the JAR with a JDK image, extract Spring Boot's layers, and copy them into a JRE runtime image running as a non-root user — or use `./mvnw spring-boot:build-image` to build an OCI image with Cloud Native Buildpacks. Configuration comes from environment variables at runtime.

</details>

### Q2. How would you deploy your Spring Boot project?

<details>
<summary>Answer</summary>

CI builds and tests the code, builds a versioned image and pushes it to a registry; the image runs on a platform (Kubernetes, ECS, a PaaS, or a VM with Docker) with configuration and secrets injected as environment variables, a managed PostgreSQL instance, Flyway migrations, health probes on Actuator endpoints, graceful shutdown for rolling updates, and logs/metrics shipped to monitoring.

</details>

## Intermediate

### Q3. Why use layered JARs in Docker images?

<details>
<summary>Answer</summary>

Docker caches image layers. Putting rarely changing dependencies, the Spring Boot loader, snapshot dependencies and the application classes into separate layers means a code change rebuilds and pushes only the small application layer, making builds and deployments faster.

</details>

### Q4. How do you size the JVM in a container?

<details>
<summary>Answer</summary>

Set a container memory limit and let the container-aware JVM size the heap as a percentage (`-XX:MaxRAMPercentage=75`), leaving room for metaspace, thread stacks, direct buffers and the OS. Avoid a fixed `-Xmx` larger than the limit, which leads to the kernel killing the container (OOMKilled).

</details>

### Q5. How do you run database migrations safely during rolling deployments?

<details>
<summary>Answer</summary>

Use Flyway/Liquibase migrations that are backward compatible with the previous application version (expand–contract: add columns/tables first, deploy code using them, remove old ones in a later release), run them once (at startup with locking, or as a separate job before rollout), and never rely on `ddl-auto=update`.

</details>

## Advanced

### Q6. What happens during a Kubernetes rolling update of a Spring Boot service, and what can go wrong?

<details>
<summary>Answer</summary>

New pods start; once readiness probes pass, they receive traffic and old pods are terminated (SIGTERM → graceful shutdown → exit). Problems arise if readiness is reported before the app is really ready (warm-up), if shutdown is immediate (in-flight requests fail), if the grace period is too short, if liveness depends on external systems (restart loops), or if schema changes are not backward compatible with the old pods still running.

</details>

### Q7. When would you consider a GraalVM native image for a Spring Boot service?

<details>
<summary>Answer</summary>

When startup time and memory matter most — serverless functions, scale-to-zero, CLI tools, many small instances. Spring Boot's AOT processing supports it, but builds are slower, reflection/proxy usage needs hints, some libraries are unsupported, and peak throughput may be lower than a warmed-up JIT JVM. CDS/AOT cache is a lighter alternative for faster JVM startup.

</details>
