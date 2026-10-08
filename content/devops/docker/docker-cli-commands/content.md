# Docker CLI Commands

**Module:** Docker · **Interview priority:** Core

## What Is It?

The `docker` command-line client controls the Docker Engine: it pulls and builds images, runs containers, and inspects and cleans them up. This lesson covers the commands you use every day, each with its **purpose**, **syntax**, an **example**, the **expected behaviour**, a **common mistake** and **troubleshooting**.

> [!NOTE]
> Run these commands on your own machine with Docker installed (Docker Desktop on Windows/macOS, Docker Engine on Linux) — StudyHub cannot run them. Output depends on your machine, so each command describes what you should see instead of showing a fixed transcript. The [Lab Setup](../../labs/devops-lab-setup/content.md) explains the installation.

## Why It Matters

- Every lab, deployment and production investigation in this subject uses these commands.
- Interviews test them directly: "difference between `docker stop` and `docker kill`", "how do you get a shell inside a container?", "how do you see why a container exited?"

## How It Works

```text
Images:      pull · images · build · rmi
Containers:  run · ps · ps -a · stop · start · restart · rm
Inspecting:  logs · exec · inspect · stats · cp
```

Most commands accept a container **name** or an ID prefix (`docker logs api` or `docker logs 4f2c`). Always name your containers with `--name` — names are easier to read than IDs.

## Commands

### docker pull

**Purpose:** download an image (all its missing layers) from a registry.

```bash
# Illustrative
docker pull postgres:18
docker pull ghcr.io/your-user/taskapi:4f2c1a9
```

**Expected behaviour:** one line per layer (`Pull complete` or `Already exists` for layers you have), then a `Digest: sha256:…` and `Status: Downloaded newer image for postgres:18`.

**Common mistake:** omitting the tag and getting `latest`, which can change without warning.

**Troubleshooting:** "manifest unknown" or "not found" → wrong name or tag; "unauthorized" or "denied" → a private image: `docker login <registry>` first.

### docker images

**Purpose:** list local images with repository, tag, image ID, age and size.

```bash
# Illustrative
docker images
docker images postgres            # only one repository
```

**Expected behaviour:** a table with columns `REPOSITORY`, `TAG`, `IMAGE ID`, `CREATED`, `SIZE`. The same image ID under two tags is one image with two names.

**Common mistake:** reading `SIZE` as disk usage per image — shared layers are counted in every image that uses them. `docker system df` shows real totals.

**Troubleshooting:** `<none>` repository and tag = a "dangling" image left behind when a tag moved to a newer build; `docker image prune` removes them.

### docker build

**Purpose:** build an image from a `Dockerfile` and a **build context** (the directory whose files the build may `COPY`).

```bash
# Illustrative: run in the project folder
docker build -t taskapi:1.0.0 .
docker build -t taskapi:1.0.0 -f docker/Dockerfile .    # Dockerfile elsewhere
```

**Expected behaviour:** each instruction runs as a numbered step; unchanged steps print `CACHED`; the build ends with the image named `taskapi:1.0.0`.

**Common mistake:** forgetting the final `.` (the build context), or a huge context because `target/`, `.git/` and `node_modules/` are not in `.dockerignore`.

**Troubleshooting:** "failed to compute cache key: … not found" → the `COPY` source is not inside the context or is excluded by `.dockerignore`. Details: [Writing a Dockerfile](../dockerfile-fundamentals/content.md).

### docker run

**Purpose:** create **and** start a container from an image.

```bash
# Illustrative
docker run -d --name api -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  --restart unless-stopped \
  taskapi:1.0.0

docker run --rm -it eclipse-temurin:21-jre java -version   # one-off, removed when it exits
```

| Option | Meaning |
|--------|---------|
| `-d` | Detached: run in the background, print the container ID |
| `--name api` | Give the container a name |
| `-p 8080:8080` | Publish: host port 8080 → container port 8080 (`HOST:CONTAINER`) |
| `-e KEY=value`, `--env-file .env` | Environment variables |
| `-v name:/path` | Mount a volume (or a host folder) at `/path` |
| `--network appnet` | Join a user-defined network |
| `--restart unless-stopped` | Restart after crashes and reboots, unless you stopped it |
| `--rm` | Remove the container when it exits |
| `-it` | Interactive terminal (for shells and one-off tools) |
| `--memory 512m` | Memory limit |

**Expected behaviour:** with `-d`, a 64-character container ID is printed and the command returns. Without `-d`, the container's output streams to your terminal.

**Common mistake:** writing `-p 8080` (publishes container port 8080 on a *random* host port) or reversing the order — it is always `HOST:CONTAINER`.

**Troubleshooting:** "port is already allocated" → another container or process uses that host port (`docker ps`, `sudo ss -ltnp`); "The container name "/api" is already in use" → remove or rename the old container (`docker rm -f api`).

### docker ps

**Purpose:** list **running** containers.

