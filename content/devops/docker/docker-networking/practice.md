# Docker Networking — Practice

### P1. The right URL

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** container DNS

The app and a PostgreSQL container named `db` share the network `appnet`. Which datasource URL works from the app container?

- A) `jdbc:postgresql://localhost:5432/taskdb`
- B) `jdbc:postgresql://127.0.0.1:5432/taskdb`
- C) `jdbc:postgresql://db:5432/taskdb`
- D) `jdbc:postgresql://appnet:5432/taskdb`

<details>
<summary>Answer</summary>

**Answer:** C) `jdbc:postgresql://db:5432/taskdb`

</details>

### P2. Default bridge

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** default vs user-defined bridge

Which network lets containers resolve each other by name?

- A) The default `bridge` network
- B) A user-defined bridge network
- C) The `none` network
- D) Any network, always

<details>
<summary>Answer</summary>

**Answer:** B) A user-defined bridge network

</details>

### P3. Create and attach

**Difficulty:** Easy · **Type:** Command · **Concepts:** docker network

Create a network `appnet` and run `postgres:18` on it as `db` with password `devpass`, without publishing any port.

<details>
<summary>Answer</summary>

```bash
# Illustrative
docker network create appnet
docker run -d --name db --network appnet -e POSTGRES_PASSWORD=devpass postgres:18
```

</details>

### P4. Read the error

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** localhost in containers

The app container's logs show `Connection to localhost:5432 refused`. PostgreSQL runs in container `db` and is healthy. What is the fix?

<details>
<summary>Answer</summary>

Change `SPRING_DATASOURCE_URL` to `jdbc:postgresql://db:5432/taskdb` and make sure both containers are on the same user-defined network. `localhost` was the app container itself.

</details>

### P5. Host port or container port?

**Difficulty:** Medium · **Type:** Output · **Concepts:** ports between containers

`db` was started with `-p 15432:5432` on `appnet`. Predict the result of each URL from the app container on `appnet`: (a) `db:5432`, (b) `db:15432`, (c) `localhost:15432`.

<details>
<summary>Answer</summary>

(a) works — the container port. (b) refused — nothing listens on 15432 inside `db`. (c) refused — `localhost` is the app container, and the published port exists on the host, not inside the app container.

</details>

### P6. Unknown host

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** network membership

The logs show `Caused by: java.net.UnknownHostException: db`, and `docker ps` shows `db` running. Which command shows whether both containers are on the same network?

<details>
<summary>Answer</summary>

```bash
# Illustrative
docker network inspect appnet
```

Its `Containers` section lists every attached container. If the app is missing, recreate it with `--network appnet` (or `docker network connect appnet <app>`).

</details>

### P7. Test from inside

**Difficulty:** Medium · **Type:** Command · **Concepts:** debugging connectivity

Without installing anything, check from a throwaway container on `appnet` whether PostgreSQL at `db:5432` accepts connections.

<details>
<summary>Answer</summary>

```bash
# Illustrative
docker run --rm --network appnet postgres:18 pg_isready -h db -p 5432
```

The postgres image already contains `pg_isready`.

</details>

### P8. Reach the host

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** host.docker.internal

During development, PostgreSQL runs directly on a Linux laptop (not in Docker) and the app runs in a container. Which host name and `docker run` option let the app reach it?

<details>
<summary>Answer</summary>

Use `jdbc:postgresql://host.docker.internal:5432/taskdb` and start the container with `--add-host=host.docker.internal:host-gateway` (Docker Desktop provides the name automatically). PostgreSQL must listen on an address reachable from the Docker bridge and allow that client in `pg_hba.conf`.

</details>

### P9. Design the networks

**Difficulty:** Hard · **Type:** Architecture · **Concepts:** network isolation

Services: `nginx` (public), `app`, `db`. Design networks so `nginx` can reach `app`, `app` can reach `db`, and `nginx` cannot reach `db`. Which services publish ports?

<details>
<summary>Answer</summary>

`front` network: `nginx`, `app`. `back` network: `app`, `db`. Only `nginx` publishes ports (80/443). `app` and `db` publish nothing; `app` is reached by `nginx` over `front`, and `db` by `app` over `back`.

</details>
