# Actuator, Health Checks, Metrics and Monitoring — Practice

### P1. Restart loop

**Difficulty:** Medium · **Type:** Debugging

During a 5-minute database outage, all pods restart repeatedly. Liveness probes point to `/actuator/health`. Why, and what is the fix?

<details>
<summary>Answer</summary>

`/actuator/health` includes the database indicator, so it turns DOWN and liveness fails, triggering restarts. Point liveness to `/actuator/health/liveness` (application state only) and readiness to `/actuator/health/readiness`, which may include the database.

</details>

### P2. Which metric?

**Difficulty:** Easy · **Type:** Conceptual

Which metric would show that requests are waiting for database connections?

<details>
<summary>Answer</summary>

`hikaricp.connections.pending` (threads waiting for a connection), together with `hikaricp.connections.active` near the maximum pool size and rising `hikaricp.connections.acquire` time.

</details>

### P3. Dangerous exposure

**Difficulty:** Medium · **Type:** Scenario

A public API sets `management.endpoints.web.exposure.include=*` without security. What can an attacker do?

<details>
<summary>Answer</summary>

Download `/actuator/heapdump` (memory may contain passwords, tokens, keys), read configuration via `/actuator/env` and `/actuator/configprops`, change log levels via `/actuator/loggers` to flood logs or expose data, view all mappings and beans for reconnaissance, and possibly shut down the app if `shutdown` is enabled.

</details>
