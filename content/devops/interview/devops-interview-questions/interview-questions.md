# DevOps and Docker Interview Questions — Interview Questions

## Beginner

### Q1. What problem does Docker solve?

**Style:** Why

<details>
<summary>Answer</summary>

Environment differences: "it works on my machine". Docker packages the application with its runtime and libraries into an image that runs the same on every machine with a container engine, starts in seconds, isolates applications from each other, and makes deployments repeatable and versioned.

</details>

### Q2. Image vs container — explain with an analogy.

**Style:** Comparison

<details>
<summary>Answer</summary>

An image is like a class (or a program on disk): an immutable template. A container is like an object (or a running process): an instance with its own state — a writable layer, network identity and resources. Many containers can run from one image.

</details>

### Q3. Container vs virtual machine?

**Style:** Comparison

<details>
<summary>Answer</summary>

A VM emulates hardware and runs its own kernel; a container is an isolated process on the host kernel. Containers are lighter and faster to start; VMs isolate more strongly and can run different operating systems. Cloud servers are VMs that often run containers.

</details>

### Q4. What does `EXPOSE` do in a Dockerfile?

**Style:** Trap

<details>
<summary>Answer</summary>

It documents the port the application listens on. It does not publish anything; publishing is `-p HOST:CONTAINER` or Compose `ports:`.

</details>

### Q5. `CMD` vs `ENTRYPOINT`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`ENTRYPOINT` is the fixed executable; `CMD` provides default arguments (or the default command when there is no entrypoint). Arguments after the image name in `docker run` replace `CMD`; `--entrypoint` replaces the entrypoint.

</details>

### Q6. `COPY` vs `ADD`?

**Style:** Comparison

<details>
<summary>Answer</summary>

Both copy files from the build context. `ADD` also extracts local tar archives and can download URLs; prefer `COPY` for clarity and use `ADD` only to extract a local archive deliberately.

</details>

### Q7. What is a Docker volume?

**Style:** What

<details>
<summary>Answer</summary>

Storage managed by Docker outside a container's lifecycle and mounted into containers. Data in a volume survives container removal and recreation, which is essential for databases.

</details>

### Q8. What is Docker Compose?

**Style:** What

<details>
<summary>Answer</summary>

A tool that defines a multi-container application in YAML — services, networks, volumes, environment, ports, health checks, restart policies — and manages it with `docker compose up/down/logs/ps`.

</details>

### Q9. What is CI/CD?

**Style:** What

<details>
<summary>Answer</summary>

Continuous Integration builds and tests every change automatically. Continuous Delivery makes every passing change releasable with a manual approval; Continuous Deployment releases every passing change automatically.

</details>

### Q10. What is a reverse proxy, and why use Nginx in front of Spring Boot?

**Style:** Why

<details>
<summary>Answer</summary>

A server that accepts client requests and forwards them to backends. Nginx terminates HTTPS, exposes standard ports, hides the app on localhost, adds headers and limits, serves static files, can balance several instances, and logs every request.

</details>

## Intermediate

### Q11. Why are multi-stage builds used for Java images?

**Style:** Why

<details>
<summary>Answer</summary>

To build with Maven and a JDK in one stage and copy only the JAR into a JRE-only final stage: smaller, faster to pull, fewer vulnerable packages, no source code or build tools in production.

</details>

### Q12. How does layer caching affect how you write a Dockerfile?

**Style:** How

<details>
<summary>Answer</summary>

A changed layer invalidates all layers after it, so put rarely changing steps first: base image, `COPY pom.xml`, dependency download, then `COPY src` and the build. Code changes then rebuild only the last layers.

</details>

### Q13. How do two containers communicate?

**Style:** How

<details>
<summary>Answer</summary>

Attach them to the same user-defined network (Compose does this automatically) and use the container or service name as host name with the container port, e.g. `db:5432`. Docker's embedded DNS resolves the name.

</details>

### Q14. Why does `localhost` fail between containers?

**Style:** Trap

<details>
<summary>Answer</summary>

Each container has its own network namespace; `localhost` refers to the container itself. Use the other container's name instead.

</details>

### Q15. Named volume vs bind mount?

**Style:** Comparison

<details>
<summary>Answer</summary>

A named volume is managed by Docker and referenced by name — best for database data. A bind mount maps a chosen host path — good for config files and source code in development, but host permissions and paths become your problem.

</details>

### Q16. `docker compose down` vs `docker compose down -v`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`down` removes containers and networks and keeps named volumes; `down -v` also removes the declared named volumes — deleting database data.

</details>

