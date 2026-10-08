# Docker Networking — Interview Questions

## Beginner

### Q1. Why can't a Spring Boot container connect to PostgreSQL at `localhost:5432` when PostgreSQL runs in another container?

**Style:** Why

<details>
<summary>Answer</summary>

Each container has its own network namespace, so `localhost` inside the application container refers to that container only — and no PostgreSQL runs there. Put both containers on the same user-defined network and use the database container's name: `jdbc:postgresql://db:5432/taskdb`.

</details>

### Q2. How do containers find each other by name?

**Style:** How

<details>
<summary>Answer</summary>

On a user-defined network (including the networks Compose creates), Docker runs an embedded DNS server at `127.0.0.11` inside each container. It resolves container names, network aliases and Compose service names to the containers' current IP addresses, and forwards other names to the host's resolvers.

</details>

### Q3. What is the difference between `EXPOSE` and publishing a port?

**Style:** Comparison

<details>
<summary>Answer</summary>

`EXPOSE` in a Dockerfile only documents which port the app listens on. Publishing (`-p HOST:CONTAINER` or `ports:` in Compose) creates a forwarding rule from a host port to the container port so traffic from outside Docker can reach it. Neither is needed for container-to-container traffic on a shared network.

</details>

### Q4. What network does a container join if you do not specify one?

**Style:** What

<details>
<summary>Answer</summary>

The default `bridge` network. Containers there get private IPs and outbound internet access, but no automatic DNS by container name, so they can only reach each other by IP (which changes). That is why multi-container apps use user-defined networks.

</details>

## Intermediate

### Q5. PostgreSQL is published as `-p 5433:5432`. Which port does the app container use to reach it over the shared network?

**Style:** Trap

<details>
<summary>Answer</summary>

5432 — the container port. Published host ports (5433) matter only for traffic coming from the host or outside. Inside the network, containers talk directly to each other's container ports: `db:5432`.

</details>

### Q6. How would a container reach a PostgreSQL server installed directly on the host?

**Style:** How

<details>
<summary>Answer</summary>

Use `host.docker.internal` as the host name. Docker Desktop provides it automatically; on Linux add `--add-host=host.docker.internal:host-gateway` (or `extra_hosts` in Compose). PostgreSQL on the host must also listen on an address the container can reach and allow that client in `pg_hba.conf`.

</details>

### Q7. What does `--network host` do and when would you avoid it?

**Style:** Trade-off

<details>
<summary>Answer</summary>

The container shares the host's network stack: no isolation, no port mapping, and the app binds directly to host ports. It can help with special networking needs or performance, but it removes the security boundary and port flexibility, conflicts with other services on the same ports, and behaves differently on Docker Desktop. Prefer bridge networks with explicit published ports.

</details>

### Q8. Why should you never hard-code container IP addresses?

**Style:** Why

<details>
<summary>Answer</summary>

Container IPs are assigned from the network's pool when a container starts and usually change when it is recreated (every deployment). Names are stable and resolved by Docker DNS at connection time.

</details>

## Advanced

### Q9. How would you prevent the Nginx container from ever reaching the database container?

**Style:** Architecture

<details>
<summary>Answer</summary>

Use two networks: a front network with Nginx and the application, and a back network with the application and the database. The application joins both; Nginx is only on the front network, so it has no route or DNS entry for the database. Also publish no database port.

</details>

### Q10. Two containers are on the same network, the name resolves, but the connection is refused. What do you check?

**Style:** Troubleshooting

<details>
<summary>Answer</summary>

That the target process is running and listening on that **container** port (`docker exec target ss -ltn` or its logs), that it listens on `0.0.0.0` rather than only `127.0.0.1` inside its container, that you are using the container port rather than the published host port, and that the target has finished starting (a database still initialising refuses connections — use health checks and `depends_on: condition: service_healthy`).

</details>