```bash
# Illustrative
docker ps
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**Expected behaviour:** columns `CONTAINER ID`, `IMAGE`, `COMMAND`, `CREATED`, `STATUS` (for example `Up 3 minutes (healthy)`), `PORTS` (for example `0.0.0.0:8080->8080/tcp`) and `NAMES`.

**Common mistake:** concluding a container "disappeared" — it may have exited; use `docker ps -a`.

**Troubleshooting:** `STATUS` shows `Restarting (1) 5 seconds ago` → the main process keeps crashing and the restart policy keeps restarting it: read `docker logs`.

### docker ps -a

**Purpose:** list **all** containers, including exited ones.

```bash
# Illustrative
docker ps -a
docker ps -a --filter status=exited
```

**Expected behaviour:** exited containers show `Exited (code) … ago`. Exit code `0` = finished normally; `1` = application error; `137` = killed by SIGKILL (often out of memory or `docker kill`); `143` = stopped by SIGTERM.

**Common mistake:** leaving dozens of exited containers behind from experiments; use `--rm` for one-off runs.

**Troubleshooting:** for an unexpected exit, `docker logs <name>` shows the last output, and `docker inspect -f '{{.State.OOMKilled}}' <name>` tells whether memory was the cause.

### docker stop

**Purpose:** stop a running container gracefully.

```bash
# Illustrative
docker stop api
docker stop -t 30 api       # wait up to 30 seconds before forcing
```

**Expected behaviour:** Docker sends SIGTERM to the main process, waits (10 seconds by default), then sends SIGKILL. Spring Boot finishes in-flight requests and exits; the container becomes `Exited (143)` or `Exited (0)`.

**Common mistake:** using `docker kill` by habit, which skips graceful shutdown.

**Troubleshooting:** a stop that always takes exactly 10 seconds means the process ignores SIGTERM — often because the `ENTRYPOINT` uses shell form (`ENTRYPOINT java -jar app.jar`), which makes `/bin/sh` PID 1 so the signal never reaches Java. Use the exec (JSON array) form.

### docker start

**Purpose:** start an existing, stopped container again (same configuration, same writable layer).

```bash
# Illustrative
docker start api
docker start -a api         # attach and stream its output
```

**Expected behaviour:** prints the name and the container is running again.

**Common mistake:** expecting `docker start` to pick up a new image or new `-e` values — configuration is fixed when the container is created. To change it, remove the container and `docker run` again (or use Compose, which does this for you).

**Troubleshooting:** if it exits again at once, the cause is in the logs, not in the start command.

### docker restart

**Purpose:** stop then start a container.

```bash
# Illustrative
docker restart api
```

**Expected behaviour:** same as `stop` followed by `start`; the container keeps its ID and writable layer.

**Common mistake:** restarting to "deploy" a new version — the container still runs the old image.

**Troubleshooting:** if a restart "fixes" a problem temporarily, find the cause (memory leak, exhausted connection pool) in the logs and metrics.

### docker rm

**Purpose:** delete a container (and its writable layer).

```bash
# Illustrative
docker rm api               # must be stopped first
docker rm -f api            # force: kill if running, then remove
docker container prune      # remove all stopped containers (asks for confirmation)
```

**Expected behaviour:** prints the name; the container no longer appears in `docker ps -a`. Named volumes it used are **kept**.

**Common mistake:** `docker rm -f` on a database container without a volume — the data is gone.

**Troubleshooting:** "cannot remove container … : container is running" → stop it first or use `-f`.

### docker rmi

**Purpose:** delete a local image (tag).

```bash
# Illustrative
docker rmi taskapi:1.0.0
docker image prune          # remove dangling images
docker image prune -a       # remove every image not used by a container (careful)
```

**Expected behaviour:** `Untagged: taskapi:1.0.0`, then `Deleted: sha256:…` for each layer no other image uses.

**Common mistake:** expecting it to free space while containers (even stopped ones) still use the image.

**Troubleshooting:** "conflict: unable to remove … image is being used by … container" → `docker ps -a --filter ancestor=taskapi:1.0.0`, remove those containers, then retry.

### docker logs

**Purpose:** show what a container's main process wrote to stdout and stderr.

```bash
# Illustrative
docker logs api
docker logs -f --tail 100 api          # last 100 lines, then follow
docker logs --since 10m -t api         # last 10 minutes, with timestamps
```

**Expected behaviour:** the application's log lines — for Spring Boot, the banner, `The following 1 profile is active: "prod"`, `Tomcat started on port 8080`, and `Started TaskApiApplication in … seconds`.

**Common mistake:** the application writes logs to a file inside the container instead of stdout — then `docker logs` shows nothing useful and the file fills the container's layer.

**Troubleshooting:** logs survive a stop but are deleted with the container; capture them before `docker rm`. By default they are stored as JSON files under `/var/lib/docker` and can grow until the disk is full — set log rotation ([Logging, Monitoring and Health](../../operations/logging-monitoring-and-health/content.md)).

### docker exec

**Purpose:** run an extra command inside a **running** container.

```bash
# Illustrative
docker exec -it api sh                                  # a shell inside the app container
docker exec api env                                     # its environment variables
docker exec -it db psql -U taskapp -d taskdb            # a SQL prompt in the database container
```

**Expected behaviour:** the command runs in the container's namespaces — its filesystem, network and environment.

**Common mistake:** fixing things inside a running container with `exec`; the change is lost when the container is replaced. Use exec to **look**, then change the image or the configuration.

**Troubleshooting:** "executable file not found" → the image does not contain that program (minimal images may lack `bash`; try `sh`); "is not running" → `exec` needs a running container, check `docker ps -a`.

### docker inspect

**Purpose:** show the full JSON description of a container, image, network or volume.

```bash
# Illustrative
docker inspect api
docker inspect -f '{{.State.Status}} {{.State.ExitCode}} {{.State.OOMKilled}}' api
docker inspect -f '{{json .Config.Env}}' api
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' api
```

**Expected behaviour:** a large JSON document; `-f` with a Go template extracts one field.

**Common mistake:** printing `inspect` output in a shared channel — it includes environment variables, which may contain secrets.

**Troubleshooting:** use it to answer "what configuration does this container *really* have?" — environment, mounts, networks, restart policy, health status.

### docker stats

**Purpose:** live CPU, memory, network and disk I/O per container.

```bash
# Illustrative
docker stats
docker stats --no-stream api db       # one snapshot, then exit
```

**Expected behaviour:** columns `CPU %`, `MEM USAGE / LIMIT`, `MEM %`, `NET I/O`, `BLOCK I/O`, `PIDS`.

**Common mistake:** reading a JVM's memory use as a leak — the JVM grows its heap up to its limit and keeps it. Watch whether it approaches the *limit*.

**Troubleshooting:** a container near its memory limit that restarts with exit code 137 is being OOM-killed: lower `-XX:MaxRAMPercentage`, raise the limit, or fix the leak.

### docker cp

**Purpose:** copy files between a container and the host.

```bash
# Illustrative
docker cp api:/app/app.jar ./app-from-container.jar     # container → host
docker cp backup.sql db:/tmp/backup.sql                 # host → container
```

**Expected behaviour:** a short `Successfully copied …` message; works on running and stopped containers.

**Common mistake:** using `docker cp` to deploy new code into a running container — not reproducible and lost on replacement.

**Troubleshooting:** "Could not find the file" → check the path inside the container with `docker exec api ls -l /app`.

### Cleaning up disk space

```bash
# Illustrative
docker system df            # space used by images, containers, volumes, build cache
docker system prune         # remove stopped containers, unused networks, dangling images, build cache
```

`docker system prune` never removes **named** volumes. `--volumes` adds unused *anonymous* volumes; `docker volume prune --all` also deletes unused *named* volumes — on a database server, a stopped database container's volume counts as unused, so delete volumes only by name after checking.

## Example

A complete short session (on your machine):

```bash
# Illustrative
docker run -d --name web -p 8081:80 nginx:1.30
curl -s http://localhost:8081 | head -n 4
docker logs --tail 2 web
docker exec web nginx -v
docker stop web && docker rm web
```

**Expected result:** `curl` prints the start of the Nginx welcome page (`<!DOCTYPE html>` … `<title>Welcome to nginx!</title>`), the logs show the access-log line for your request, `nginx -v` prints the version inside the container, and the container is removed at the end. [Lab 01](../../labs/lab-first-docker-container/content.md) walks through this step by step.

## Production Relevance

- `docker ps`, `docker logs`, `docker inspect` and `docker stats` are the first four commands of almost every container incident.
- Exit codes (0, 1, 137, 143) tell you quickly whether a container finished, crashed, was killed or was stopped.

## Common Mistakes

- Treating containers as pets: `exec` in, fix by hand, `docker cp` new files in.
- Expecting `start`/`restart` to apply a new image or new environment variables.
- Removing database containers that have no volume.
- Never cleaning images and logs until the disk is full.

## Interview Angle

- `run` = `create` + `start`; `stop` = SIGTERM then SIGKILL; `kill` = SIGKILL.
- How to debug an exited container: `docker ps -a` (exit code) → `docker logs` → `docker inspect`.
- `-p HOST:CONTAINER` order, and why `exec` is for inspection, not for fixes.

## Key Takeaways

- Images: `pull`, `images`, `build`, `rmi`. Containers: `run`, `ps`, `ps -a`, `stop`, `start`, `restart`, `rm`. Inspecting: `logs`, `exec`, `inspect`, `stats`, `cp`.
- Container configuration is fixed at creation; changing the image or environment means a new container.
- Exit code 137 suggests SIGKILL (often out of memory); 143 is a normal SIGTERM stop.
- Clean up with `docker system df` and `prune`, but never prune volumes on a database server by accident.
