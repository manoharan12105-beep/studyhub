# Bean Scopes

**Module:** Spring Framework Fundamentals · **Interview priority:** Core

## Definition

A bean's **scope** decides how many instances the container creates and how long each lives. Spring has six built-in scopes: **singleton** (default) and **prototype** in every application, plus four web-aware scopes — **request**, **session**, **application** and **websocket** — available only in a web application context.

## Why It Matters

- Scope decides whether state stored in a bean is shared between users and threads — a direct source of concurrency bugs.
- "Prototype bean inside a singleton" is a classic interview trap with three standard solutions.
- Request and session scopes explain how per-user data can be modelled without passing it through every method.

## singleton

**One instance per bean definition per container**, created at startup (unless lazy) and shared by every injection point and every thread.

- Default for all beans; ideal for **stateless** services, repositories and controllers.
- Not the Gang-of-Four Singleton: two bean definitions of the same class produce two instances, and two containers produce two each.
- Because it is shared across concurrent requests, **mutable instance fields are not thread-safe**. Keep singletons stateless, or use thread-safe structures.

## prototype

**A new instance every time the bean is requested** — each injection point and each `getBean` call.

- The container runs initialisation callbacks but **never destruction callbacks**; the caller owns the instance.
- Use for stateful, short-lived helpers (a builder, a non-thread-safe parser).

```java
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

@Component
@Scope("prototype")                     // or ConfigurableBeanFactory.SCOPE_PROTOTYPE
public class CsvReportBuilder {
}
```

## request

One instance **per HTTP request**; destroyed when the request completes. Example: a `RequestContext` holding the correlation id and the current tenant.

## session

One instance **per HTTP session**; destroyed when the session expires or is invalidated. Example: a shopping cart in a server-rendered, session-based application. In stateless REST APIs with JWT there is no HTTP session, so session scope is rarely used.

## application

One instance **per `ServletContext`** — similar to singleton, but scoped to the web application and exposed as a `ServletContext` attribute. It differs from singleton only when several Spring contexts share one `ServletContext`.

## websocket

One instance **per WebSocket session** (STOMP over WebSocket messaging). Awareness level: used for per-connection state in real-time applications.

### Declaring web scopes

```java
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

@Component
@RequestScope                           // = @Scope(value = "request", proxyMode = ScopedProxyMode.TARGET_CLASS)
public class RequestContext {
    private String correlationId;

    public String getCorrelationId() {
        return correlationId;
    }

    public void setCorrelationId(String correlationId) {
        this.correlationId = correlationId;
    }
}

@Component
@Scope(value = "session", proxyMode = ScopedProxyMode.TARGET_CLASS)   // same as @SessionScope
class ShoppingCart {
}
```

The **scoped proxy** matters: singletons are created at startup, when no request exists. Spring injects a proxy into the singleton; each method call on the proxy looks up the real instance for the **current** request or session.

## How It Works

Injecting a shorter-lived bean into a longer-lived one is the classic problem. A prototype injected into a singleton is resolved **once**, when the singleton is created — so the singleton keeps the same "prototype" forever.

```java
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;

public class ScopeDemo {

    static final AtomicInteger CREATED = new AtomicInteger();

    static class ReportBuilder {
        final int id = CREATED.incrementAndGet();
    }

    static class ReportServiceDirect {
        private final ReportBuilder builder;          // injected once

        ReportServiceDirect(ReportBuilder builder) {
            this.builder = builder;
        }

        int build() {
            return builder.id;
        }
    }

    static class ReportServiceWithProvider {
        private final ObjectProvider<ReportBuilder> builders;

        ReportServiceWithProvider(ObjectProvider<ReportBuilder> builders) {
            this.builders = builders;
        }

        int build() {
            return builders.getObject().id;           // asks the container each time
        }
    }

    @Configuration
    static class AppConfig {
        @Bean
        @Scope("prototype")
        ReportBuilder reportBuilder() {
            return new ReportBuilder();
        }

        @Bean
        ReportServiceDirect direct(ReportBuilder builder) {
            return new ReportServiceDirect(builder);
        }

        @Bean
        ReportServiceWithProvider withProvider(ObjectProvider<ReportBuilder> builders) {
            return new ReportServiceWithProvider(builders);
        }
    }

    public static void main(String[] args) {
        try (AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class)) {
            ReportServiceDirect direct = context.getBean(ReportServiceDirect.class);
            ReportServiceWithProvider withProvider = context.getBean(ReportServiceWithProvider.class);

            System.out.println("singleton same instance: "
                    + (context.getBean(ReportServiceDirect.class) == direct));
            System.out.println("direct injection: " + direct.build() + ", " + direct.build());
            System.out.println("ObjectProvider:   " + withProvider.build() + ", " + withProvider.build());
        }
    }
}
```

**Output:**

```text
singleton same instance: true
direct injection: 1, 1
ObjectProvider:   2, 3
```

Three standard solutions for a fresh prototype per use:

| Solution | How | Notes |
|----------|-----|-------|
| `ObjectProvider<T>` | `provider.getObject()` each time | Preferred; also supports optional/lazy beans (`getIfAvailable`) |
| Lookup method injection | `@Lookup` on an abstract or stub method; Spring overrides it with CGLIB | Works, but CGLIB-based and less obvious |
| Scoped proxy | `@Scope(value = "prototype", proxyMode = TARGET_CLASS)` | **Every method call** on the proxy creates a new instance — usually not what you want for prototypes |

## Internal Behavior

- Singletons live in the container's singleton cache; prototypes are not cached at all.
- Request and session beans are stored as attributes of the current request/session through `RequestScope`/`SessionScope` implementations of the `Scope` interface, using the thread-bound `RequestContextHolder`. Accessing a request-scoped bean outside a request (for example in an `@Async` thread or a scheduled job) throws `IllegalStateException: No thread-bound request found`.
- Custom scopes can be registered by implementing `org.springframework.beans.factory.config.Scope`.

## Comparison

| Scope | Instances | Lifetime | Destroy callbacks | Needs web context |
|-------|-----------|----------|-------------------|-------------------|
| singleton | 1 per container | Container | Yes | No |
| prototype | 1 per request for the bean | Caller | **No** | No |
| request | 1 per HTTP request | Request | Yes | Yes |
| session | 1 per HTTP session | Session | Yes | Yes |
| application | 1 per `ServletContext` | Web application | Yes | Yes |
| websocket | 1 per WebSocket session | WebSocket session | Yes | Yes |

## Common Mistakes

- Storing per-user data (current user, cart) in an instance field of a singleton service — users see each other's data under load.
- Injecting a prototype into a singleton and expecting a new instance per call.
- Using a request-scoped bean from `@Async` methods or scheduled jobs (no request bound to that thread).
- Forgetting the scoped proxy when injecting session/request beans into singletons (startup fails: scope not active).

## Common Interview Traps

- **"Spring singleton is thread-safe."** Spring does nothing to make it thread-safe; it is safe only if it is stateless or synchronised.
- **"Prototype means one instance per thread."** It means one instance per request *to the container* (injection or `getBean`).
- **"Singleton scope = Singleton pattern."** One per container per definition, not one per JVM/class loader.

## Key Takeaways

- Default scope is singleton: keep such beans stateless.
- Prototype: new per lookup, no destroy callbacks.
- Web scopes: request, session, application, websocket — inject them into singletons through a scoped proxy.
- Need a fresh prototype per use from a singleton? Use `ObjectProvider<T>`.
