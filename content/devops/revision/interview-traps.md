# DevOps Interview Traps

## Docker

- **"`EXPOSE` opens the port."** No — it documents; `-p HOST:CONTAINER` publishes.
- **"A container is a lightweight VM."** No — it is an isolated process sharing the host kernel.
- **"`docker restart` applies my new environment variable / image."** No — configuration is fixed at creation; recreate the container (`up -d`).
- **"`docker stop` kills the process."** It sends SIGTERM first and SIGKILL only after the timeout (10 s).
- **"Deleting a file in a later layer removes it from the image."** Earlier layers still contain it — secrets copied once stay readable.
- **"`latest` means the newest version."** It is just a tag name someone may or may not move.

## Dockerfile

- **"`CMD` and `ENTRYPOINT` are the same."** `ENTRYPOINT` = the program; `CMD` = default arguments, replaced by `docker run` arguments.
- **"Shell form is fine."** `ENTRYPOINT java -jar app.jar` makes `/bin/sh` PID 1 — no SIGTERM to Java, no graceful shutdown.
- **"`ARG` is safe for passwords because it is build-only."** Values used in build steps appear in `docker history`.
- **"`-Xmx` equal to the container limit is efficient."** Non-heap memory pushes the process over the limit → OOM kill (137).

## Networking and Data

- **"`localhost:5432` works on my laptop, so it works in the container."** Inside a container, `localhost` is the container.
- **"Use the published port between containers."** Containers use the container port (`db:5432`).
- **"`depends_on` waits for the database."** Only with `condition: service_healthy` and a health check.
- **"`docker compose down` deletes my data."** Only `down -v` deletes named volumes.
- **"Changing `POSTGRES_PASSWORD` changes the password."** Only on an empty data directory.
- **"`/var/lib/postgresql/data` is always the mount path."** From `postgres:18` mount `/var/lib/postgresql`.

## Servers and Security

- **"ufw blocks 8080, so the container is private."** Docker-published ports bypass ufw — bind to `127.0.0.1`.
- **"Deleting the commit removes the leaked secret."** Rotate it; history and clones keep it.
- **"CORS protects my API."** Only browsers enforce it; it is not authentication.
- **"Docker group is a normal permission."** It is effectively root.

## CI/CD

- **"CD means continuous deployment."** Say which: delivery (approval) or deployment (automatic).
- **"Rollback = previous image, done."** Schema migrations do not roll back — make them backward-compatible.
- **"The job is green, so production works."** Only if it verified readiness *and* the public endpoint.
- **"Readiness checks the database."** Not by default in Spring Boot — add `db` to the readiness group.

## HTTPS and DNS

- **"DNS propagation is a push that takes 48 hours."** It is cache expiry bounded by the TTL.
- **"Certbot needs port 443 first."** HTTP-01 needs port 80 and correct DNS; 443 is configured afterwards.
- **"Add HSTS immediately with includeSubDomains."** Only when every subdomain serves HTTPS reliably.
