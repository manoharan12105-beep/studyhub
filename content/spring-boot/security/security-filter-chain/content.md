# SecurityFilterChain, Filters and SecurityContext

**Module:** Spring Security · **Interview priority:** Core

## Definition

- A **`SecurityFilterChain`** is an ordered list of security filters plus a request matcher deciding which requests it handles. You declare it as a bean built with `HttpSecurity`.
- **`FilterChainProxy`** (bean name `springSecurityFilterChain`) holds all `SecurityFilterChain`s and runs the first matching one. The servlet container reaches it through **`DelegatingFilterProxy`**, a standard servlet filter that delegates to the Spring bean.
- The **`SecurityContext`** holds the current **`Authentication`**; it is stored in the **`SecurityContextHolder`**, which by default keeps it in a **`ThreadLocal`** for the duration of the request.
- The **`Authentication`** object represents the principal (who), credentials (proof, cleared after login), authorities (what they may do) and whether it is authenticated.

## Why It Matters

- The JWT filter you write is one link of this chain; where you place it decides whether authorization sees the user.
- "Explain the Spring Security filter chain" and "Where is the logged-in user stored?" are common questions; so is debugging "SecurityContext is empty".

## SecurityFilterChain

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
class MultiChainConfig {

    @Bean
    @Order(1)
    SecurityFilterChain api(HttpSecurity http) throws Exception {
        return http
                .securityMatcher("/api/**")                       // only /api/** requests use this chain
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults())
                .build();
    }

    @Bean
    @Order(2)
    SecurityFilterChain web(HttpSecurity http) throws Exception {
        return http                                                // everything else
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .formLogin(Customizer.withDefaults())
                .build();
    }
}
```

Each `HttpSecurity` DSL call adds, removes or configures filters: `formLogin()` adds `UsernamePasswordAuthenticationFilter`, `httpBasic()` adds `BasicAuthenticationFilter`, `csrf(disable)` removes `CsrfFilter`, `addFilterBefore(myFilter, X.class)` inserts yours.

## Security Filters

Main filters, in execution order (a subset — the exact list depends on configuration):

| Filter | Responsibility |
|--------|----------------|
| `SecurityContextHolderFilter` | Loads the `SecurityContext` (from the HTTP session if stateful) into `SecurityContextHolder`; clears it after the request |
| `HeaderWriterFilter` | Adds security headers |
| `CorsFilter` | Handles CORS, including preflight `OPTIONS` (when `.cors()` is enabled) |
| `CsrfFilter` | Validates CSRF tokens on POST/PUT/PATCH/DELETE |
| `LogoutFilter` | Handles `/logout` |
| `UsernamePasswordAuthenticationFilter` | Form login (`POST /login`) |
| `BasicAuthenticationFilter` | `Authorization: Basic …` |
| `BearerTokenAuthenticationFilter` | OAuth2 resource server bearer tokens |
| *Your JWT filter* | Usually added before `UsernamePasswordAuthenticationFilter` |
| `RequestCacheAwareFilter` | Replays the original request after login |
| `AnonymousAuthenticationFilter` | Puts an anonymous `Authentication` if none exists |
| `SessionManagementFilter` | Session fixation protection, concurrency control |
| `ExceptionTranslationFilter` | Converts `AuthenticationException` → 401/entry point, `AccessDeniedException` → 403 |
| `AuthorizationFilter` | Applies `authorizeHttpRequests` rules; throws `AccessDeniedException` |

## How It Works

The program below builds the two chains above and prints the real filters Spring Security created for each.

```java
import jakarta.servlet.Filter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;

public class FilterChainDemo {

    @Configuration
    @EnableWebSecurity                                          // Spring Boot adds this automatically
    static class SecurityConfig {

        @Bean
        SecurityFilterChain api(HttpSecurity http) throws Exception {
            return http
                    .securityMatcher("/api/**")                                  // chain 1: stateless API
                    .csrf(csrf -> csrf.disable())
                    .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                    .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                    .httpBasic(Customizer.withDefaults())
                    .build();
        }

        @Bean
        SecurityFilterChain web(HttpSecurity http) throws Exception {
            return http                                                          // chain 2: everything else
                    .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                    .formLogin(Customizer.withDefaults())
                    .build();
        }
    }

    public static void main(String[] args) {
        AnnotationConfigWebApplicationContext context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        context.register(SecurityConfig.class);
        context.refresh();

        FilterChainProxy proxy = context.getBean(FilterChainProxy.class);    // bean "springSecurityFilterChain"
        int n = 1;
        for (SecurityFilterChain chain : proxy.getFilterChains()) {
            System.out.println("SecurityFilterChain " + n++ + ":");
            for (Filter filter : chain.getFilters()) {
                System.out.println("  " + filter.getClass().getSimpleName());
            }
        }
        context.close();
    }
}
```

**Output:**

```text
SecurityFilterChain 1:
  DisableEncodeUrlFilter
  WebAsyncManagerIntegrationFilter
  SecurityContextHolderFilter
  HeaderWriterFilter
  LogoutFilter
  BasicAuthenticationFilter
  RequestCacheAwareFilter
  SecurityContextHolderAwareRequestFilter
  AnonymousAuthenticationFilter
  SessionManagementFilter
  ExceptionTranslationFilter
  AuthorizationFilter
