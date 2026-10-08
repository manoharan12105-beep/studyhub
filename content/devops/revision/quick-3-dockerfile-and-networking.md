# Block 3: Dockerfile and Networking

## Dockerfile Essentials

- Order: `FROM` → `COPY pom.xml` → `RUN dependency:go-offline` → `COPY src` → `RUN package`. A changed layer rebuilds everything after it.
- Multi-stage: Maven + JDK build → JRE runtime, `USER spring`, exec-form `ENTRYPOINT`, `-XX:MaxRAMPercentage=75`.
- `CMD` = default args (replaced by `docker run … args`); `ENTRYPOINT` = program (replaced by `--entrypoint`).
- `COPY` > `ADD`; `ARG` build-time, `ENV` run-time — no secrets in either.
- `EXPOSE` documents; `-p HOST:CONTAINER` publishes.
- `.dockerignore`: `target/`, `.git/`, `.env`.

## Spring Boot in a Container

- Env vars override YAML: `SPRING_DATASOURCE_URL`, `SPRING_PROFILES_ACTIVE=prod`.
- `prod` profile with `${…}` and no defaults → missing var fails fast: `'url' must start with "jdbc"`.
- Log to stdout; health: liveness (no external deps) vs readiness (Task API adds `db`).

## Networking Rules

| Rule | Example |
|------|---------|
| `localhost` = the container itself | `localhost:5432` from the app → refused |
| Containers talk by **name** on a user-defined network | `db:5432` |
| Default bridge has no name DNS | `UnknownHostException` |
| Use the **container** port between containers | `db:5432`, not the published `15432` |
| Docker DNS server | `127.0.0.11` |
| Host from a container | `host.docker.internal` (+ `--add-host=…:host-gateway` on Linux) |

## Self-Check

- Rewrite `COPY . .` + `RUN mvn package` for caching.
- Why does shell-form `ENTRYPOINT` break graceful shutdown?
- `db` is `-p 15432:5432`. Which port does the app container use?
