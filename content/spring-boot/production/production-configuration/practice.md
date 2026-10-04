# Production Configuration, Secrets and Graceful Shutdown — Practice

### P1. Where do secrets go?

**Difficulty:** Easy · **Type:** MCQ

Where should the production database password live?

- A) `application-prod.yml` in the Git repository
- B) Hard-coded in a `@Configuration` class
- C) A secret manager or platform secret injected at runtime
- D) The Docker image

<details>
<summary>Answer</summary>

**Answer:** C) A secret manager or platform secret injected at runtime

</details>

### P2. 502s during deployment

**Difficulty:** Medium · **Type:** Debugging

During every rolling deployment, a few requests fail with 502. The app uses Boot 3.2 with default settings on Kubernetes. What would you check?

<details>
<summary>Answer</summary>

Boot 3.2 defaults to `server.shutdown=immediate` — set `graceful`. Ensure `terminationGracePeriodSeconds` exceeds `spring.lifecycle.timeout-per-shutdown-phase`, add a short `preStop` sleep so the pod is removed from endpoints before shutdown begins, use readiness probes (`/actuator/health/readiness`), and make sure new pods are ready (probes) before old ones stop.

</details>

### P3. Review this config

**Difficulty:** Medium · **Type:** Code analysis

`application-prod.yml` contains `spring.jpa.hibernate.ddl-auto: update`, `spring.jpa.show-sql: true`, `management.endpoints.web.exposure.include: "*"`, `logging.level.root: DEBUG`. Fix it.

<details>
<summary>Answer</summary>

`ddl-auto: validate` with migrations; remove `show-sql` (use logger levels when needed); expose only `health,info,prometheus` and secure them; root level INFO with targeted DEBUG enabled temporarily through Actuator if required.

</details>