SecurityFilterChain 2:
  DisableEncodeUrlFilter
  WebAsyncManagerIntegrationFilter
  SecurityContextHolderFilter
  HeaderWriterFilter
  CsrfFilter
  LogoutFilter
  UsernamePasswordAuthenticationFilter
  DefaultResourcesFilter
  DefaultLoginPageGeneratingFilter
  DefaultLogoutPageGeneratingFilter
  RequestCacheAwareFilter
  SecurityContextHolderAwareRequestFilter
  AnonymousAuthenticationFilter
  ExceptionTranslationFilter
  AuthorizationFilter
```

Compare: the API chain has no `CsrfFilter` (disabled) and uses `BasicAuthenticationFilter`; the web chain has CSRF, form login and the generated login/logout pages. In a running application, `logging.level.org.springframework.security=TRACE` prints the chain and each filter invocation per request.

## SecurityContext

```java
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

class CurrentUser {
    static String name() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null ? null : auth.getName();
    }
}
```

- In controllers, prefer `@AuthenticationPrincipal UserDetails user` or a `Principal`/`Authentication` parameter over static access.
- `SecurityContextHolder` strategies: `MODE_THREADLOCAL` (default), `MODE_INHERITABLETHREADLOCAL` (child threads inherit — unsafe with thread pools), `MODE_GLOBAL`.
- The context is **cleared after each request** by `SecurityContextHolderFilter` — pooled threads never leak users between requests.
- For `@Async`/executors, propagate it explicitly: `DelegatingSecurityContextExecutor`/`DelegatingSecurityContextAsyncTaskExecutor`.
- **Spring Security 6+ change:** authentication filters must save the context explicitly through a `SecurityContextRepository` if it should persist across requests (form login does this for you with sessions). For stateless JWT, the filter sets the context on **every** request and nothing is saved.

## Authentication Object

| Method | Meaning |
|--------|---------|
| `getPrincipal()` | The user — usually a `UserDetails` (or the username) after authentication |
| `getCredentials()` | Password/token used to authenticate; erased after successful authentication |
| `getAuthorities()` | `GrantedAuthority` collection (`ROLE_ADMIN`, `order:read`) |
| `isAuthenticated()` | Whether it has been authenticated |
| `getDetails()` | Extra request info (IP address, session id) |
| `getName()` | Principal name |

Common implementations: `UsernamePasswordAuthenticationToken` (form, Basic, custom JWT filters), `JwtAuthenticationToken` (OAuth2 resource server), `AnonymousAuthenticationToken`. Create with the factory methods `UsernamePasswordAuthenticationToken.unauthenticated(user, password)` (before authentication) and `.authenticated(principal, null, authorities)` (after).

## Internal Behavior

- `DelegatingFilterProxy` exists because the servlet container instantiates filters before (and independently of) the Spring context; it looks up the `springSecurityFilterChain` bean lazily.
- Spring Boot registers it automatically with order `-100` (`spring.security.filter.order`), so security runs before most other filters.
- `FilterChainProxy` also applies `HttpFirewall` checks (rejects malicious URLs, e.g. encoded slashes) and clears the context in a `finally` block.
- `ExceptionTranslationFilter` only catches exceptions thrown **after** it in the chain (from `AuthorizationFilter` and the application, including method security exceptions that are not handled by `@ControllerAdvice`).

## Common Mistakes

- Adding a JWT filter after `AuthorizationFilter` (authorization sees anonymous) or registering it twice (as a `@Component` servlet filter and in the chain).
- Reading `SecurityContextHolder` in an `@Async` method without propagation.
- Multiple chains without `securityMatcher`/`@Order` — the first, catch-all chain hides the others.
- Expecting `@ControllerAdvice` to handle exceptions thrown in security filters.

## Common Interview Traps

- **"There is one Spring Security filter."** There is one servlet-level entry (`DelegatingFilterProxy`) that runs a whole chain of security filters.
- **"The SecurityContext is stored in the session."** In stateful apps it is *saved* to the session between requests; during a request it lives in a `ThreadLocal`. Stateless apps never use the session.
- **"Credentials stay in the Authentication."** They are erased after successful authentication (`eraseCredentialsAfterAuthentication`).

## Key Takeaways

- `DelegatingFilterProxy` → `FilterChainProxy` → first matching `SecurityFilterChain` → ordered filters → `AuthorizationFilter`.
- `SecurityContextHolder` (thread-local) holds the `Authentication`: principal, credentials, authorities.
- `ExceptionTranslationFilter` turns security exceptions into 401/403.
- Use multiple chains with `securityMatcher` for API vs web.
