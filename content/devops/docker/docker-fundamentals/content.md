# Docker Fundamentals: Images, Containers and Registries

**Module:** Docker · **Interview priority:** Core

## What Is It?

**Docker** packages an application together with everything it needs to run — a runtime such as a JRE, system libraries, configuration defaults — into an **image**, and runs that image as an isolated process called a **container**. The same image runs the same way on your laptop, on a CI runner and on a production server.

```text
Dockerfile ──docker build──► Image ──docker run──► Container (a running process)
 (recipe)                    (read-only template)    (image + writable layer + isolation)
                               │   ▲
                     docker push│   │docker pull
                               ▼   │
                            Registry (Docker Hub, GitHub Container Registry)
```

## Why Containers?

The problem Docker solves is "it works on my machine":

| Without containers | With containers |
|--------------------|-----------------|
| Install the right JDK, PostgreSQL, OS packages on every server by hand | The image already contains the JRE and libraries |
| Two apps need different Java versions on one server — conflict | Each container has its own runtime |
| A new developer spends a day setting up the database | `docker run postgres:18` |
| Server drift: nobody knows what was installed | The image is built from a versioned `Dockerfile` |

Containers start in about a second, use little overhead, and make deployments repeatable — the basis of the immutable "build once, run anywhere" model from [DevOps Fundamentals](../../devops-foundations/devops-fundamentals/content.md).

## Containers vs Virtual Machines

```text
   Virtual machines                         Containers
┌────────┐┌────────┐┌────────┐        ┌────────┐┌────────┐┌────────┐
│ App A  ││ App B  ││ App C  │        │ App A  ││ App B  ││ App C  │
│ Libs   ││ Libs   ││ Libs   │        │ Libs   ││ Libs   ││ Libs   │
│Guest OS││Guest OS││Guest OS│        └────────┘└────────┘└────────┘
└────────┘└────────┘└────────┘        ┌──────────────────────────────┐
┌──────────────────────────────┐      │ Container engine (Docker)    │
│ Hypervisor                   │      ├──────────────────────────────┤
├──────────────────────────────┤      │ Host OS kernel (Linux)       │
│ Hardware                     │      │ Hardware                     │
└──────────────────────────────┘      └──────────────────────────────┘
```

| | Virtual machine | Container |
|---|---|---|
| Isolates | A whole machine with its own kernel | Processes sharing the host kernel |
| Size | Gigabytes | Megabytes to a few hundred MB |
| Start time | Tens of seconds to minutes | About a second |
| Isolation strength | Strong (separate kernel) | Good, but weaker (shared kernel) |
| Typical use | Run different operating systems, strong tenant isolation | Package and run applications |

They are often combined: your cloud **VPS is a virtual machine**, and Docker runs containers inside it.

> [!NOTE]
> Linux containers need a Linux kernel. Docker Desktop on Windows and macOS runs a small Linux VM behind the scenes, which is why the same images work there.

## How Isolation Works

A container is a normal Linux process with three kernel features applied:

| Feature | Gives the container | Example |
|---------|---------------------|---------|
| **Namespaces** | Its own view of processes, network, hostname, mounts | Inside, your Java app is PID 1 and has its own `localhost` |
| **cgroups** | Resource limits | `--memory 512m` caps the container's RAM |
| **Union filesystem** (overlay2) | Image layers plus a private writable layer | Many containers share one read-only image |

The `localhost` point matters later: inside a container, `localhost` means *that container*, not your laptop and not another container.

## Docker Architecture

```text
docker CLI ──REST API over /var/run/docker.sock──► dockerd (Docker Engine)
                                                       │ manages images, containers,
                                                       │ networks, volumes
                                                       ▼
                                                   containerd ──► runc ──► container process
```

| Part | Role |
|------|------|
| **Docker CLI** (`docker`) | The command you type; only a client |
| **Docker Engine** (`dockerd`) | The daemon that does the work: builds, pulls, runs, networks, volumes |
| **containerd / runc** | Lower-level runtime that actually creates the isolated process |
| **Registry** | Server that stores images (Docker Hub, `ghcr.io`) |

Because the CLI is only a client, "Cannot connect to the Docker daemon" means the **daemon** is not running (or you lack permission on its socket) — not that the CLI is broken.

## Docker Images

An image is a read-only template: a stack of **layers** plus metadata (default command, exposed ports, environment variables, working directory).

An image reference has this shape:

```text
[registry/][namespace/]repository[:tag]

postgres:18                         → docker.io/library/postgres:18 (Docker Hub, official image)
eclipse-temurin:21-jre              → docker.io/library/eclipse-temurin:21-jre
ghcr.io/your-user/taskapi:4f2c1a9   → GitHub Container Registry, your image, a commit tag
nginx                               → docker.io/library/nginx:latest (no tag = latest)
```

