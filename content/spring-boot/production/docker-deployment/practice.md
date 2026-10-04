# Docker and Deploying Spring Boot — Practice

### P1. Image contents

**Difficulty:** Easy · **Type:** MCQ

What should the final runtime image of a Spring Boot service contain?

- A) JDK, Maven, source code and the JAR
- B) A JRE and the application's extracted layers, running as a non-root user
- C) Tomcat installed separately plus a WAR
- D) The JAR and the production database password

<details>
<summary>Answer</summary>

**Answer:** B) A JRE and the application's extracted layers, running as a non-root user

</details>

### P2. OOMKilled

**Difficulty:** Medium · **Type:** Debugging

Pods with a 512 MiB memory limit are repeatedly OOMKilled; the entrypoint uses `java -Xmx512m -jar app.jar`. Explain.

<details>
<summary>Answer</summary>

The heap alone may use 512 MiB, and the JVM needs extra memory for metaspace, thread stacks, code cache and direct buffers, so total usage exceeds the container limit and the kernel kills the process. Use `-XX:MaxRAMPercentage=70–75` (or a smaller `-Xmx`) and size the limit realistically.

</details>

### P3. Slow builds

**Difficulty:** Medium · **Type:** Scenario

Every one-line code change causes a 150 MB image layer to be rebuilt and pushed. How do you fix it?

<details>
<summary>Answer</summary>

Extract Spring Boot's layers (`java -Djarmode=tools -jar app.jar extract --layers`) and copy `dependencies`, `spring-boot-loader`, `snapshot-dependencies` and `application` as separate `COPY` instructions in that order (or use buildpacks). Also copy `pom.xml` and resolve dependencies before copying `src` so the dependency download step is cached.

</details>
