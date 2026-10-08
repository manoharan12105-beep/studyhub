# Dockerfile

## Instructions

| Instruction | Use | Remember |
|-------------|-----|----------|
| `FROM image:tag [AS name]` | Base image / start a stage | Pin the tag |
| `WORKDIR /app` | Working directory | Created if missing |
| `COPY src dest` | Files from the build context | Prefer over `ADD` |
| `ADD archive.tar.gz /opt/` | Copy + auto-extract / URLs | Only when extraction is wanted |
| `RUN cmd` | Build-time command → layer | Combine related commands |
| `ENV K=V` | Build + run-time variable | Visible in `docker inspect` |
| `ARG K=default` | Build-time only (`--build-arg`) | Visible in `docker history` |
| `EXPOSE 8080` | Documents the port | Does **not** publish |
| `USER spring` | Run as non-root | After `useradd` |
| `ENTRYPOINT ["java","-jar","app.jar"]` | The program | Exec form! |
| `CMD ["--server.port=8080"]` | Default args / command | Replaced by `docker run … args` |
| `HEALTHCHECK CMD …` | Container health | Compose `healthcheck:` overrides |

## CMD × ENTRYPOINT

```text
ENTRYPOINT ["java","-jar","app.jar"]  CMD ["--debug"]
docker run img            → java -jar app.jar --debug
docker run img --trace    → java -jar app.jar --trace
docker run --entrypoint sh -it img → sh
```

## Java Template

```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q package -DskipTests

FROM eclipse-temurin:21-jre
RUN useradd --system --uid 10001 spring
WORKDIR /app
COPY --from=build /workspace/target/*.jar app.jar
USER spring
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
```

## .dockerignore

```text
target/
.git/
.github/
.idea/
.vscode/
*.iml
.env
*.log
```

## Rules of Thumb

- Least-changing first; one changed layer rebuilds all later layers.
- Build stage: Maven + JDK. Runtime stage: JRE only, non-root.
- Exec-form `ENTRYPOINT` so SIGTERM reaches Java (graceful shutdown).
- `-XX:MaxRAMPercentage` instead of a fixed `-Xmx` near the container limit.
- No secrets in `COPY`, `ENV` or `ARG`.
