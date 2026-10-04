# Roles, Authorities and Method Security

**Module:** Spring Security · **Interview priority:** Core

## Definition

- An **authority** (`GrantedAuthority`) is a string permission held by an authenticated principal, e.g. `order:write` or `ROLE_ADMIN`.
- A **role** is an authority with the **`ROLE_` prefix** by convention; `hasRole("ADMIN")` checks for the authority `ROLE_ADMIN`.
- **URL authorization** (`authorizeHttpRequests`) protects request paths in the filter chain.
- **Method security** protects individual bean methods with annotations — **`@PreAuthorize`** (before the call, SpEL expression), **`@PostAuthorize`** (after, can inspect `returnObject`), **`@Secured`** and **`@RolesAllowed`** — enabled with **`@EnableMethodSecurity`**.

## Why It Matters

- Real systems need both coarse rules (only admins reach `/admin`) and fine rules (a user may cancel only their own order).
- "Role vs authority", "`hasRole` vs `hasAuthority`" and "How does `@PreAuthorize` work?" are standard questions.

## Roles

Use roles for **coarse-grained groups of users**: `ROLE_CUSTOMER`, `ROLE_SELLER`, `ROLE_ADMIN`.

```java
User.withUsername("ravi").password(hash).roles("ADMIN").build();         // stores ROLE_ADMIN
User.withUsername("ravi").password(hash).authorities("ROLE_ADMIN").build(); // same thing, explicit
```

## Authorities

Use fine-grained authorities for **permissions**: `product:create`, `order:refund`. A common model: roles stored in the database map to sets of permissions, and the `UserDetails` carries both (`ROLE_ADMIN`, `order:refund`, …).

| | `hasRole("ADMIN")` | `hasAuthority("ROLE_ADMIN")` | `hasAuthority("order:refund")` |
|--|--------------------|------------------------------|-------------------------------|
| Checks authority | `ROLE_ADMIN` (prefix added) | `ROLE_ADMIN` | `order:refund` |
| Typical use | Role-based rules | Same, explicit | Permission-based rules |

Pitfall: `hasRole("ROLE_ADMIN")` is rejected/never matches; authorities built without the prefix (`"ADMIN"`) never satisfy `hasRole("ADMIN")`.

## URL Authorization

```java
.authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
        .requestMatchers("/api/admin/**").hasRole("ADMIN")
        .requestMatchers(HttpMethod.POST, "/api/products").hasAuthority("product:create")
        .requestMatchers("/actuator/health").permitAll()
        .anyRequest().authenticated())
```

Evaluated in order by `AuthorizationFilter` before the request reaches Spring MVC. Good for broad rules; it cannot see method arguments or loaded objects.

## Method Security

```java
@Configuration
@EnableMethodSecurity                 // prePostEnabled = true by default; securedEnabled / jsr250Enabled opt-in
class MethodSecurityConfig {
}
```

## @PreAuthorize

Evaluates a SpEL expression **before** the method runs; `false` → `AccessDeniedException` (→ 403).

```java
@PreAuthorize("hasRole('ADMIN')")
public void deleteUser(long id) {
}

@PreAuthorize("#username == authentication.name or hasRole('ADMIN')")   // method argument by name
public List<Order> ordersOf(String username) {
    return List.of();
}

@PreAuthorize("@orderSecurity.isOwner(#orderId, authentication)")       // delegate to a bean
public void cancel(long orderId) {
}
```

Useful expressions: `hasRole`, `hasAnyRole`, `hasAuthority`, `hasAnyAuthority`, `isAuthenticated()`, `permitAll`, `authentication`, `principal`, `#param`, `@bean.method(...)`.

`@PostAuthorize("returnObject.owner == authentication.name")` checks the **result** (the method runs first — avoid on methods with side effects). `@PreFilter`/`@PostFilter` filter collections (load-then-filter; prefer query-level filtering for large data).

## @Secured Awareness

`@Secured("ROLE_ADMIN")` — older Spring annotation listing required authorities, no SpEL; enable with `@EnableMethodSecurity(securedEnabled = true)`. `@RolesAllowed("ADMIN")` is the Jakarta (JSR-250) equivalent (`jsr250Enabled = true`). `@PreAuthorize` is the most flexible and the usual choice. `@EnableGlobalMethodSecurity` is the deprecated predecessor of `@EnableMethodSecurity`.

## How It Works

