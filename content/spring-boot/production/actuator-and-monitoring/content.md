# Actuator, Health Checks, Metrics and Monitoring

**Module:** Production Spring Boot · **Interview priority:** Frequently asked

## Definition

**Spring Boot Actuator** (`spring-boot-starter-actuator`) adds production-ready endpoints for **observing and managing** a running application: health, metrics, info, loggers, environment, thread dumps and more. **Health checks** report whether the app and its dependencies work; **metrics** (collected with **Micrometer**) are numeric time series such as request rate, latency and JVM memory; **monitoring** stores, graphs and alerts on them (Prometheus + Grafana, Datadog, CloudWatch…).

## Why It Matters

- Load balancers and Kubernetes decide whether to route traffic or restart a pod using health endpoints.
- You cannot fix what you cannot see: latency, error rates and pool usage come from metrics.
- Interviewers ask which endpoints exist, how to secure them, liveness vs readiness, and how to add custom health indicators/metrics.

## Actuator

Common endpoints (under `/actuator`):

| Endpoint | Shows / does |
|----------|--------------|
| `health` | `UP`/`DOWN` status, with components (db, disk, redis…) |
| `info` | Build/git/application info |
| `metrics` | List of metrics; `metrics/{name}` for one |
| `prometheus` | Metrics in Prometheus format (needs `micrometer-registry-prometheus`) |
| `loggers` | View/change log levels at runtime |
| `env`, `configprops` | Effective properties (values sanitised by default) |
| `beans`, `conditions`, `mappings` | Beans, auto-configuration report, request mappings |
| `threaddump`, `heapdump` | Diagnostics |
| `shutdown` | Graceful shutdown (disabled by default) |

Exposure: over HTTP **only `health` is exposed by default**. Expose deliberately:

```properties
management.endpoints.web.exposure.include=health,info,metrics,prometheus,loggers
management.endpoint.health.show-details=when-authorized
management.endpoint.health.probes.enabled=true
management.server.port=8081            # optional: separate port, not exposed publicly
management.info.git.mode=simple
```

**Secure** sensitive endpoints (`env`, `heapdump`, `loggers` writes, `threaddump`) — they leak configuration and memory contents. Typical: `health` public, others behind an admin role or only on an internal management port.

## Health Checks

`/actuator/health` aggregates `HealthIndicator`s. Spring Boot auto-registers indicators for the database (`SELECT 1`/`isValid`), disk space, Redis, RabbitMQ, mail, etc. If any is `DOWN`, the overall status is `DOWN` (HTTP 503).

Custom indicator (Boot 4 package; in Boot 3 the type is `org.springframework.boot.actuate.health.HealthIndicator`):

```java
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
class PaymentGatewayHealthIndicator implements HealthIndicator {

    @Override
    public Health health() {
        boolean reachable = pingGateway();
        return reachable
                ? Health.up().withDetail("provider", "razorpay").build()
                : Health.down().withDetail("provider", "razorpay").withDetail("error", "timeout").build();
    }

    private boolean pingGateway() {
        return true;      // keep checks fast and cached; never block the health endpoint for seconds
    }
}
```

### Liveness vs readiness (Kubernetes)

| Probe | Question | Endpoint | Failure action |
|-------|----------|----------|----------------|
| **Liveness** | Is the process alive (not deadlocked/broken)? | `/actuator/health/liveness` | Restart the container |
| **Readiness** | Can it serve traffic right now? | `/actuator/health/readiness` | Stop routing traffic (no restart) |

Do **not** include external dependencies (database) in liveness — a database outage would restart every pod in a loop. Readiness may include them. Spring Boot manages `LivenessState`/`ReadinessState` (readiness becomes `ACCEPTING_TRAFFIC` after startup and `REFUSING_TRAFFIC` during graceful shutdown). Probes are enabled automatically on Kubernetes or with `management.endpoint.health.probes.enabled=true`.

## Metrics

Spring Boot auto-instruments with **Micrometer** (a vendor-neutral metrics facade, "SLF4J for metrics"):

| Metric | Meaning |
|--------|---------|
| `http.server.requests` | Count, total time, max per URI/method/status/exception |
| `jvm.memory.used`, `jvm.gc.pause`, `jvm.threads.live` | JVM health |
| `hikaricp.connections.active` / `.pending` | Connection pool usage and waiting threads |
| `process.cpu.usage`, `system.cpu.usage` | CPU |
| `cache.gets`, `executor.*`, `tomcat.*` | Caches, thread pools, server |

Custom business metrics:

```java
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;

@Service
class CheckoutMetrics {
    private final Counter ordersPlaced;
    private final Timer paymentTimer;

    CheckoutMetrics(MeterRegistry registry) {
        this.ordersPlaced = Counter.builder("shop.orders.placed").tag("channel", "web").register(registry);
        this.paymentTimer = Timer.builder("shop.payment.duration").publishPercentiles(0.95, 0.99).register(registry);
    }

    void orderPlaced() {
        ordersPlaced.increment();
    }

    void timePayment(Runnable payment) {
        paymentTimer.record(payment);
    }
}
```

Avoid high-cardinality tags (user ids, order ids) — each unique tag value creates a separate time series. `@Timed`/`@Observed` annotations are alternatives.

## Monitoring

```text
Spring Boot app ──/actuator/prometheus──► Prometheus (scrapes every 15 s) ──► Grafana dashboards
       │                                         └──► Alertmanager → Slack / PagerDuty
       ├── logs (JSON, stdout) ──► Loki / ELK
       └── traces (Micrometer Tracing → OpenTelemetry) ──► Tempo / Zipkin / Jaeger
```

The "golden signals" to watch: **latency**, **traffic**, **errors**, **saturation** (CPU, memory, pool usage). Alert on symptoms users feel (error rate, p99 latency), not only on causes.

## Common Mistakes

- Exposing all endpoints (`exposure.include=*`) publicly — `env`/`heapdump` leak secrets.
- Database checks in liveness probes → restart storms during DB incidents.
- Slow custom health checks calling external services synchronously on every probe.
- High-cardinality metric tags exploding the metrics backend.
- Treating "health is UP" as proof that the business function works.

## Common Interview Traps

- **"Actuator exposes everything by default."** Only `health` over HTTP; everything else must be exposed explicitly.
- **"Liveness and readiness are the same."** Liveness failure restarts; readiness failure only removes traffic.
- **"Micrometer is a monitoring system."** It is an instrumentation facade; Prometheus/Datadog store and query the data.

## Key Takeaways

- Actuator = health, metrics, info, loggers and diagnostics endpoints; expose selectively and secure them.
- Health indicators aggregate to UP/DOWN; separate liveness (restart) from readiness (traffic).
- Micrometer instruments HTTP, JVM, pools and custom metrics; Prometheus + Grafana (or similar) monitor and alert.