## Image Layers

Each layer records the filesystem changes of one build step. Layers are shared and cached:

```text
taskapi image                         another Java image on the same host
┌───────────────────────────┐
│ app.jar            (60 MB)│         ┌────────────────────────┐
├───────────────────────────┤         │ other.jar              │
│ JRE              (~150 MB)│ ◄─same──┤ JRE                    │ stored once
├───────────────────────────┤         ├────────────────────────┤
│ Ubuntu base       (~80 MB)│ ◄─same──┤ Ubuntu base            │ stored once
└───────────────────────────┘         └────────────────────────┘
```

When a container runs, Docker adds a thin **writable layer** on top. Files the container changes are copied up into that layer (copy-on-write); the image never changes. When the container is removed, its writable layer is deleted — which is why databases need **volumes** ([PostgreSQL in Docker](../postgresql-in-docker/content.md)).

Sizes above are rounded orders of magnitude, not measurements.

## Docker Containers

A container is a running (or stopped) instance of an image. One image can run as many containers:

```text
image taskapi:1.0.0 ──► container taskapi-1 (port 8081)
                    └─► container taskapi-2 (port 8082)
```

A container lives as long as its **main process** (PID 1). When `java -jar app.jar` exits — normally or with an exception — the container stops. A container that "starts and immediately stops" usually has a main process that failed: read `docker logs`.

## Container Lifecycle

```text
          docker create            docker start
 image ─────────────────► created ─────────────► running ◄──── docker unpause
             docker run = create + start          │  │  └─────► paused (docker pause)
                                                  │  │
                      main process exits /        │  │ docker restart = stop + start
                      docker stop / docker kill   ▼  │
                                                exited ──docker start──► running
                                                  │
                                       docker rm  ▼
                                               removed (writable layer deleted)
```

| State | `docker ps` | `docker ps -a` | Writable layer |
|-------|-------------|----------------|----------------|
| running | shown | shown | kept |
| exited (stopped) | hidden | shown | kept |
| removed | — | — | **deleted** |

`docker stop` sends SIGTERM and, after a grace period (10 seconds by default), SIGKILL — enough for Spring Boot's graceful shutdown. `docker kill` sends SIGKILL immediately.

## Docker Hub and Container Registries

A **registry** stores and serves images; a **repository** in it holds the tags of one image.

| Registry | Address | Typical use |
|----------|---------|-------------|
| Docker Hub | `docker.io` (the default) | Official images (`postgres`, `nginx`, `eclipse-temurin`) and public images |
| GitHub Container Registry | `ghcr.io` | Images built by GitHub Actions next to your code |
| Cloud registries | Amazon ECR, Google Artifact Registry, Azure ACR | Images deployed inside that cloud |

**Official images** (no namespace, like `postgres`) are maintained and scanned; prefer them, and pin a version tag instead of `latest`. The [Container Registry](../../ci-cd/container-registry/content.md) lesson covers pushing your own images.

## Example

Run PostgreSQL without installing it:

```bash
# Illustrative: run on a machine with Docker
docker run -d --name demo-db -e POSTGRES_PASSWORD=devpass postgres:18
docker ps
docker logs demo-db
docker stop demo-db
docker rm demo-db
```

**Expected result:** `docker run` pulls the image the first time (you see the layers download), prints a long container ID and returns. `docker ps` lists `demo-db` with status `Up …` and port `5432/tcp` (not published to the host). The logs end with `database system is ready to accept connections`. After `stop` the container is listed only by `docker ps -a`; after `rm` it is gone.

## Production Relevance

- Production servers run images built by CI, never containers modified by hand.
- Pinned tags (`postgres:18`, `taskapi:4f2c1a9`) make deployments reproducible; `latest` makes them unpredictable.
- Knowing that removing a container deletes its writable layer prevents the classic "we lost the database" incident.

## Common Mistakes

- Thinking a container is a lightweight VM you log into and maintain. Containers are disposable; change the image instead.
- Storing data in the container's writable layer (lost on `docker rm`).
- Using `latest` in production.
- Treating "Cannot connect to the Docker daemon" as a CLI problem instead of checking `systemctl status docker` and group membership.

## Interview Angle

- Image vs container: class vs object; template vs running instance with its own writable layer.
- Container vs VM: shared kernel vs own kernel; isolation strength vs density and start-up time.
- Name the kernel features (namespaces, cgroups, union filesystem) and the client–daemon architecture.

## Key Takeaways

- An image is an immutable stack of layers; a container is a process started from it with a writable layer and isolation.
- Containers share the host kernel: fast and small, slightly weaker isolation than VMs.
- The `docker` CLI talks to the Docker Engine daemon, which pulls images from registries such as Docker Hub and `ghcr.io`.
- A container stops when its main process exits, and its writable layer is deleted when it is removed.
