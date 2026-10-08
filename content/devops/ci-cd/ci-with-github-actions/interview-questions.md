# CI with GitHub Actions — Interview Questions

## Beginner

### Q1. What is Continuous Integration?

**Style:** What

<details>
<summary>Answer</summary>

The practice of merging changes into the shared branch frequently and automatically building and testing every change, so integration problems and regressions are found within minutes, while they are small and fresh in the author's mind.

</details>

### Q2. What are workflows, jobs and steps in GitHub Actions?

**Style:** What

<details>
<summary>Answer</summary>

A workflow is a YAML file in `.github/workflows/` with triggers and jobs. A job runs on one runner (a fresh VM) and contains steps; jobs run in parallel unless ordered with `needs`. A step is either an action (`uses:`) or shell commands (`run:`), executed in order within the job.

</details>

### Q3. What is the difference between `uses` and `run`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`uses` runs a reusable action — for example `actions/checkout@v7` or `actions/setup-java@v6` — configured with `with:` inputs. `run` executes shell commands on the runner, such as `./mvnw -B verify`.

</details>

### Q4. What triggers a workflow?

**Style:** What

<details>
<summary>Answer</summary>

Events listed under `on:` — commonly `push` (optionally filtered by branches or paths), `pull_request`, `workflow_dispatch` for a manual run, `schedule` for cron-like runs, and `release`.

</details>

## Intermediate

### Q5. How do you run integration tests that need PostgreSQL in GitHub Actions?

**Style:** How

<details>
<summary>Answer</summary>

Declare a service container (`services: postgres: image: postgres:18`) with environment variables, a port mapping and a health check, then pass the connection settings to the tests as environment variables (`SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/taskdb`). Alternatively use Testcontainers, which starts the database from the test code using the runner's Docker.

</details>

### Q6. Why is `actions/setup-java` configured with `cache: maven`?

**Style:** Why

<details>
<summary>Answer</summary>

Each run starts on an empty VM, so Maven would download every dependency every time. The cache stores `~/.m2/repository` keyed on the hash of the `pom.xml` files and restores it in later runs, cutting minutes from the build. It is invalidated automatically when dependencies change.

</details>

### Q7. CI fails with `./mvnw: Permission denied`, but the build works on your laptop. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

The `mvnw` script is not marked executable in Git — common when it was committed from Windows, which has no executable bit. Linux runners then cannot execute it. Fix with `git update-index --chmod=+x mvnw`, commit and push (or call `sh mvnw`).

</details>

### Q8. What are artifacts, and how do they differ from caches?

**Style:** Comparison

<details>
<summary>Answer</summary>

Artifacts are outputs of a run you want to keep or download — test reports, a built JAR — uploaded with `actions/upload-artifact` and retained for a period. Caches speed up future runs by restoring inputs such as the Maven repository; they are best-effort and keyed, not outputs. Docker images for deployment go to a container registry, not to artifacts.

</details>

## Advanced

### Q9. How do you make sure nothing reaches production without passing CI?

**Style:** Architecture

<details>
<summary>Answer</summary>

Protect `main`: require pull requests and the CI check to pass before merging. In the pipeline, make the publish and deploy jobs depend on the test job (`needs: test`) and run only for pushes to `main`. Deploy only images built by that pipeline (tagged with the commit SHA), never images built by hand.

</details>

### Q10. Your CI takes 15 minutes. How would you speed it up?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Cache dependencies (Maven cache) and Docker layers (Buildx with the GitHub Actions cache); order the Dockerfile for layer reuse; split slow test suites into parallel jobs; avoid duplicate work (build the JAR once); use `paths` filters so documentation changes do not run the full pipeline; cancel superseded runs with `concurrency: … cancel-in-progress: true`. Keep correctness first: never drop tests just to be faster.

</details>
