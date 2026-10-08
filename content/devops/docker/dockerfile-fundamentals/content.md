# Writing a Dockerfile

**Module:** Docker · **Interview priority:** Core

## What Is It?

A **Dockerfile** is a text file of instructions that describes how to build an image: start from a base image, copy files in, run build commands, and record how the container should start. `docker build` executes it top to bottom; each instruction that changes the filesystem becomes an image **layer**.

```text
Source code ──► Dockerfile ──docker build──► Image ──docker run──► Container ──► HTTP endpoint
```

## Why It Matters

- The Dockerfile *is* your deployment recipe, versioned in Git next to the code.
- A well-ordered Dockerfile builds in seconds after a code change; a careless one re-downloads every dependency each time.
- Interviews love the details: `CMD` vs `ENTRYPOINT`, `COPY` vs `ADD`, `ARG` vs `ENV`, what `EXPOSE` really does, multi-stage builds.

## The Instructions

| Instruction | Purpose | Example |
|-------------|---------|---------|
| `FROM` | Base image (every Dockerfile starts here) | `FROM eclipse-temurin:21-jre` |
| `WORKDIR` | Current directory for later instructions and for the container (created if missing) | `WORKDIR /app` |
| `COPY` | Copy files from the build context into the image | `COPY target/app.jar app.jar` |
| `ADD` | Like `COPY`, plus auto-extraction of local tar archives and remote URLs | `ADD vendor.tar.gz /opt/vendor/` |
| `RUN` | Run a command at **build** time, saving the result as a layer | `RUN mvn -B package` |
| `ENV` | Environment variable for later build steps **and** the running container | `ENV TZ=UTC` |
| `ARG` | Variable available **only during the build** | `ARG APP_VERSION=dev` |
| `EXPOSE` | Document the port the application listens on | `EXPOSE 8080` |
| `USER` | Run later steps and the container as this user | `USER spring` |
| `CMD` | Default command (or default arguments) when the container starts | `CMD ["java", "-jar", "app.jar"]` |
| `ENTRYPOINT` | The executable the container always runs | `ENTRYPOINT ["java", "-jar", "app.jar"]` |

### COPY vs ADD

Use `COPY`. It does one obvious thing. `ADD` silently extracts local `.tar` archives and can download URLs, which surprises readers and bypasses caching and checksum checks. Use `ADD` only when you *want* a local archive extracted.

### ARG vs ENV

```dockerfile
ARG APP_VERSION=dev          # exists only while building; set with --build-arg APP_VERSION=1.2.0
ENV APP_VERSION=${APP_VERSION}   # copy it into the image so the running app can read it
```

`ARG` values are not in the running container, but they **are** recorded in the image history (`docker history`). Never pass secrets with `ARG` or `ENV`.

### EXPOSE does not publish

`EXPOSE 8080` is metadata: it tells readers and tools which port the app uses. It does **not** make the port reachable from the host — that is `docker run -p 8080:8080` (or `ports:` in Compose). Containers on the same Docker network can reach port 8080 with or without `EXPOSE`.

### CMD vs ENTRYPOINT

```text
ENTRYPOINT ["java", "-jar", "app.jar"]     the program
CMD        ["--server.port=8080"]          its default arguments

docker run taskapi                         → java -jar app.jar --server.port=8080
docker run taskapi --server.port=9090      → java -jar app.jar --server.port=9090   (CMD replaced)
docker run --entrypoint sh -it taskapi     → sh                                     (ENTRYPOINT replaced)
```

| | `CMD` | `ENTRYPOINT` |
|---|---|---|
| Replaced by | Arguments after the image name in `docker run` | Only `--entrypoint` |
| Use for | A default that users may override | The fixed program the image exists to run |
| Combined | `CMD` becomes the arguments of `ENTRYPOINT` | |

Only the **last** `CMD` and the last `ENTRYPOINT` in a Dockerfile count.

### Exec form vs shell form

```dockerfile
ENTRYPOINT ["java", "-jar", "app.jar"]   # exec form: java is PID 1 and receives SIGTERM
ENTRYPOINT java -jar app.jar             # shell form: /bin/sh -c "…" is PID 1; signals do not reach java
```

Always use the exec (JSON array) form for the main process, or `docker stop` waits 10 seconds and then kills Java without a graceful shutdown.

## Build Context and .dockerignore

`docker build -t taskapi:1.0.0 .` — the final `.` is the **build context**: the directory sent to the Docker Engine. `COPY` can read only files inside it.

A `.dockerignore` file in the context root excludes files, like `.gitignore`:

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

Benefits: a smaller, faster context; secrets such as `.env` never enter the image; and build artifacts on your laptop (`target/`) do not leak into an image that should build them itself.

## Layers and the Build Cache

Docker reuses a cached layer when the instruction and its inputs are unchanged. For `COPY`, the input is the **content** of the copied files. **Once one layer is rebuilt, every layer after it is rebuilt too.**

```text
Order A (slow)                              Order B (fast)
FROM maven:3.9-eclipse-temurin-21           FROM maven:3.9-eclipse-temurin-21
COPY . .                ← any change        COPY pom.xml .           ← changes rarely
RUN mvn package         ← downloads ALL     RUN mvn dependency:go-offline   ← cached
                          dependencies      COPY src ./src           ← your code changes
                          every time        RUN mvn package          ← only compiles
```

Rule: **least-changing first, most-changing last** — base image, then dependency definitions, then dependencies, then source code.

## JDK vs JRE Images and JVM Containers