```java
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;

public class MethodSecurityDemo {

    record Order(long id, String owner) {
    }

    static class OrderService {
        @PreAuthorize("hasRole('ADMIN')")
        public String refundAll() {
            return "all refunds issued";
        }

        @PreAuthorize("hasAuthority('order:read') and #username == authentication.name")
        public String ordersOf(String username) {
            return "orders of " + username;
        }

        @PostAuthorize("returnObject.owner() == authentication.name or hasRole('ADMIN')")
        public Order find(long id) {
            return new Order(id, id == 1 ? "asha" : "ravi");
        }
    }

    @Configuration
    @EnableMethodSecurity                       // enables @PreAuthorize / @PostAuthorize (Spring Boot: add it yourself)
    static class Config {
        @Bean
        OrderService orderService() {
            return new OrderService();
        }
    }

    static void loginAs(String user, String... authorities) {
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                user, null, AuthorityUtils.createAuthorityList(authorities)));
    }

    interface Call {
        Object run();
    }

    static void attempt(String label, Call call) {
        try {
            System.out.println(label + " -> " + call.run());
        } catch (AccessDeniedException e) {
            System.out.println(label + " -> AccessDeniedException");
        }
    }

    public static void main(String[] args) {
        try (var context = new AnnotationConfigApplicationContext(Config.class)) {
            OrderService orders = context.getBean(OrderService.class);

            loginAs("asha", "ROLE_USER", "order:read");
            attempt("asha refundAll()", orders::refundAll);
            attempt("asha ordersOf(asha)", () -> orders.ordersOf("asha"));
            attempt("asha ordersOf(ravi)", () -> orders.ordersOf("ravi"));
            attempt("asha find(1)", () -> orders.find(1));
            attempt("asha find(2)", () -> orders.find(2));

            loginAs("admin", "ROLE_ADMIN");
            attempt("admin refundAll()", orders::refundAll);
            attempt("admin find(2)", () -> orders.find(2));
            SecurityContextHolder.clearContext();
        }
    }
}
```

**Output:**

```text
asha refundAll() -> AccessDeniedException
asha ordersOf(asha) -> orders of asha
asha ordersOf(ravi) -> AccessDeniedException
asha find(1) -> Order[id=1, owner=asha]
asha find(2) -> AccessDeniedException
admin refundAll() -> all refunds issued
admin find(2) -> Order[id=2, owner=ravi]
```

## Internal Behavior

- `@EnableMethodSecurity` registers `AuthorizationManagerBeforeMethodInterceptor`/`AfterMethodInterceptor` advisors; beans with these annotations are wrapped in **proxies** — so self-invocation and private methods bypass method security, exactly like `@Transactional`.
- Expressions are evaluated against a `MethodSecurityExpressionRoot` (with `authentication`, method parameters by name — compile with `-parameters`).
- Thrown `AccessDeniedException` from a controller method passes through `@ControllerAdvice` first (a catch-all handler may turn it into 500!), otherwise `ExceptionTranslationFilter` returns 403.

## Object-Level Authorization

Roles do not stop user A from reading user B's order. Enforce ownership:

- In queries: `findByIdAndCustomerId(id, currentUserId)` → 404 if not owned.
- In method security: `@PreAuthorize("@orderSecurity.isOwner(#id, authentication)")`.
- Never trust ids from the client for "who am I" — derive the user from the `Authentication`.

## Common Mistakes

- `hasRole("ROLE_X")` or authorities missing the prefix.
- `@PreAuthorize` without `@EnableMethodSecurity` — silently ignored.
- Method security on private methods or called via `this`.
- Only role checks, no ownership checks (IDOR / broken object-level authorization).
- `@PostAuthorize` on methods with side effects (the side effect happens even if access is denied).

## Common Interview Traps

- **"A role and an authority are different types."** Both are `GrantedAuthority` strings; roles are just authorities prefixed with `ROLE_`.
- **"URL security is enough."** It cannot express "only the owner"; method or query-level checks are needed.
- **"`@Secured` supports SpEL."** It doesn't; `@PreAuthorize` does.

## Key Takeaways

- Authorities are permission strings; roles are authorities starting with `ROLE_`; `hasRole('X')` ⇔ `hasAuthority('ROLE_X')`.
- URL rules in `authorizeHttpRequests` (ordered); method rules with `@EnableMethodSecurity` + `@PreAuthorize`/`@PostAuthorize`.
- Method security is proxy-based; add ownership checks for object-level authorization.
