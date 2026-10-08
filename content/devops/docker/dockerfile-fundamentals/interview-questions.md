# Writing a Dockerfile — Interview Questions

## Beginner

### Q1. What is a Dockerfile?

**Style:** What

<details>
<summary>Answer</summary>

A text file of instructions (`FROM`, `COPY`, `RUN`, `ENTRYPOINT`, …) that `docker build` executes to produce an image. Each filesystem-changing instruction becomes a layer. It is versioned with the code, so the image can be rebuilt reproducibly.

</details>

### Q2. What is the difference between `CMD` and `ENTRYPOINT`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`ENTRYPOINT` defines the executable the container always runs; it is replaced only with `docker run --entrypoint`. `CMD` defines the default command, or — when an `ENTRYPOINT` exists — its default arguments; anything after the image name in `docker run` replaces `CMD`. Typical pattern: `ENTRYPOINT ["java","-jar","app.jar"]` with optional default arguments in `CMD`.

</details>

### Q3. What is the difference between `COPY` and `ADD`?

**Style:** Comparison

<details>
<summary>Answer</summary>

Both copy files into the image. `ADD` additionally extracts local tar archives and can fetch remote URLs. Because that behaviour is implicit, best practice is to use `COPY` and reserve `ADD` for deliberately extracting a local archive.

</details>

### Q4. Does `EXPOSE 8080` make the application reachable from the host?

**Style:** Trap

<details>
<summary>Answer</summary>

No. `EXPOSE` is documentation/metadata. Publishing requires `docker run -p HOST:CONTAINER` (or `ports:` in Compose), or `-P` to publish all exposed ports on random host ports. Containers on the same Docker network can reach the port either way.

</details>

## Intermediate

### Q5. What is a multi-stage build and why use it for Java?

**Style:** Why

<details>
<summary>Answer</summary>

A Dockerfile with several `FROM` stages; later stages copy selected files from earlier ones (`COPY --from=build`). For Java, stage one uses a Maven + JDK image to compile and package; stage two starts from a JRE image and copies only the JAR. The final image has no build tools, source code or Maven repository — it is smaller, faster to pull and has a smaller attack surface.

</details>

### Q6. How does the build cache work, and how should you order a Java Dockerfile?

**Style:** How

<details>
<summary>Answer</summary>

Docker reuses a layer if the instruction and its inputs (for `COPY`, the file contents) are unchanged; once one layer is rebuilt, all following layers are rebuilt. So copy `pom.xml` and resolve dependencies first, then copy `src` and package. A code change then only recompiles; dependencies stay cached until `pom.xml` changes.

</details>

### Q7. What is the difference between `ARG` and `ENV`? Can you use them for passwords?

**Style:** Comparison

<details>
<summary>Answer</summary>

`ARG` exists only during the build (`--build-arg`); `ENV` is set during the build and in every container started from the image. Neither is safe for secrets: `ENV` values are visible with `docker inspect`, and `ARG` values used in build steps show up in `docker history`. Pass secrets at run time (environment from a protected `.env`, a secret manager) or use BuildKit secret mounts for build-time secrets.

</details>

### Q8. What is the build context, and what does `.dockerignore` do?

**Style:** What

<details>
<summary>Answer</summary>

The build context is the directory (the `.` in `docker build .`) whose files are sent to the engine and are the only files `COPY` can use. `.dockerignore` excludes paths from it — `target/`, `.git/`, `.env`, IDE folders — making builds faster and keeping secrets and stale artifacts out of images.

</details>

## Advanced

### Q9. Why should the `ENTRYPOINT` use the exec form?

**Style:** Why

<details>
<summary>Answer</summary>

With the exec form (`["java","-jar","app.jar"]`) Java runs as PID 1 and receives the SIGTERM sent by `docker stop`, so Spring Boot shuts down gracefully. The shell form (`java -jar app.jar`) runs `/bin/sh -c`, which becomes PID 1 and does not forward signals; Docker waits for the timeout and then SIGKILLs the JVM, dropping in-flight requests.

</details>

### Q10. A Spring Boot container with a 512 MB limit is killed with exit code 137 under load. The Dockerfile has `-Xmx512m`. Explain and fix.

**Style:** Production failure

<details>
<summary>Answer</summary>

The heap alone may use the entire limit, but the JVM also needs metaspace, thread stacks, code cache and direct buffers. Total usage exceeds 512 MB and the kernel's OOM killer kills the process (SIGKILL → 137). Remove the fixed `-Xmx` and use `-XX:MaxRAMPercentage=75` (heap sized from the container limit), or raise the limit; then watch `docker stats` under load.

</details>
