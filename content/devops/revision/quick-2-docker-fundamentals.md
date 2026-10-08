# Block 2: Docker Fundamentals

## Core Model

```text
Dockerfile ─build─► image (read-only layers) ─run─► container (+ writable layer, namespaces, cgroups)
                       ▲ pull / push ▼
                    registry (Docker Hub, ghcr.io)
```

- Container = isolated **process** on the host kernel; VM = own kernel on a hypervisor.
- CLI → Docker Engine (`dockerd`) → containerd → runc.
- Image reference: `[registry/][namespace/]repo[:tag]`; no tag = `latest`.
- A container lives as long as its main process (PID 1).

## Lifecycle and Signals

| Command | Effect |
|---------|--------|
| `run` | create + start |
| `stop` | SIGTERM → wait 10 s → SIGKILL |
| `kill` | SIGKILL |
| `start` / `restart` | same container, same configuration |
| `rm` | deletes container + writable layer (volumes stay) |

Exit codes: 0 · 1 · **137** SIGKILL/OOM · **143** SIGTERM.

## Daily Commands

`docker ps -a` · `docker logs -f --tail 100 api` · `docker exec -it api sh` · `docker inspect -f '{{.State.OOMKilled}}' api` · `docker stats --no-stream` · `docker system df`

## Traps

- New env var or image ⇒ **new container** (restart is not enough).
- Never fix containers with `exec`/`cp` — rebuild and redeploy.
- Data in the writable layer dies with `rm`.
- `docker volume prune -a` deletes unused **named** volumes.

## Self-Check

- What does exit code 137 suggest, and how do you confirm it?
- Image vs container in one sentence?
- Why does "Cannot connect to the Docker daemon" not mean the CLI is broken?
