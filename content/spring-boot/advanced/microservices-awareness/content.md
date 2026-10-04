# Microservices Awareness for Spring Boot Developers

**Module:** Advanced Spring · **Interview priority:** Awareness

> [!NOTE]
> **Awareness topic.** This is not a microservices course. It covers what a Spring Boot developer is expected to explain in interviews: when microservices make sense and the supporting patterns (discovery, gateway, configuration, tracing) with their Spring Cloud tools.

## Definition

A **microservices architecture** builds an application as a set of small, independently deployable services, each owning one business capability and **its own data**, communicating over the network (HTTP/gRPC or messaging). A **monolith** is a single deployable unit containing all capabilities (which can still be well modularised internally — a "modular monolith").

## Why It Matters

- Interviewers often ask "monolith vs microservices?" and expect trade-offs, not hype.
- Spring Boot is the most common way to build Java microservices, and Spring Cloud provides the surrounding patterns.

## Microservices Awareness

### Monolith vs Microservices

| Aspect | Monolith | Microservices |
|--------|----------|---------------|
| Deployment | One unit | Each service independently |
| Scaling | Whole app | Per service |
| Data | One database (transactions are easy) | Database per service (no cross-service ACID transactions) |
| Communication | In-process method calls | Network calls — latency, partial failure |
| Team structure | Works well for one or a few teams | Teams own services end to end |
| Operational complexity | Low | High: discovery, tracing, monitoring, CI/CD per service |
| Consistency | Strong, simple | Eventual; sagas, outbox, idempotency |
| Debugging | Single process, stack traces | Distributed tracing needed |
| Good starting point? | **Yes, for most new products** (modular monolith) | When scale, team size and domain boundaries justify it |

### Principles

- Service per **bounded context** (orders, payments, catalogue), owning its data.
- Communicate via **APIs** (REST with `RestClient`/HTTP interface clients, gRPC) and **events** (Kafka, RabbitMQ).
- Design for failure: timeouts, retries, circuit breakers (see [Resilience](../resilience-patterns/content.md)).
- Distributed transactions are avoided; consistency via **sagas** (sequence of local transactions with compensations) and the **transactional outbox**.

## Service Discovery Awareness

Service instances come and go (autoscaling, deployments), so their addresses change. **Service discovery** lets clients find healthy instances by name:

- **Client-side:** a registry such as **Netflix Eureka** (Spring Cloud Netflix) or Consul; clients query it and load-balance (Spring Cloud LoadBalancer).
- **Platform/server-side:** **Kubernetes Services/DNS** (`http://payment-service:8080`) — the common choice today, making Eureka unnecessary on Kubernetes.

## API Gateway Awareness

A single entry point in front of services: routing (`/api/orders/**` → order-service), authentication/token validation, rate limiting, CORS, request aggregation, TLS termination, canary routing. Tools: **Spring Cloud Gateway**, Kong, NGINX, cloud API gateways. Keep business logic out of the gateway.

```text
client ─► API Gateway ─┬─► order-service   ─► orders DB
                       ├─► catalog-service ─► catalog DB
                       └─► payment-service ─► payments DB
```

## Config Server Awareness

**Spring Cloud Config Server** serves configuration for many services from a Git repository (or Vault), with per-application and per-profile files; clients import it via `spring.config.import=configserver:http://config:8888`, and values can be refreshed at runtime. On Kubernetes, ConfigMaps/Secrets (plus a secret manager) often replace it.

## Distributed Tracing Awareness

One user request may cross the gateway and several services. **Distributed tracing** follows it:

- A **trace id** identifies the whole request; each hop is a **span** with its own span id, timing and tags.
- Context is propagated in headers (W3C `traceparent`).
- Spring Boot 3+/4: **Micrometer Tracing** with an OpenTelemetry (or Brave) bridge; traces exported to Zipkin, Jaeger, Grafana Tempo or an APM; trace ids appear automatically in logs (MDC), connecting logs, metrics and traces.

```text
traceId=4bf92f… gateway(12 ms) → order-service(180 ms) → payment-service(150 ms, slow!) → bank API(140 ms)
```

## Spring Cloud Overview

| Need | Spring Cloud project (or common alternative) |
|------|---------------------------------------------|
| Gateway | Spring Cloud Gateway |
| Discovery | Spring Cloud Netflix Eureka, Consul (or Kubernetes) |
| Configuration | Spring Cloud Config (or ConfigMaps/Vault) |
| Client load balancing | Spring Cloud LoadBalancer |
| Declarative HTTP clients | Spring's HTTP interface clients (`@HttpExchange`), OpenFeign |
| Circuit breaker | Spring Cloud CircuitBreaker + Resilience4j |
| Messaging | Spring Cloud Stream (Kafka, RabbitMQ) |
| Tracing | Micrometer Tracing (part of Spring Boot) |

## Common Mistakes

- Starting with microservices for a small team/product ("distributed monolith": services that must be deployed together and share a database).
- Shared databases between services.
- Synchronous call chains of many services (latency and failure multiply).
- No idempotency, tracing, or timeouts.

## Common Interview Traps

- **"Microservices are always better."** They trade code complexity for operational and consistency complexity.
- **"Spring Boot = microservices."** Boot builds any service; Spring Cloud adds distributed-system patterns.
- **"Use distributed (XA) transactions across services."** Prefer local transactions with sagas and outbox.

## Key Takeaways

- Start with a modular monolith; split into services along business boundaries when scale and teams require it.
- Supporting patterns: discovery (Eureka/Kubernetes DNS), API gateway (Spring Cloud Gateway), centralised config (Config Server/ConfigMaps), distributed tracing (Micrometer + OpenTelemetry), resilience patterns.
- Each service owns its data; consistency through events, sagas and the outbox pattern.
