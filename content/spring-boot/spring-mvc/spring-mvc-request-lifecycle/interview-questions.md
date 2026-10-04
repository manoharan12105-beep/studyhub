# Request Lifecycle: DispatcherServlet to Response — Interview Questions

## Beginner

### Q1. What happens when a request reaches a Spring Boot REST endpoint?

<details>
<summary>Answer</summary>

Tomcat accepts it and runs the servlet filter chain (including Spring Security). The `DispatcherServlet` asks its `HandlerMapping`s for the matching controller method, runs interceptors' `preHandle`, and the `HandlerAdapter` resolves the method arguments (path variables, query params, JSON body via Jackson, validation), invokes the controller, which calls the service and repository. The return value is serialised by an `HttpMessageConverter`, interceptors' `postHandle`/`afterCompletion` run, filters unwind, and the response is sent.

</details>

### Q2. What is a `HandlerMapping`?

<details>
<summary>Answer</summary>

The component that determines which handler processes a request. `RequestMappingHandlerMapping` indexes all `@RequestMapping` methods at startup and matches each request by path, HTTP method, consumed/produced media types, headers and parameters, returning the handler method together with applicable interceptors.

</details>

### Q3. What is a `HandlerAdapter`?

<details>
<summary>Answer</summary>

An adapter that knows how to invoke a particular kind of handler. The `DispatcherServlet` stays generic; for annotated controller methods, `RequestMappingHandlerAdapter` resolves arguments, invokes the method and processes its return value.

</details>

## Intermediate

### Q4. Where in the lifecycle does `@Valid` validation run, and what happens on failure?

<details>
<summary>Answer</summary>

During argument resolution, after the body has been converted from JSON and before the controller method executes. On failure for `@RequestBody`, `MethodArgumentNotValidException` is thrown and resolved to 400 Bad Request (or handled by your `@RestControllerAdvice`). The controller code never runs.

</details>

### Q5. How does Spring decide the response format?

<details>
<summary>Answer</summary>

Content negotiation: it compares the media types acceptable to the client (`Accept` header) with those the handler can produce (`produces` attribute and registered `HttpMessageConverter`s that can write the return type) and picks the best match — typically `application/json` via Jackson. If no match is possible, the result is 406 Not Acceptable.

</details>

### Q6. What is a `HandlerMethodArgumentResolver` and when would you write one?

<details>
<summary>Answer</summary>

A strategy that produces a controller method argument from the request. Spring ships resolvers for `@PathVariable`, `@RequestBody`, `Pageable` and others. Write one to inject request-derived objects consistently, such as a `ClientInfo` built from headers or a `CurrentTenant`, instead of repeating header parsing in every controller. Register it with `WebMvcConfigurer.addArgumentResolvers`.

</details>

### Q7. Which HTTP status codes are produced before your controller runs, and by which component?

<details>
<summary>Answer</summary>

401/403 by Spring Security filters; 404 and 405 by handler mapping (no path match / method not supported); 415 when the request `Content-Type` is not supported; 400 when the body cannot be parsed, a parameter cannot be converted, or validation fails during argument resolution; 406 during response conversion when the `Accept` header cannot be satisfied.

</details>

## Advanced

### Q8. Why can a JWT filter's exception not be handled by `@RestControllerAdvice`?

<details>
<summary>Answer</summary>

Filters run in the servlet container's filter chain, before the `DispatcherServlet`. `@ControllerAdvice` methods are invoked by the `DispatcherServlet`'s `HandlerExceptionResolver`s, which only see exceptions thrown while dispatching to a handler. Exceptions in filters must be handled in the filter (write the response), by Spring Security's `AuthenticationEntryPoint`/`AccessDeniedHandler`, or by delegating explicitly to a `HandlerExceptionResolver` from the filter.

</details>

### Q9. Why does request context such as the authenticated user disappear inside an `@Async` method?

<details>
<summary>Answer</summary>

Spring MVC processes a request on one thread, and contexts like `SecurityContextHolder`, `RequestContextHolder`, MDC and transaction resources are stored in `ThreadLocal`s on that thread. An `@Async` method runs on an executor thread that has none of them. Propagate deliberately — for example with `DelegatingSecurityContextAsyncTaskExecutor`, a `TaskDecorator` copying MDC, or by passing the needed values as parameters.

</details>

### Q10. Can `postHandle` modify the JSON body returned by a `@RestController`?

<details>
<summary>Answer</summary>

No. For `@ResponseBody` return values, the body is written by the return value handler before `postHandle` is called, and the response may already be committed. Use `ResponseBodyAdvice` (called just before the body is written) or a filter with a response wrapper instead.

</details>