| Image | Contains | Size (order of magnitude) | Use |
|-------|----------|---------------------------|-----|
| `maven:3.9-eclipse-temurin-21` | Maven + full JDK | Hundreds of MB | Build stage only |
| `eclipse-temurin:21-jdk` | Full JDK (compiler, tools) | Hundreds of MB | Building, debugging |
| `eclipse-temurin:21-jre` | Runtime only | Smaller | Running the app |
| `eclipse-temurin:21-jre-alpine` | Runtime on Alpine Linux (musl) | Smallest | Size-sensitive; test carefully |

At run time you need only a JRE. A smaller image downloads faster and contains fewer packages that could have vulnerabilities.

The JVM is **container-aware**: it reads the container's memory limit (cgroups). Without settings it uses at most 25 % of that limit for the heap. `-XX:MaxRAMPercentage=75` lets the heap use 75 %, leaving the rest for metaspace, threads and native memory. Avoid a fixed `-Xmx` larger than the container limit — the kernel then kills the container (exit code 137).

## Multi-Stage Builds

A multi-stage Dockerfile builds in one stage and copies only the result into a clean runtime stage. The final image contains no Maven, no JDK, no source code — only the JRE and the JAR.

This is the Dockerfile of the sample application (the [Lab Setup](../../labs/devops-lab-setup/content.md) has its full source):

```dockerfile
# ---- Stage 1: build the JAR with Maven and a full JDK ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace

# Dependencies first: this layer is reused until pom.xml changes.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
# Tests run in CI against a real PostgreSQL, before the image is built.
RUN mvn -B -q package -DskipTests

# ---- Stage 2: run it on a JRE only ----
FROM eclipse-temurin:21-jre
RUN useradd --system --uid 10001 spring
WORKDIR /app
COPY --from=build /workspace/target/*.jar app.jar
USER spring
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
```

| Line | Why |
|------|-----|
| `AS build` / `COPY --from=build` | Names the first stage and copies only its JAR |
| `COPY pom.xml` before `COPY src` | Dependency layer stays cached while only code changes |
| `-DskipTests` | Tests need PostgreSQL; CI runs them before building the image |
| `useradd` + `USER spring` | The app does not run as root inside the container |
| `target/*.jar` | Matches the Spring Boot JAR (`taskapi-1.0.0.jar`), not `*.jar.original` |

`dependency:go-offline` downloads most, not always all, plugins; the later `package` step may still fetch a few. Spring Boot can also split the JAR into layers (`java -Djarmode=tools -jar app.jar extract --layers`) so a code change re-uploads only a few MB — see [Docker and Deploying Spring Boot](../../../spring-boot/production/docker-deployment/content.md).

## Example: from Source to HTTP Endpoint

A dependency-free Java server (tested on JDK 21; it reads `PORT` and `GREETING` from the environment):

```java
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

public class HelloServer {

    public static void main(String[] args) throws IOException {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8000"));
        String greeting = System.getenv().getOrDefault("GREETING", "Hello");

        // new InetSocketAddress(port) listens on every interface (0.0.0.0),
        // which is what a published container port needs.
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/", exchange -> {
            String host = InetAddress.getLocalHost().getHostName();
            byte[] body = (greeting + " from " + host + "\n").getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, body.length);
            try (OutputStream out = exchange.getResponseBody()) {
                out.write(body);
            }
            System.out.println(exchange.getRequestMethod() + " " + exchange.getRequestURI() + " -> 200");
        });
        server.start();
        System.out.println("Listening on port " + port);
    }
}
```

Run directly on the host (`javac -d out HelloServer.java`, then `GREETING=Hi java -cp out HelloServer`) and request it with `curl -s localhost:8000/`:

**Output (varies):**

```text
Hi from devbox
```

The server's console prints `Listening on port 8000` and then `GET / -> 200`. (`devbox` is the machine's host name; yours differs.)

Its Dockerfile:

```dockerfile
FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY HelloServer.java .
RUN javac -d out HelloServer.java

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /src/out/ .
EXPOSE 8000
CMD ["java", "HelloServer"]
```

```bash
# Illustrative: run on a machine with Docker
docker build -t hello-java:1.0 .
docker run -d --name hello -p 8000:8000 -e GREETING=Hi hello-java:1.0
curl -s localhost:8000/
```

**Expected result:** the build shows two stages; `curl` prints `Hi from` followed by the **container ID** (a container's host name is its short ID) — proof the response came from inside the container. [Lab 03](../../labs/lab-dockerize-java-application/content.md) does this step by step.

## Production Relevance

- Multi-stage, JRE-only, non-root images are smaller, faster to deploy and expose less to attackers.
- A correctly ordered Dockerfile turns a five-minute CI build into a one-minute build.
- Exec-form `ENTRYPOINT` is what makes graceful shutdown during deployments work.

## Common Mistakes

- `COPY . .` before downloading dependencies — every code change re-downloads the internet.
- Missing `.dockerignore`: `.git`, `target/` or `.env` end up in the build context or the image.
- Shell-form `ENTRYPOINT`, so SIGTERM never reaches Java.
- Running as root because no `USER` is set.
- Passing passwords with `ARG`/`ENV` (visible in `docker history` / `docker inspect`).
- Believing `EXPOSE` publishes a port.

## Interview Angle

- Explain `CMD` vs `ENTRYPOINT` with the "program vs default arguments" rule and the override behaviour.
- Explain cache invalidation: one changed layer rebuilds every later layer, hence the ordering.
- Explain why multi-stage builds shrink images and why the runtime stage needs only a JRE.

## Key Takeaways

- Order instructions from least to most frequently changing; use `.dockerignore`.
- `COPY` over `ADD`; `ARG` is build-time, `ENV` is run-time; neither is for secrets.
- `EXPOSE` documents, `-p` publishes; `ENTRYPOINT` is the program, `CMD` its default arguments; use the exec form.
- Multi-stage: build with Maven + JDK, run on a JRE as a non-root user with `-XX:MaxRAMPercentage`.
