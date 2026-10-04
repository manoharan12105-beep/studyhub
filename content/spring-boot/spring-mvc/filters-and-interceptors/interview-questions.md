# Filters and Interceptors — Interview Questions

## Beginner

### Q1. What is the difference between a filter and an interceptor?

<details>
<summary>Answer</summary>

A filter is a Servlet API component that runs in the servlet container around the whole `DispatcherServlet`, for every request. An interceptor is a Spring MVC component that runs inside the `DispatcherServlet` around a specific handler, with access to the selected controller method. Filters suit generic HTTP concerns (security, CORS, logging, compression); interceptors suit handler-aware concerns.

</details>

### Q2. What are the three methods of `HandlerInterceptor`?

<details>
<summary>Answer</summary>

`preHandle` (before the handler; returning `false` stops processing), `postHandle` (after the handler returns successfully, before view rendering) and `afterCompletion` (after the request completes, always — including after exceptions — for cleanup).

</details>

### Q3. What is `OncePerRequestFilter`?

<details>
<summary>Answer</summary>

A Spring base class for filters that guarantees a single execution per request, even if the request is dispatched again (forward, include, error dispatch, async re-dispatch). You implement `doFilterInternal`. JWT authentication filters typically extend it.

</details>

## Intermediate

### Q4. How do you register a filter in Spring Boot, and how do you control its order?

<details>
<summary>Answer</summary>

Declaring a `Filter` bean registers it automatically for all URLs; order it with `@Order` or `Ordered`. For URL patterns, names, dispatcher types or explicit order, register a `FilterRegistrationBean<MyFilter>` and set `addUrlPatterns`, `setOrder` etc. Filters that belong to Spring Security should instead be added to the `SecurityFilterChain` with `addFilterBefore/After`.

</details>

### Q5. When would you choose an interceptor over a filter?

<details>
<summary>Answer</summary>

When the logic needs the handler: for example checking a custom annotation on the controller method (`@RequiresFeature("beta")`), recording metrics per controller method, or applying logic only to mapped endpoints rather than static resources and error dispatches.

</details>

### Q6. A custom JWT filter runs twice per request. Why?

<details>
<summary>Answer</summary>

It is a `@Component` (so Boot registers it as a servlet filter for all URLs) and it is also added to the Spring Security chain with `addFilterBefore`. Remove `@Component` and create it in the security configuration, or keep it a bean and disable the automatic registration with a `FilterRegistrationBean` whose `enabled` is `false`. Extending `OncePerRequestFilter` only hides the symptom within one dispatch.

</details>

## Advanced

### Q7. Why can't an interceptor be used to implement authentication with Spring Security?

<details>
<summary>Answer</summary>

Spring Security's authorization decisions for URLs happen in its filter chain before the `DispatcherServlet`; an interceptor runs later, so an unauthenticated request would already have been rejected (or allowed) by then, and the `SecurityContext` must be populated before `AuthorizationFilter` runs. Authentication mechanisms therefore plug into the security filter chain.

</details>

### Q8. How would you log request and response bodies safely?

<details>
<summary>Answer</summary>

In a filter, wrap the request and response with `ContentCachingRequestWrapper` and `ContentCachingResponseWrapper`, call the chain with the wrappers, log the cached content afterwards (with a size limit and masking of sensitive fields such as passwords and tokens), and call `copyBodyToResponse()` on the response wrapper so the client still receives the body. Restrict it to non-production or sampled traffic because of cost and privacy.

</details>

### Q9. Are exceptions thrown in `preHandle` handled by `@ControllerAdvice`?

<details>
<summary>Answer</summary>

Yes. `preHandle` runs inside `DispatcherServlet.doDispatch`, so its exceptions reach the `HandlerExceptionResolver`s, including `@ExceptionHandler` methods in `@ControllerAdvice`. Exceptions in servlet filters do not.

</details>
