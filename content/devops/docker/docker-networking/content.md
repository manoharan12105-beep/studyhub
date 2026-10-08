# Docker Networking

**Module:** Docker · **Interview priority:** Core

## What Is It?

Every container gets its own network namespace: its own interfaces, IP address, routing table and `localhost`. **Docker networks** connect containers to each other and, through published ports, to the outside world.

```text
                         host (your laptop or VPS)
 browser ─► host:8080 ──-p──┐
                             ▼
             ┌──────── network "appnet" (bridge, 172.18.0.0/16) ────────┐
             │   taskapi  172.18.0.3:8080  ──"db:5432"──►  db  172.18.0.2:5432
             │   (Spring Boot)                Docker DNS     (PostgreSQL)  │
             └──────────────────────────────────────────────────────────┘
```

Addresses shown are examples from Docker's default private ranges; yours may differ.

## Why It Matters

- A Spring Boot container must reach its PostgreSQL container — that only works on a shared network, by name.
- "Connection refused to localhost:5432" from a container is the single most common Docker mistake.
- Networks are also a security boundary: a database that is on no public network and has no published port cannot be reached from the internet.

## Why Containers Need Networks

Isolation means a container cannot see other containers' processes or sockets. To talk, they must share a network, where each container gets an IP address, and — on user-defined networks — a DNS name.

| Need | Solution |
|------|----------|
| Container → container | Put both on the same user-defined network; use the container or service **name** |
| Host or internet → container | Publish a port: `-p HOST:CONTAINER` |
| Container → internet | Works by default (outbound NAT through the host) |
| Container → a service on the host | `host.docker.internal` (Docker Desktop; on Linux add `--add-host=host.docker.internal:host-gateway`) |

## Network Drivers

| Driver | What it is | Use |
|--------|-----------|-----|
| `bridge` (default `bridge` network) | A virtual switch on the host; containers get private IPs | Used when you give no `--network`; **no DNS by name** |
| `bridge` (user-defined) | Same, created with `docker network create` | **Recommended**: automatic DNS by container name, isolation per application |
| `host` | No isolation: the container uses the host's network directly | Rare; Linux only; ports are not mapped |
| `none` | No network | Batch jobs that must not talk to anything |

## The Default Bridge vs a Custom Network

```bash
# Illustrative: run on a machine with Docker
docker network ls                       # bridge, host and none always exist
docker network create appnet            # a user-defined bridge network
docker network inspect appnet           # subnet, gateway, connected containers
```

| | Default `bridge` | User-defined (`appnet`, Compose networks) |
|---|---|---|
| Name resolution | No — only IP addresses (which change on restart) | Yes — Docker's embedded DNS resolves container names and aliases |
| Isolation | Every container without `--network` shares it | Only containers you attach |
| Attach/detach running containers | No | Yes (`docker network connect`) |

**Use a user-defined network for every multi-container application.** Docker Compose creates one automatically (`<project>_default`).

## Container-to-Container Communication

```bash
# Illustrative
docker network create appnet
docker run -d --name db --network appnet \
  -e POSTGRES_DB=taskdb -e POSTGRES_USER=taskapp -e POSTGRES_PASSWORD=devpass \
  postgres:18
docker run -d --name taskapi --network appnet -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/taskdb \
  -e SPRING_DATASOURCE_USERNAME=taskapp \
  -e SPRING_DATASOURCE_PASSWORD=devpass \
  taskapi:1.0.0
```

**Expected result:** `taskapi` starts and `curl localhost:8080/actuator/health` on the host returns `{"groups":["liveness","readiness"],"status":"UP"}`. Note that `db` has **no** `-p`: the application reaches it over `appnet`, and nothing outside Docker can.

(`devpass` is a throwaway local password; real deployments read it from a protected `.env` file — [Configuration and Secrets](../../production-readiness/configuration-and-secrets/content.md).)

## Host localhost vs Container localhost

