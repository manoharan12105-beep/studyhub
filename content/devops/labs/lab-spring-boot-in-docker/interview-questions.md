# Lab 04 — Interview Questions

## Beginner

### Q1. Why are tests skipped in the Docker build of the Task API?

**Style:** Why

<details>
<summary>Answer</summary>

The integration tests need a PostgreSQL database, which is not available inside `docker build`. CI runs the full test suite against a PostgreSQL service container before building the image, so the image is only built from tested code; the Docker build just packages it.

</details>

## Intermediate

### Q2. How do you confirm which configuration a running container actually uses?

**Style:** How

<details>
<summary>Answer</summary>

The start-up log shows the active profile; `/api/info` shows the version and profile; `docker inspect -f '{{json .Config.Env}}' taskapi` or `docker exec taskapi env` shows the environment variables (careful: they include secrets). Comparing them with what you intended catches typos and missing variables.

</details>

### Q3. `docker stop taskapi` takes exactly 10 seconds and no shutdown lines appear in the logs. What is wrong?

**Style:** Debugging

<details>
<summary>Answer</summary>

Java did not receive SIGTERM: the `ENTRYPOINT` is probably in shell form, so `/bin/sh` is PID 1. Docker waits its 10-second timeout and kills the JVM with SIGKILL. Use the exec form `ENTRYPOINT ["java", …]`.

</details>
