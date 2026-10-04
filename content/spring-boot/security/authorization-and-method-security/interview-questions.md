# Roles, Authorities and Method Security — Interview Questions

## Beginner

### Q1. What is the difference between a role and an authority?

<details>
<summary>Answer</summary>

Both are `GrantedAuthority` strings. A role is an authority following the `ROLE_` prefix convention and represents a group (`ROLE_ADMIN`); other authorities usually represent fine-grained permissions (`order:refund`). `hasRole("ADMIN")` checks for `ROLE_ADMIN`, while `hasAuthority` checks the exact string.

</details>

### Q2. How do you enable `@PreAuthorize`?

<details>
<summary>Answer</summary>

Add `@EnableMethodSecurity` to a configuration class (pre/post annotations are enabled by default), then annotate bean methods: `@PreAuthorize("hasRole('ADMIN')")`. Without the enabling annotation, method security annotations are ignored.

</details>

### Q3. What is the difference between `@PreAuthorize` and `@Secured`?

<details>
<summary>Answer</summary>

`@PreAuthorize` evaluates a SpEL expression (roles, authorities, method arguments, beans, the authentication). `@Secured` just lists required authorities, without expressions, and must be enabled with `securedEnabled = true`. `@RolesAllowed` is the JSR-250 equivalent of `@Secured`.

</details>

## Intermediate

### Q4. How do you ensure a user can only access their own orders?

<details>
<summary>Answer</summary>

Derive the user from the `Authentication`, never from a client-supplied id, and scope data access by owner: `orderRepository.findByIdAndCustomerId(id, currentUserId)` returning 404 when absent, or `@PreAuthorize("@orderSecurity.isOwner(#orderId, authentication)")`. Admins can be allowed with `or hasRole('ADMIN')`.

</details>

### Q5. When would you use URL-based authorization vs method security?

<details>
<summary>Answer</summary>

URL rules are good for coarse, path-based policies (public endpoints, `/admin/**`), applied early in the filter chain. Method security fits rules that depend on business context — arguments, returned objects, ownership — and protects services regardless of which controller or job calls them. Most applications use both.

</details>

### Q6. What does `@PostAuthorize` do and what is its risk?

<details>
<summary>Answer</summary>

It evaluates an expression after the method returns, with access to `returnObject`, denying access if false — useful when the decision depends on the loaded data. The method still executes, so any side effects (writes, audit, remote calls) happen even when access is denied; use it only on read-only methods.

</details>

## Advanced

### Q7. Why might `@PreAuthorize` not be enforced?

<details>
<summary>Answer</summary>

`@EnableMethodSecurity` is missing; the method is private or called via `this` (self-invocation bypasses the proxy); the object is not a Spring bean; or the annotation is on an interface method with a configuration that does not detect it. Like transactions, method security is proxy-based.

</details>

### Q8. A `@PreAuthorize` failure returns 500 instead of 403. Why?

<details>
<summary>Answer</summary>

The `AccessDeniedException` is thrown from the controller method inside the `DispatcherServlet`, so a global `@ExceptionHandler(Exception.class)` in a `@RestControllerAdvice` catches it first and maps it to 500. Handle `AccessDeniedException` (and `AuthenticationException`) explicitly with 403/401, or rethrow them so `ExceptionTranslationFilter` can respond.

</details>
