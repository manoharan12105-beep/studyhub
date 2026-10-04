# SecurityFilterChain, Filters and SecurityContext — Interview Questions

## Beginner

### Q1. What is the `SecurityFilterChain`?

<details>
<summary>Answer</summary>

A bean describing which requests a chain applies to (a request matcher) and the ordered list of security filters to run for them, built with `HttpSecurity`. Spring Security's `FilterChainProxy` holds all chains and executes the first one that matches the request.

</details>

### Q2. Where does Spring Security store the logged-in user during a request?

<details>
<summary>Answer</summary>

In the `SecurityContext`, held by `SecurityContextHolder`, which by default uses a `ThreadLocal`. The context contains the `Authentication` (principal, authorities). It is cleared after the request; in session-based apps it is saved to the HTTP session between requests.

</details>

### Q3. What does the `Authentication` object contain?

<details>
<summary>Answer</summary>

The principal (usually `UserDetails`), credentials (erased after authentication), granted authorities, details (e.g. remote address) and the authenticated flag.

</details>

## Intermediate

### Q4. What is the role of `DelegatingFilterProxy` and `FilterChainProxy`?

<details>
<summary>Answer</summary>

`DelegatingFilterProxy` is a plain servlet filter registered with the container that delegates to a Spring bean named `springSecurityFilterChain` — bridging the servlet container's lifecycle and the Spring context. That bean is `FilterChainProxy`, which selects the matching `SecurityFilterChain`, runs its filters, applies the HTTP firewall and clears the security context afterwards.

</details>

### Q5. What does `ExceptionTranslationFilter` do?

<details>
<summary>Answer</summary>

It catches security exceptions thrown further down the chain. An `AuthenticationException`, or an `AccessDeniedException` for an anonymous user, starts authentication via the `AuthenticationEntryPoint` (401 or redirect to login, saving the request). An `AccessDeniedException` for an authenticated user is passed to the `AccessDeniedHandler` (403).

</details>

### Q6. How do you access the current user in a controller and in a service?

<details>
<summary>Answer</summary>

In controllers, declare `@AuthenticationPrincipal UserDetails user` (or `Authentication`/`Principal`) as a parameter. In services, prefer passing the needed identity as a parameter; if necessary read `SecurityContextHolder.getContext().getAuthentication()`, remembering it is thread-bound.

</details>

## Advanced

### Q7. The `SecurityContext` is empty inside an `@Async` method. Why, and how do you fix it?

<details>
<summary>Answer</summary>

The context is stored in a `ThreadLocal` of the request thread; the async executor's thread has none. Wrap the executor with `DelegatingSecurityContextAsyncTaskExecutor` (or use a `TaskDecorator` that copies the context), or pass the user id explicitly. `MODE_INHERITABLETHREADLOCAL` is not recommended with thread pools because threads are reused across users.

</details>

### Q8. What changed about saving the `SecurityContext` in Spring Security 6?

<details>
<summary>Answer</summary>

`SecurityContextPersistenceFilter` was replaced by `SecurityContextHolderFilter`, which only loads the context. Saving is now explicit: authentication mechanisms must call `SecurityContextRepository.saveContext` if the authentication should survive to the next request. Built-in form login does this; custom login endpoints in session-based apps must do it themselves, otherwise the user appears logged out on the next request. Stateless JWT filters authenticate on every request and save nothing.

</details>

### Q9. How would you see which filters run for a request?

<details>
<summary>Answer</summary>

Set `logging.level.org.springframework.security=TRACE` (or DEBUG): Spring Security logs the selected chain, each filter invocation and authorization decisions. You can also inspect `FilterChainProxy.getFilterChains()` programmatically, or use `@EnableWebSecurity(debug = true)` in development to print request details and the filter list.

</details>
