# Lab 03 — Dockerize a Java Application

**Lab:** 03 · **Module:** Writing a Dockerfile · **Verification:** Partly tested

> [!NOTE]
> Run on your own machine. **Partly tested:** the Java program was compiled and run on JDK 21 and its HTTP responses were captured; the Docker build and run steps were not executed (no Docker in the authoring environment) and are described as expected results.

## Objective

Take a plain Java program from source code to a running container: source → Dockerfile → image → container → HTTP endpoint, with a multi-stage build and configuration through environment variables.

## Prerequisites

- JDK 21 and Docker.
- Lesson: [Writing a Dockerfile](../../docker/dockerfile-fundamentals/content.md).

## Scenario

A tiny internal service needs to run on a server that has no Java installed. You package it as an image that contains the JRE.

## Steps

### Step 1: Write and run the program locally

Create `hello-java/HelloServer.java` with the code from [Writing a Dockerfile](../../docker/dockerfile-fundamentals/content.md), section *Example: from Source to HTTP Endpoint* (an HTTP server on `PORT`, greeting from `GREETING`). Then:

```bash
cd hello-java
javac -d out HelloServer.java
GREETING=Hi java -cp out HelloServer
```

In a second terminal:

```bash
curl -s localhost:8000/
```

**Output (varies):**

```text
Hi from devbox
```

The server's terminal prints `Listening on port 8000` and `GET / -> 200`. (`devbox` stands for your machine's host name.) Stop it with Ctrl+C.

### Step 2: Write the Dockerfile

`hello-java/Dockerfile`:

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

And `.dockerignore`:

```text
out/
```

**Explanation:** the JDK stage compiles; the JRE stage contains only the `.class` file. Your local `out/` folder is excluded — the image builds its own.

### Step 3: Build the image

```bash
docker build -t hello-java:1.0 .
docker images hello-java
```

**Expected result:** two stages run (`build` and the final stage); the final image is noticeably smaller than `eclipse-temurin:21-jdk` would be.

### Step 4: Run the container

```bash
docker run -d --name hello -p 8000:8000 -e GREETING=Hi hello-java:1.0
curl -s localhost:8000/
docker logs hello
```

**Expected result:** `Hi from <12-character container ID>` — inside a container, the host name is the container's short ID. The logs show `Listening on port 8000` and your request.

### Step 5: Change configuration without rebuilding

```bash
docker rm -f hello
docker run -d --name hello -p 9000:7000 -e PORT=7000 -e GREETING=Hello hello-java:1.0
curl -s localhost:9000/
```

**Expected result:** `Hello from <container ID>` — the same image, now listening on 7000 inside the container and published on host port 9000.

### Step 6: Clean up

```bash
docker rm -f hello
```

## Verification Checklist

- ☐ The program answered locally before containerising it.
- ☐ The image builds in two stages.
- ☐ `curl` through the published port returns the greeting with the container ID.
- ☐ Changing `PORT`/`GREETING` required no rebuild.

## Common Mistakes

- Binding the server to `127.0.0.1` inside the container — published traffic arrives on the container's network interface, so the server must listen on all interfaces (`new InetSocketAddress(port)`).
- Publishing `-p 9000:8000` after changing `PORT` to 7000 — the container port must match what the app listens on.
- Using the JDK image for running.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `curl: (56) Recv failure: Connection reset by peer` | The app is not listening on the published container port, or listens only on 127.0.0.1 |
| `Error: Could not find or load main class HelloServer` | The `.class` file is not in `WORKDIR`: check `COPY --from=build /src/out/ .` |
| Build error `cannot find symbol` | Java compile error — fix the source; the image never builds from broken code |
