# Docker CLI Commands — Interview Questions

## Beginner

### Q1. What is the difference between `docker run` and `docker start`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`docker run` creates a **new** container from an image (with the options you give: ports, environment, volumes) and starts it. `docker start` starts an **existing** stopped container with the configuration it was created with. To change ports, environment or image, you must create a new container.

</details>

### Q2. What is the difference between `docker stop` and `docker kill`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`docker stop` sends SIGTERM, waits for a grace period (10 seconds by default) and then sends SIGKILL, allowing graceful shutdown. `docker kill` sends SIGKILL (or a chosen signal) immediately, so the application cannot clean up.

</details>

### Q3. How do you open a shell inside a running container?

**Style:** How

<details>
<summary>Answer</summary>

`docker exec -it <container> sh` (or `bash` if the image has it). `-i` keeps stdin open and `-t` allocates a terminal. The container must be running.

</details>

### Q4. What does `-p 8080:80` mean in `docker run`?

**Style:** What

<details>
<summary>Answer</summary>

Publish container port 80 on host port 8080: traffic to the host's port 8080 is forwarded to port 80 inside the container. The order is always `HOST:CONTAINER`. Adding an address (`127.0.0.1:8080:80`) limits it to that host interface.

</details>

## Intermediate

### Q5. A container keeps restarting. How do you investigate?

**Style:** Troubleshooting

<details>
<summary>Answer</summary>

`docker ps` shows `Restarting (code)`; `docker ps -a` and `docker inspect -f '{{.State.ExitCode}} {{.State.OOMKilled}}'` give the exit code and whether it was OOM-killed. `docker logs --tail 100 <name>` shows the error (bad configuration, unreachable database). `docker stats` shows memory near the limit. Fix the cause, then recreate the container; restarting alone repeats the failure.

</details>

### Q6. What do exit codes 0, 1, 137 and 143 mean for a container?

**Style:** What

<details>
<summary>Answer</summary>

0: the main process finished successfully. 1: an application error. 137 (128 + 9): killed by SIGKILL — `docker kill`, a stop timeout, or the out-of-memory killer. 143 (128 + 15): terminated by SIGTERM, the normal result of `docker stop` for a JVM.

</details>

### Q7. You changed an environment variable and ran `docker restart api`, but the app still uses the old value. Why?

**Style:** Trap

<details>
<summary>Answer</summary>

Environment variables are part of the container's configuration, fixed when the container was created. `restart` reuses the same container. Remove it and `docker run` with the new value — or change `compose.yaml`/`.env` and run `docker compose up -d`, which recreates the container when its configuration changed.

</details>

### Q8. Why should you not use `docker exec` or `docker cp` to fix a production container?

**Style:** Why

<details>
<summary>Answer</summary>

The change exists only in that container's writable layer: it is not in Git, not in the image, not reviewed or tested, and it disappears the next time the container is recreated. Use exec to diagnose; fix the code or configuration, build a new image and redeploy.

</details>

## Advanced

### Q9. `docker stop api` always takes exactly 10 seconds and the logs show no graceful shutdown. What is likely wrong?

**Style:** Debugging

<details>
<summary>Answer</summary>

The main process (PID 1) is not receiving SIGTERM — typically because the image uses the shell form `ENTRYPOINT java -jar app.jar` or a wrapper script without `exec`, so `/bin/sh` is PID 1 and does not forward the signal. Docker waits out the grace period and SIGKILLs. Use the exec form `ENTRYPOINT ["java", "-jar", "app.jar"]` or `exec java …` in the script.

</details>

### Q10. A Docker host's disk is full. Which commands do you use and what is safe to delete?

**Style:** Production failure

<details>
<summary>Answer</summary>

`df -h` confirms the full filesystem; `docker system df` shows space used by images, containers, volumes and build cache. Safe: dangling images (`docker image prune`), stopped containers (`docker container prune`), build cache (`docker builder prune`), and huge container logs (fix with log rotation and recreate the container). Unsafe without checking: `docker volume prune --all`, which deletes unused **named** volumes — a stopped database container's volume counts as unused. (`docker volume prune` without `--all`, and `docker system prune --volumes`, remove only anonymous volumes.)

</details>
