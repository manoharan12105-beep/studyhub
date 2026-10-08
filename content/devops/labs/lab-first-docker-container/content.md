# Lab 01 — Run Your First Docker Container

**Lab:** 01 · **Module:** Docker Fundamentals · **Verification:** Instruction only

> [!NOTE]
> Run every command on your own machine with Docker installed. **Instruction only:** these steps were not executed when this lab was written (no Docker in the authoring environment); results are described, not captured.

## Objective

Pull an image, run a container in the background, publish a port, read its logs, run a command inside it, and stop and remove it — the core container lifecycle.

## Prerequisites

- Docker Desktop or Docker Engine running ([Lab Setup](../devops-lab-setup/content.md)).
- Lessons: [Docker Fundamentals](../../docker/docker-fundamentals/content.md), [Docker CLI Commands](../../docker/docker-cli-commands/content.md).

## Scenario

Before containerising your own application, you want to see a well-known server (Nginx) run in a container and understand every state it goes through.

## Steps

### Step 1: Check Docker

```bash
docker version
docker run --rm hello-world
```

**Expected result:** `docker version` shows both a **Client** and a **Server** section (the server is the Docker Engine). `hello-world` prints "Hello from Docker!" and a list of what just happened (pull, create, run). `--rm` removes the container afterwards.

**Explanation:** if only the Client section appears with "Cannot connect to the Docker daemon", the engine is not running.

### Step 2: Pull an image

```bash
docker pull nginx:1.30
docker images nginx
```

**Expected result:** several layers download (`Pull complete`), then `docker images` lists `nginx` with tag `1.30` and its size.

### Step 3: Run a container with a published port

```bash
docker run -d --name web -p 8081:80 nginx:1.30
docker ps
```

**Expected result:** a long container ID is printed. `docker ps` shows `web`, status `Up …`, ports `0.0.0.0:8081->80/tcp`.

**Explanation:** `-d` runs it in the background, `--name` names it, `-p 8081:80` forwards host port 8081 to port 80 inside the container.

### Step 4: Send a request

```bash
curl -s http://localhost:8081 | head -n 5
```

**Expected result:** the beginning of an HTML page containing `<title>Welcome to nginx!</title>`. Open `http://localhost:8081` in a browser to see the same page.

### Step 5: Read the logs and look inside

```bash
docker logs web
docker exec web nginx -v
docker exec -it web sh -c 'ls /usr/share/nginx/html'
```

**Expected result:** the logs contain an access-log line for your `curl` request (`"GET / HTTP/1.1" 200`). `nginx -v` prints the version inside the container. The `ls` lists `50x.html` and `index.html`.

### Step 6: Stop, start and remove

```bash
docker stop web
docker ps            # web is gone from this list
docker ps -a         # … but listed here as Exited
docker start web
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081
docker rm -f web
docker ps -a
```

**Expected result:** after `stop`, `web` appears only with `-a` as `Exited (0)`. After `start` the page answers again (`200`). After `rm -f` it is gone from both lists; the image remains in `docker images`.

## Verification Checklist

- ☐ `docker version` shows Client and Server.
- ☐ `curl localhost:8081` returned the Nginx welcome page.
- ☐ You saw your request in `docker logs web`.
- ☐ You saw the container as `Exited` with `docker ps -a` after stopping it.
- ☐ `docker ps -a` no longer lists `web` at the end.

## Common Mistakes

- Writing `-p 80:8081` (reversed): the container listens on 80, so the order is `HOST:CONTAINER` = `8081:80`.
- Running a second container with the same `--name` before removing the first.
- Forgetting `-d`, so the terminal is attached to Nginx's output (Ctrl+C stops the container).

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Cannot connect to the Docker daemon` | Start Docker Desktop, or `sudo systemctl start docker`; on Linux add yourself to the `docker` group and log in again |
| `port is already allocated` | Another container or program uses 8081: choose `-p 8082:80` or stop the other one (`docker ps`) |
| `The container name "/web" is already in use` | `docker rm -f web`, then run again |
| `curl: (7) Failed to connect` | Check `docker ps` — is it running, and is the port mapping shown? |
