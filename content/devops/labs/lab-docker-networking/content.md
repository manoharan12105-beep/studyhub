# Lab 08 — Docker Networking

**Lab:** 08 · **Module:** Docker Networking · **Verification:** Partly tested

> [!NOTE]
> Run on your own machine. **Partly tested:** the application-level error messages quoted here were captured from real runs of the Task API; the Docker network commands were not executed when this lab was written.

## Objective

See with your own eyes why `localhost` fails between containers, how Docker DNS resolves names on user-defined networks but not on the default bridge, and how published ports differ from container ports.

## Prerequisites

- Docker; [Lab 06](../lab-connect-spring-boot-to-postgresql/content.md).
- Lesson: [Docker Networking](../../docker/docker-networking/content.md).

## Scenario

A teammate insists "`localhost:5432` works on my laptop, so it must work in Docker". You build a small demonstration.

## Steps

### Step 1: Default bridge — no names

```bash
docker run -d --name pg-default -e POSTGRES_PASSWORD=devpass postgres:18
docker run --rm postgres:18 pg_isready -h pg-default
```

**Expected result:** `pg_isready` reports no response / could not translate host name — the default bridge network has no DNS for container names.

### Step 2: User-defined network — names work

```bash
docker network create labnet
docker run -d --name pg-lab --network labnet -e POSTGRES_PASSWORD=devpass postgres:18
sleep 5
docker run --rm --network labnet postgres:18 pg_isready -h pg-lab
docker run --rm --network labnet busybox nslookup pg-lab
```

**Expected result:** `pg-lab:5432 - accepting connections`; `nslookup` answers from server `127.0.0.11` with the container's private IP.

### Step 3: localhost is the container itself

```bash
docker run --rm --network labnet postgres:18 pg_isready -h localhost
```

**Expected result:** `localhost:5432 - no response` — this throwaway container runs no server of its own. Exactly the situation of a Spring Boot container configured with `localhost`, whose real error is: `Connection to localhost:5432 refused. Check that the hostname and port are correct and that the postmaster is accepting TCP/IP connections.`

### Step 4: Published port vs container port

```bash
docker rm -f pg-lab
docker run -d --name pg-lab --network labnet -p 127.0.0.1:15432:5432 -e POSTGRES_PASSWORD=devpass postgres:18
sleep 5
docker run --rm --network labnet postgres:18 pg_isready -h pg-lab -p 5432
docker run --rm --network labnet postgres:18 pg_isready -h pg-lab -p 15432
```

**Expected result:** port 5432 accepts connections; port 15432 gets no response. Inside the network, containers use the **container** port; 15432 exists only on the host.

### Step 5: Inspect the network

```bash
docker network inspect labnet
```

**Expected result:** JSON with the subnet (for example `172.18.0.0/16`), the gateway and a `Containers` section listing `pg-lab`.

### Step 6: Clean up

```bash
docker rm -f pg-default pg-lab
docker network rm labnet
```

## Verification Checklist

- ☐ Name resolution failed on the default bridge and worked on `labnet`.
- ☐ `localhost` inside a container did not reach the database.
- ☐ Container port 5432 worked between containers; host port 15432 did not.

## Common Mistakes

- Concluding "Docker networking is broken" from a test on the default bridge.
- Using the published host port between containers.

## Troubleshooting

| Symptom | Meaning |
|---------|---------|
| Name does not resolve | Different networks, default bridge, or typo — `docker network inspect` |
| Resolves but refused | Wrong port or the server is not ready yet |
| Works from host, not from another container | You used `localhost` or the host port inside the network |
