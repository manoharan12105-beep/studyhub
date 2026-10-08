# Docker CLI Commands — Practice

### P1. Publish the port

**Difficulty:** Easy · **Type:** Command · **Concepts:** docker run -p

Run `nginx:1.30` in the background as `web`, reachable at `http://localhost:8081` on your machine.

<details>
<summary>Answer</summary>

```bash
# Illustrative
docker run -d --name web -p 8081:80 nginx:1.30
```

</details>

### P2. Where is my container?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** ps, ps -a

`docker ps` shows nothing, but you ran `docker run -d --name api taskapi:1.0.0` a minute ago. What do you run next?

- A) `docker images`
- B) `docker ps -a`
- C) `docker restart`
- D) `docker pull taskapi:1.0.0`

<details>
<summary>Answer</summary>

**Answer:** B) `docker ps -a`

**Explanation:** The container probably exited. `ps -a` shows it with its exit code; then read `docker logs api`.

</details>

### P3. Graceful or not

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** stop vs kill

Which command lets Spring Boot finish in-flight requests before the container stops?

- A) `docker kill api`
- B) `docker rm -f api`
- C) `docker stop api`
- D) `docker pause api`

<details>
<summary>Answer</summary>

**Answer:** C) `docker stop api`

</details>

### P4. Read the logs

**Difficulty:** Easy · **Type:** Command · **Concepts:** docker logs

Show the last 50 lines of the `api` container's logs and keep following new lines.

<details>
<summary>Answer</summary>

```bash
# Illustrative
docker logs -f --tail 50 api
```

</details>

### P5. Decode the exit code

**Difficulty:** Medium · **Type:** Output · **Concepts:** exit codes

`docker ps -a` shows `Exited (137) 2 minutes ago` for `api`, and nobody ran `docker kill`. What do you suspect and how do you confirm?

<details>
<summary>Answer</summary>

137 = SIGKILL; without a manual kill the usual cause is the out-of-memory killer. Confirm with `docker inspect -f '{{.State.OOMKilled}}' api` (prints `true`) and check the memory limit and JVM settings.

</details>

### P6. New value, same container

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** container configuration

You started `docker run -d --name api -e LOG_LEVEL=INFO taskapi:1.0.0` and now need `LOG_LEVEL=DEBUG`. Write the commands.

<details>
<summary>Answer</summary>

```bash
# Illustrative
docker rm -f api
docker run -d --name api -e LOG_LEVEL=DEBUG taskapi:1.0.0
```

Environment is fixed at creation; `restart` would keep `INFO`.

</details>

### P7. Remove the image

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** rmi

`docker rmi taskapi:1.0.0` fails with "image is being used by stopped container 9c1e…". What do you do?

<details>
<summary>Answer</summary>

Remove the containers that use it, then the image:

```bash
# Illustrative
docker ps -a --filter ancestor=taskapi:1.0.0
docker rm 9c1e
docker rmi taskapi:1.0.0
```

</details>

### P8. Look inside

**Difficulty:** Medium · **Type:** Command · **Concepts:** exec

Open a `psql` prompt as user `taskapp` on database `taskdb` inside the running `db` container.

<details>
<summary>Answer</summary>

```bash
# Illustrative
docker exec -it db psql -U taskapp -d taskdb
```

</details>

### P9. One field only

**Difficulty:** Medium · **Type:** Command · **Concepts:** inspect

Print only the restart policy name of container `api`.

<details>
<summary>Answer</summary>

```bash
# Illustrative
docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' api
```

</details>

### P10. Clean, but safely

**Difficulty:** Hard · **Type:** Decision · **Concepts:** prune

A production host running PostgreSQL in a container with a named volume is at 95 % disk. A colleague suggests `docker system prune -a -f && docker volume prune -a -f`. What could happen, and what do you run instead?

<details>
<summary>Answer</summary>

`docker volume prune -a` deletes every **named** volume not used by a container — if the database container is stopped at that moment (for example during an update), its data volume is deleted. `docker system prune -a` also removes every image without a container, including the previous release you might roll back to. Instead: `docker system df` to see what is large, then `docker image prune` (dangling images), `docker container prune`, `docker builder prune`, and fix log growth with log rotation. Delete volumes only by name after confirming they are unused.

</details>
