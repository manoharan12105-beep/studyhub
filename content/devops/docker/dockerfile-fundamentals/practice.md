# Writing a Dockerfile — Practice

### P1. What runs?

**Difficulty:** Easy · **Type:** Output · **Concepts:** CMD vs ENTRYPOINT

```dockerfile
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY app.jar .
ENTRYPOINT ["java", "-jar", "app.jar"]
CMD ["--server.port=8080"]
```

What command runs for `docker run myimg --server.port=9090`?

<details>
<summary>Answer</summary>

`java -jar app.jar --server.port=9090` — arguments after the image name replace `CMD`; the `ENTRYPOINT` stays.

</details>

### P2. Which instruction?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** ARG vs ENV

You need a value only while building (the version to stamp into a file) and not in the running container. Which instruction?

- A) `ENV`
- B) `ARG`
- C) `LABEL`
- D) `EXPOSE`

<details>
<summary>Answer</summary>

**Answer:** B) `ARG`

</details>

### P3. Publish or document?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** EXPOSE

The Dockerfile has `EXPOSE 8080`. You run `docker run -d myimg` and `curl localhost:8080` on the host fails. Why?

- A) The image is broken
- B) `EXPOSE` only documents the port; nothing was published with `-p`
- C) Port 8080 needs root
- D) curl does not support containers

<details>
<summary>Answer</summary>

**Answer:** B) `EXPOSE` only documents the port; nothing was published with `-p`

</details>

### P4. Fix the order

**Difficulty:** Medium · **Type:** Dockerfile · **Concepts:** layer caching

Rewrite this build stage so that a change in `src/` does not re-download dependencies:

```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY . .
RUN mvn -B package -DskipTests
```

<details>
<summary>Answer</summary>

```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B package -DskipTests
```

</details>

### P5. Which layers rebuild?

**Difficulty:** Medium · **Type:** Output · **Concepts:** cache invalidation

Using the fixed Dockerfile from P4, you edit only `TaskController.java` and build again. Which steps are cached and which run?

<details>
<summary>Answer</summary>

Cached: `FROM`, `WORKDIR`, `COPY pom.xml .`, `RUN mvn dependency:go-offline`. Run again: `COPY src ./src` (its content changed) and `RUN mvn package` (after a changed layer). The runtime stage's `COPY --from=build` also runs because the JAR changed.

</details>

### P6. The leaking secret

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** .dockerignore

A developer's Dockerfile does `COPY . .` and the project root contains `.env` with the production database password. What is the risk and the two fixes?

<details>
<summary>Answer</summary>

`.env` is copied into an image layer; anyone who can pull the image can read the password (even if a later step deletes the file — earlier layers keep it). Fixes: add `.env` to `.dockerignore`, and copy only what the build needs (`COPY pom.xml`, `COPY src`).

</details>

### P7. Why 10 seconds?

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** exec form

`docker stop api` always takes 10 seconds. The Dockerfile ends with `ENTRYPOINT java -jar app.jar`. Fix it.

<details>
<summary>Answer</summary>

```dockerfile
ENTRYPOINT ["java", "-jar", "app.jar"]
```

The shell form makes `/bin/sh` PID 1, which does not forward SIGTERM to Java.

</details>

### P8. Smaller runtime

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** JDK vs JRE

Which base image should the final stage of a Spring Boot image use?

- A) `maven:3.9-eclipse-temurin-21`
- B) `eclipse-temurin:21-jdk`
- C) `eclipse-temurin:21-jre`
- D) `ubuntu` with Java installed by `apt` at start-up

<details>
<summary>Answer</summary>

**Answer:** C) `eclipse-temurin:21-jre`

**Explanation:** Running a JAR needs only a runtime; Maven and the compiler belong in the build stage.

</details>

### P9. Write the runtime stage

**Difficulty:** Hard · **Type:** Dockerfile · **Concepts:** multi-stage, non-root, JVM memory

Given a build stage named `build` that produces `/workspace/target/taskapi-1.0.0.jar`, write a runtime stage that runs as a non-root user, documents port 8080, sizes the heap from the container limit, and shuts down gracefully.

<details>
<summary>Answer</summary>

```dockerfile
FROM eclipse-temurin:21-jre
RUN useradd --system --uid 10001 spring
WORKDIR /app
COPY --from=build /workspace/target/taskapi-1.0.0.jar app.jar
USER spring
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
```

</details>

### P10. Container killed under load

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** JVM in containers

A container with `--memory 512m` and `ENTRYPOINT ["java","-Xmx512m","-jar","app.jar"]` exits with code 137 during load tests. Explain and fix.

<details>
<summary>Answer</summary>

The JVM's total memory = heap + metaspace + thread stacks + code cache + native buffers. With a 512 MB heap the process exceeds the 512 MB limit and is OOM-killed (SIGKILL = 137). Use `-XX:MaxRAMPercentage=75` instead of a fixed `-Xmx`, or raise the container limit.

</details>
