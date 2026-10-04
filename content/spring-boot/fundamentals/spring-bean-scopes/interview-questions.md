# Bean Scopes — Interview Questions

## Beginner

### Q1. What bean scopes does Spring support?

<details>
<summary>Answer</summary>

`singleton` (default, one instance per container), `prototype` (new instance per lookup), and in web applications `request` (per HTTP request), `session` (per HTTP session), `application` (per `ServletContext`) and `websocket` (per WebSocket session). Custom scopes can also be registered.

</details>

### Q2. What is the default scope and why?

<details>
<summary>Answer</summary>

Singleton. Most beans — services, repositories, controllers — are stateless, so one shared instance is efficient: no repeated construction, less garbage, and dependencies are wired once at startup.

</details>

### Q3. What is the difference between singleton and prototype scope?

<details>
<summary>Answer</summary>

A singleton bean is created once per container and shared by all injection points; Spring manages its full lifecycle including destruction. A prototype bean is created anew for every injection or `getBean` call; Spring initialises it but does not track or destroy it.

</details>

## Intermediate

### Q4. Are singleton beans thread-safe?

<details>
<summary>Answer</summary>

Not automatically. One instance serves all concurrent requests, so mutable instance fields are shared between threads. Singletons are safe when they are stateless (only final references to other stateless beans) or when their state is thread-safe (`ConcurrentHashMap`, atomics). Per-request data belongs in method parameters/local variables or a request-scoped bean.

</details>

### Q5. What happens when you inject a prototype bean into a singleton?

<details>
<summary>Answer</summary>

The prototype is resolved once, when the singleton is created, so the singleton always uses that same instance — the prototype behaves like a singleton for that consumer. To get a new instance per use, inject `ObjectProvider<T>` and call `getObject()`, use `@Lookup` method injection, or (rarely) a scoped proxy.

</details>

### Q6. Why do request- and session-scoped beans need a scoped proxy when injected into singletons?

<details>
<summary>Answer</summary>

Singletons are created at startup, when no request or session exists, and the injection happens only once. A scoped proxy is injected instead; each method call on it resolves the actual instance belonging to the current thread's request or session. Without the proxy, startup fails with "Scope 'request' is not active for the current thread".

</details>

## Advanced

### Q7. A request-scoped bean is used inside an `@Async` method. What happens?

<details>
<summary>Answer</summary>

It fails with `IllegalStateException` ("No thread-bound request found"). Request attributes are stored in a `ThreadLocal` (`RequestContextHolder`) bound to the servlet thread; the async executor thread has none. Copy the needed values (correlation id, user id) into method parameters before going async, or use a task decorator that propagates context deliberately.

</details>

### Q8. What does a scoped proxy on a prototype bean do?

<details>
<summary>Answer</summary>

`@Scope(value = "prototype", proxyMode = ScopedProxyMode.TARGET_CLASS)` injects a proxy that fetches a **new** target for **every method call**. Two consecutive calls (`builder.add(x); builder.build();`) hit two different objects, losing state. It is almost never what you want; `ObjectProvider` gives explicit control.

</details>

### Q9. Is the `application` scope the same as singleton?

<details>
<summary>Answer</summary>

Similar but not identical. An application-scoped bean is one per `ServletContext` and is exposed as a `ServletContext` attribute; a singleton is one per `ApplicationContext`. They differ when several application contexts share a `ServletContext` (for example multiple `DispatcherServlet`s), where an application-scoped bean is shared across them.

</details>
