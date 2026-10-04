# Spring MVC and the Layered Architecture — Interview Questions

## Beginner

### Q1. What is Spring MVC?

<details>
<summary>Answer</summary>

Spring Framework's servlet-based web framework. A single `DispatcherServlet` receives all requests and delegates to controller methods selected by request mappings; it binds request data to method arguments, invokes the method and converts the result into a response (JSON for REST, a rendered view for server-side pages).

</details>

### Q2. What is the `DispatcherServlet`?

<details>
<summary>Answer</summary>

The front controller of Spring MVC: one servlet mapped to `/` that receives every request, finds the handler through `HandlerMapping`s, invokes it through a `HandlerAdapter`, applies interceptors, resolves exceptions through `HandlerExceptionResolver`s and writes the response. Spring Boot registers it automatically.

</details>

### Q3. What are the responsibilities of the controller, service and repository layers?

<details>
<summary>Answer</summary>

The controller translates HTTP: it maps URLs, binds and validates input, calls a service and chooses status codes. The service contains business logic, coordinates repositories and defines transaction boundaries. The repository performs data access. Each layer depends only on the one below it.

</details>

## Intermediate

### Q4. Why is the front controller pattern used?

<details>
<summary>Answer</summary>

It centralises cross-cutting request handling — routing, content negotiation, exception handling, interceptors, locale and multipart resolution — in one place, so controllers stay simple and consistent. Adding a feature (for example a global exception handler) affects every endpoint without touching each controller.

</details>

### Q5. Why should `@Transactional` be on the service layer, not the controller?

<details>
<summary>Answer</summary>

A transaction should cover one business use case, which the service method represents; the controller deals with HTTP and should not hold database connections while serialising responses or doing web work. Putting transactions on services also lets other entry points (schedulers, message listeners) reuse the same transactional behaviour.

</details>

### Q6. What is the difference between Spring MVC and Spring WebFlux?

<details>
<summary>Answer</summary>

Spring MVC is built on the Servlet API with a blocking, thread-per-request model; WebFlux is non-blocking and reactive (Reactor `Mono`/`Flux`), running on Netty or servlet containers in async mode. MVC is simpler and fits JDBC/JPA; WebFlux suits high-concurrency streaming and fully non-blocking stacks. With Java 21 virtual threads, MVC handles high concurrency of blocking calls well, which narrows WebFlux's advantage for typical CRUD services.

</details>

## Advanced

### Q7. Which components does the `DispatcherServlet` delegate to?

<details>
<summary>Answer</summary>

`HandlerMapping` (find the handler and its interceptors), `HandlerAdapter` (invoke it — `RequestMappingHandlerAdapter` uses argument resolvers, return value handlers and message converters), `HandlerExceptionResolver`s (map exceptions to responses), `ViewResolver`s (for view names), plus `LocaleResolver` and `MultipartResolver`. It discovers these as beans in the context, falling back to defaults.

</details>

### Q8. Package by layer or by feature — which do you prefer for a growing service?

<details>
<summary>Answer</summary>

By feature for anything beyond a small application: each feature package (`order`, `catalog`, `payment`) contains its controller, service, repository and DTOs, so changes stay local, package-private visibility can hide internals, and features can later be extracted as modules or services. Package-by-layer spreads one feature across many folders and encourages everything being public.

</details>