### Q17. Does `depends_on` wait for the database to be ready?

**Style:** Trap

<details>
<summary>Answer</summary>

Not in its short form — it only orders start-up. With `condition: service_healthy` and a database health check (`pg_isready`), Compose waits until the database accepts connections.

</details>

### Q18. How do you pass secrets to a containerised application?

**Style:** How

<details>
<summary>Answer</summary>

At run time through environment variables from a protected source — a git-ignored `.env` with `chmod 600`, a secret manager or Docker secrets — never in the image, the Dockerfile or the repository. In CI, through GitHub Secrets.

</details>

### Q19. What is a container registry and how do image tags work?

**Style:** What

<details>
<summary>Answer</summary>

A server storing images by repository and tag (Docker Hub, GHCR). A tag is a mutable label pointing to an image digest. CI pushes tagged images; servers pull them. Deploy unique tags such as the commit SHA, not `latest`.

</details>

### Q20. What do GitHub Actions workflows, jobs and steps mean?

**Style:** What

<details>
<summary>Answer</summary>

A workflow is a YAML file with triggers; it has jobs that run on fresh runners (in parallel unless linked by `needs`); each job has steps that run actions (`uses`) or commands (`run`).

</details>

### Q21. What is the difference between liveness and readiness?

**Style:** Comparison

<details>
<summary>Answer</summary>

Liveness: is the process alive and not stuck — failing it means restart. Readiness: can it serve traffic now — failing it means stop sending requests (or, in a deploy script, do not declare success). Readiness may include critical dependencies like the database; liveness should not.

</details>

### Q22. What is TLS termination?

**Style:** What

<details>
<summary>Answer</summary>

Decrypting HTTPS at a proxy or load balancer (Nginx) and forwarding plain HTTP to the backend over a trusted network or loopback. Certificates live in one place; the app receives `X-Forwarded-Proto` to know the original scheme.

</details>

### Q23. What does a DNS A record do, and what is TTL?

**Style:** What

<details>
<summary>Answer</summary>

It maps a host name to an IPv4 address. TTL is how long resolvers may cache the answer, which controls how quickly a change becomes visible ("propagation").

</details>

## Advanced

### Q24. How do you make a Spring Boot container shut down gracefully?

**Style:** How

<details>
<summary>Answer</summary>

Exec-form `ENTRYPOINT` so Java is PID 1 and receives SIGTERM; Spring Boot's graceful shutdown (default since 3.4) finishes in-flight requests within `spring.lifecycle.timeout-per-shutdown-phase`; Docker's stop timeout (`stop_grace_period`) must be longer than that.

</details>

### Q25. Why can Docker-published ports bypass a host firewall like ufw?

**Style:** Trap

<details>
<summary>Answer</summary>

Docker manages iptables rules for published ports (NAT and its own chains) that are evaluated before ufw's input rules. Bind internal ports to `127.0.0.1` or do not publish them.

</details>

### Q26. How do you roll back a deployment, and what is the catch?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Deploy the previous immutable image tag. The catch is the database: schema migrations are not rolled back with the image, so migrations must be backward-compatible (expand/contract).

</details>

### Q27. How would you scale the Task API beyond one container?

**Style:** Architecture

<details>
<summary>Answer</summary>

Keep the app stateless (no local sessions or files), run several instances behind a load balancer (an Nginx `upstream` on one server, or several servers behind a cloud load balancer), size the database connection pool for the total number of instances, then scale the database (read replicas, managed database). Orchestrators like Kubernetes automate placement, scaling and rolling updates at larger scale.

</details>

### Q28. Why should containers not run as root?

**Style:** Why

<details>
<summary>Answer</summary>

If the application is compromised, root inside the container makes escapes and damage easier (writing to mounted files, exploiting kernel bugs). A non-root user (`USER spring`) limits what an attacker can do; combine with no privileged mode and no Docker socket mounts.

</details>

### Q29. What is immutable infrastructure and how does your pipeline follow it?

**Style:** How

<details>
<summary>Answer</summary>

Artifacts are never modified after creation; changes mean building and deploying a new version. The pipeline builds one image per commit, tags it with the SHA, pushes it, and the server replaces the container; nobody edits containers in place.

</details>

### Q30. Which parts of Kubernetes would you mention as "what comes next" — and why didn't you use it?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Deployments with rolling updates, Services for discovery and load balancing, liveness/readiness probes, ConfigMaps and Secrets, horizontal autoscaling, and self-healing across nodes. For one service on one server, Docker Compose gives the needed features with far less operational complexity; the same image and health endpoints would move to Kubernetes later unchanged.

</details>
