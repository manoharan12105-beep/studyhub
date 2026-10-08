# Docker Commands

## Images

| Command | Does |
|---------|------|
| `docker pull postgres:18` | Download an image |
| `docker images` | List local images |
| `docker build -t app:1.0 .` | Build from `./Dockerfile` with `.` as context |
| `docker build --platform linux/amd64 -t app:1.0 .` | Build for a VPS from an ARM laptop |
| `docker tag app:1.0 ghcr.io/me/app:1.0` | Add another name |
| `docker push ghcr.io/me/app:1.0` | Upload to a registry |
| `docker rmi app:1.0` | Remove an image tag |
| `docker history app:1.0` | Layers and their sizes |

## Containers

| Command | Does |
|---------|------|
| `docker run -d --name api -p 8080:8080 -e K=V app:1.0` | Create + start in background |
| `docker run --rm -it image sh` | Throwaway interactive container |
| `docker ps` / `docker ps -a` | Running / all containers |
| `docker stop api` | SIGTERM, then SIGKILL after 10 s |
| `docker kill api` | SIGKILL now |
| `docker start api` / `docker restart api` | Start again (same config) / stop + start |
| `docker rm api` / `docker rm -f api` | Remove stopped / force remove |

## Inspecting

| Command | Does |
|---------|------|
| `docker logs -f --tail 100 api` | Follow the last 100 lines |
| `docker logs --since 10m -t api` | Last 10 minutes with timestamps |
| `docker exec -it api sh` | Shell inside a running container |
| `docker exec db psql -U u -d db` | Run a tool inside |
| `docker inspect -f '{{.State.ExitCode}} {{.State.OOMKilled}}' api` | Why it stopped |
| `docker inspect -f '{{json .Config.Env}}' api` | Its environment (contains secrets!) |
| `docker stats --no-stream` | CPU / memory per container |
| `docker cp api:/app/app.jar .` | Copy a file out |

## Networks and Volumes

| Command | Does |
|---------|------|
| `docker network create appnet` | User-defined network (name DNS) |
| `docker network inspect appnet` | Subnet and attached containers |
| `docker network connect appnet api` | Attach a running container |
| `docker volume ls` / `docker volume inspect pgdata` | List / details |
| `docker volume rm pgdata` | **Deletes the data** |

## Cleaning

| Command | Removes |
|---------|---------|
| `docker system df` | (shows usage) |
| `docker container prune` | Stopped containers |
| `docker image prune` | Dangling images |
| `docker image prune -a` | All images without a container (incl. rollback candidates) |
| `docker builder prune` | Build cache |
| `docker system prune` | Stopped containers, unused networks, dangling images, build cache |
| `docker volume prune` | Unused **anonymous** volumes |
| `docker volume prune -a` | Unused **named** volumes too — dangerous on a database host |

## Exit Codes

`0` ok · `1` app error · `137` SIGKILL (often OOM) · `143` SIGTERM (normal stop)