> [!IMPORTANT]
> Spring Boot must **not** use `localhost` to reach PostgreSQL when PostgreSQL runs in another container. Inside the `taskapi` container, `localhost` is `taskapi` itself. Use the database container's name (`db`) — or its Compose service name.

The demonstration — same image, same database, one changed word:

| `SPRING_DATASOURCE_URL` in the app container | Result |
|-----------------------------------------------|--------|
| `jdbc:postgresql://localhost:5432/taskdb` | Start-up fails: `Connection to localhost:5432 refused. Check that the hostname and port are correct and that the postmaster is accepting TCP/IP connections.` Nothing listens on 5432 *inside the app container*. |
| `jdbc:postgresql://db:5432/taskdb` on `appnet` | Starts; Docker DNS resolves `db` to the database container's IP. |
| `jdbc:postgresql://db:5432/taskdb`, app **not** on `appnet` | Start-up fails: `Caused by: java.net.UnknownHostException: db` — no DNS entry for `db` on the app's network. |

The error lines are the PostgreSQL JDBC driver's real messages, captured from the Task API when it was started with an unresolvable host name and with an address where nothing listened (that run used port 5999, so its message named `localhost:5999`; the message names whatever host and port you configured).

## DNS Inside Docker Networks

On a user-defined network, each container's `/etc/resolv.conf` points to Docker's embedded DNS server at `127.0.0.11`. It answers:

- container names (`db`, `taskapi`),
- network aliases (`--network-alias database`),
- Compose service names (`db`), which can map to several containers (`docker compose up --scale app=2` gives the name `app` two addresses),

and forwards everything else (`github.com`) to the host's resolvers.

```bash
# Illustrative: test resolution and connectivity from a throwaway container on the same network
docker run --rm --network appnet postgres:18 pg_isready -h db -p 5432
docker run --rm --network appnet busybox nslookup db
```

**Expected result:** `pg_isready` reports that `db:5432` is accepting connections; `nslookup` returns the database container's private IP from the `127.0.0.11` server.

## Ports vs EXPOSE

| | `EXPOSE 8080` (Dockerfile) | `-p 8080:8080` / `ports:` |
|---|---|---|
| What it does | Documents the port | Opens a host port and forwards it into the container |
| Needed for container → container | No | No |
| Needed for host/internet → container | No | **Yes** |

Container-to-container traffic on a shared network goes **directly to the container port** (`db:5432`); published host ports are irrelevant to it. This is why `db` needs no `-p` at all.

## Example: Isolating Tiers

Two networks keep the database off the network that faces the proxy:

```text
proxy-net:   nginx ─── taskapi
backend-net:           taskapi ─── db
```

`taskapi` joins both networks; `nginx` cannot reach `db` at all. Compose expresses this with `networks:` per service. For a single small application, one network plus "no published database port" is usually enough.

## Production Relevance

- Never publish PostgreSQL's port on a server; keep it on an internal network.
- On a VPS, publish the application only on `127.0.0.1` and let Nginx proxy to it ([VPS Deployment](../../server-deployment/vps-deployment/content.md)).
- When a container cannot reach another, check in this order: same network? right name? right **container** port? target healthy?

## Common Mistakes

- `localhost` in the datasource URL.
- Using the default bridge network and wondering why names do not resolve.
- Using the **host** port (`db:5433` when mapped `5433:5432`) between containers — inside the network the container port (5432) is used.
- Hard-coding container IP addresses, which change when containers are recreated.
- Publishing the database port "just for debugging" and forgetting it.

## Interview Angle

- Explain why `localhost` fails between containers (separate network namespaces).
- Explain default bridge vs user-defined bridge (DNS, isolation).
- Explain `EXPOSE` vs `-p`, and why containers on one network do not need published ports.

## Key Takeaways

- Each container has its own `localhost`; containers reach each other **by name** on a user-defined network.
- Docker's embedded DNS (`127.0.0.11`) resolves container and service names; the default bridge network does not.
- Published ports are for traffic from outside Docker; container-to-container traffic uses the container port directly.
- Keep databases unpublished and on internal networks.
