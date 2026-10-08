# Production Preparation — Practice

### P1. Schema setting

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** ddl-auto

With Flyway managing the schema, which `ddl-auto` value fits production?

- A) `create-drop`
- B) `update`
- C) `validate`
- D) `create`

<details>
<summary>Answer</summary>

**Answer:** C) `validate`

</details>

### P2. Minimal exposure

**Difficulty:** Easy · **Type:** Configuration · **Concepts:** Actuator

Write the property (YAML) that exposes only the `health` and `info` Actuator endpoints over HTTP.

<details>
<summary>Answer</summary>

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info
```

</details>

### P3. Where do logs go?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** logging in containers

Where should a containerised Spring Boot service write its application logs?

- A) A file in `/tmp`
- B) stdout/stderr
- C) The database
- D) Nowhere in production

<details>
<summary>Answer</summary>

**Answer:** B) stdout/stderr

</details>

### P4. Read the preflight

**Difficulty:** Medium · **Type:** Output · **Concepts:** CORS

The API allows only `https://app.example.com`. A page on `https://shop.example.com` sends a preflight `OPTIONS` for a `POST`. What status does the Task API's CORS configuration return, and what does the browser do?

<details>
<summary>Answer</summary>

`403` with `Invalid CORS request` and no `Access-Control-Allow-Origin` header. The browser blocks the `POST` and the page's script sees a CORS error.

</details>

### P5. Heap for the limit

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** JVM memory

The container limit is 1 GB. Write the `ENTRYPOINT` that lets the heap use 75 % of it.

<details>
<summary>Answer</summary>

```dockerfile
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
```

</details>

### P6. Long requests at shutdown

**Difficulty:** Medium · **Type:** Compose · **Concepts:** graceful shutdown

Some report requests take up to 25 seconds. Which Compose setting prevents Docker from killing the container before they finish during a deployment, and what value?

<details>
<summary>Answer</summary>

`stop_grace_period: 40s` on the app service — longer than Spring's 30-second shutdown phase (`spring.lifecycle.timeout-per-shutdown-phase`), which itself covers the 25-second requests. Docker's default is 10 seconds, which would kill the JVM mid-request.

</details>

### P7. Wrong scheme in redirects

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** forwarded headers

Behind Nginx with HTTPS, the app's redirects point to `http://api.example.com/...`. Which Spring Boot property fixes it, and what must Nginx send?

<details>
<summary>Answer</summary>

`server.forward-headers-strategy: native` (or `framework`), and Nginx must send `proxy_set_header X-Forwarded-Proto $scheme;` (plus `X-Forwarded-For` and `Host`).

</details>

### P8. Review the config

**Difficulty:** Hard · **Type:** Configuration · **Concepts:** production review

Find the production problems:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update
  datasource:
    password: admin123
server:
  error:
    include-stacktrace: always
management:
  endpoints:
    web:
      exposure:
        include: "*"
```

<details>
<summary>Answer</summary>

`ddl-auto: update` (use migrations + `validate`); a committed password (use `${SPRING_DATASOURCE_PASSWORD}`); stack traces in error responses (`never`); every Actuator endpoint exposed (only `health,info`).

</details>

### P9. Is it ready?

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** health verification

After `docker compose up -d`, list four checks — with commands — that prove the new version is really live and healthy.

<details>
<summary>Answer</summary>

`docker compose ps` (both services `Up (healthy)`); `curl -fsS http://127.0.0.1:8080/actuator/health/readiness`; `curl -s http://127.0.0.1:8080/api/info` (expected image tag and `prod` profile); `curl -fsS https://api.example.com/actuator/health` (through Nginx/HTTPS); `docker compose logs --since 5m app | grep ERROR` (no new errors).

</details>
