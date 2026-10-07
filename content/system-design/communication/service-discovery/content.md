# Service Discovery

**Module:** Communication and APIs · **Interview priority:** Awareness

> [!NOTE]
> **Awareness topic.** Service discovery matters once a system has many services whose instances come and go. Learn [Monolith vs Microservices](../../foundations/monolith-vs-microservices/content.md) and [Load Balancing](../../scaling-and-distribution/load-balancing-fundamentals/content.md) first.

## What Is It?

**Service discovery** is how one service finds the current network addresses of healthy instances of another service. In a cloud or container platform, instances are created, moved and destroyed constantly by autoscaling and deployments, so hard-coded IP addresses stop working within hours.

## Why It Exists

The order service needs to call the payment service. Yesterday payment ran on three instances at fixed addresses; today autoscaling runs seven, two were replaced after failing health checks, and a deployment is rolling out new ones. Something must keep an up-to-date list and hand it to callers.

## How It Works

### The service registry

A **registry** holds the live list of instances per service name:

```text
payment-service → 10.0.3.14:8080 (healthy), 10.0.3.22:8080 (healthy), 10.0.4.9:8080 (failing → removed)
```

Instances **register** themselves on startup (or are registered by the platform), send **heartbeats** or are **health-checked**, and are removed when they stop or fail. Registries must be highly available and consistent enough, so they are typically built on consensus systems (etcd, ZooKeeper, Consul) — see [Leader Election](../../consistency-and-coordination/distributed-locks-and-leader-election/content.md).

### Two discovery patterns

| | Client-side discovery | Server-side discovery |
|---|-----------------------|-----------------------|
| How | The caller queries the registry and picks an instance itself (client-side load balancing) | The caller sends to a stable address (load balancer, proxy); it consults the registry |
| Pros | No extra hop; smart client balancing | Callers stay simple and language-agnostic |
| Cons | Discovery logic in every client library | Extra hop; the balancer must be highly available |
| Examples | Eureka with client libraries, gRPC client-side balancing | Kubernetes Services, cloud internal load balancers |

### DNS-based discovery

Kubernetes gives each service a stable DNS name (`payment.prod.svc.cluster.local`) and a virtual IP; the platform keeps the backing instance list current. It is simple for callers, but DNS caching can delay updates, which is why the platform's proxying layer, not DNS TTLs alone, handles instance churn.

### Service mesh (awareness)

A **service mesh** (Istio, Linkerd) puts a small proxy (a "sidecar") next to every service instance. The proxies handle discovery, load balancing, retries, timeouts, mutual TLS and telemetry, configured centrally, so application code does not have to.

**Think about it:** an instance crashes without deregistering. How does the registry find out, and what happens to requests in the meantime?

<details>
<summary>Answer</summary>

Through missed heartbeats or failed health checks: after a configured number of misses (for example 3 × 10 s), the registry removes the instance. Until then, some requests go to the dead instance and fail, so callers need timeouts and retries to another instance, and passive health checking (marking instances that return errors) shortens the window.

</details>

## When Not to Use

A handful of services behind a load balancer with fixed DNS names do not need a registry; managed platforms (Kubernetes, cloud load balancers) already provide discovery. Building your own registry is rarely justified.

## Common Traps

> [!WARNING]
> **Common trap:** "The registry is just configuration." It is on the critical path of every call: if it is down or stale, services cannot find each other. Clients should cache the last known list and keep working when the registry is briefly unavailable.

## Interview Follow-up

- *"How do microservices find each other in Kubernetes?"* Through Services: a stable DNS name and virtual IP per service, backed by the platform's continuously updated list of ready pods (readiness probes decide membership).

## Key Takeaways

- Service discovery keeps an up-to-date list of healthy instances per service name.
- Instances register and are health-checked; dead ones are removed after missed heartbeats.
- Client-side discovery puts the logic in callers; server-side discovery hides it behind a load balancer or proxy.
- Kubernetes Services and service meshes provide discovery out of the box.
