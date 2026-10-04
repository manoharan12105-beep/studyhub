# JWT Authentication Flow in Spring Security

**Module:** Spring Security · **Interview priority:** Core

## Definition

The **JWT authentication flow** is how a stateless Spring Boot API logs users in and recognises them afterwards: a login endpoint authenticates credentials through the `AuthenticationManager` and returns a signed **access token**; on every later request a **JWT filter** reads the `Authorization: Bearer` header, **validates** the token, builds an `Authentication` and **populates the `SecurityContext`**, so that URL rules and method security can **authorize** the request before the controller runs.

## Why It Matters

- "How does Spring Security process a JWT request?" is one of the most common Spring Boot interview questions — especially for candidates who list JWT on their résumé.
- Most JWT bugs (filter order, double registration, CSRF, 401 vs 403, missing roles) are understood only by knowing each step.

## JWT Authentication Flow

```text
LOGIN
 Client ──POST /api/auth/login {username, password}──► AuthController
        AuthenticationManager.authenticate(unauthenticated token)
            └─ DaoAuthenticationProvider → UserDetailsService.loadUserByUsername → PasswordEncoder.matches
        success → JwtService.generate(user)  (sub, roles, iat, exp, signed with the server key)
 Client ◄── 200 {"accessToken": "eyJ…"}           failure → 401

EVERY LATER REQUEST
 Client ──GET /api/orders  Authorization: Bearer eyJ…──►
   Servlet container → DelegatingFilterProxy → FilterChainProxy → SecurityFilterChain
     ├─ (CSRF disabled for this stateless API)
     ├─ JwtAuthenticationFilter (before UsernamePasswordAuthenticationFilter)
     │     no header → continue anonymously
     │     validate signature + expiry (+ issuer/audience) → invalid → continue unauthenticated
     │     valid → load user (optional) → UsernamePasswordAuthenticationToken.authenticated(user, null, authorities)
     │           → SecurityContextHolder.setContext(context)          ← SecurityContext population
     ├─ AnonymousAuthenticationFilter (only if still unauthenticated)
     ├─ ExceptionTranslationFilter     → 401 via entry point / 403 via access denied handler
     └─ AuthorizationFilter            → URL rules: hasRole, authenticated …       ← authorization
   DispatcherServlet → controller (@PreAuthorize checks, @AuthenticationPrincipal user)
 Client ◄── 200 JSON
 After the request: SecurityContextHolderFilter clears the context (nothing stored server-side)
```

## Access Token

A short-lived JWT (typically 5–15 minutes) proving the user's identity and roles for API calls. Its lifetime limits damage if stolen. Refreshing it without re-entering the password is the job of the **refresh token** — see [Access Tokens, Refresh Tokens and Expiration](../access-and-refresh-tokens/content.md).

## JWT Filter

Responsibilities of a well-behaved filter:

1. Run once per request (`OncePerRequestFilter`).
2. Skip requests without `Bearer` (let authorization decide whether anonymous access is allowed).
3. Validate the token with a library (signature, `exp`, expected algorithm/issuer).
4. Create an **authenticated** `Authentication` with authorities and set a **new** `SecurityContext`.
5. On invalid tokens, leave the request unauthenticated (→ 401 at authorization), or write a 401 response directly; never throw unhandled exceptions (they are outside `@ControllerAdvice`).
6. Always continue the chain (`chain.doFilter`).

## Token Validation

Validate: signature with the expected key and algorithm; `exp` (and `nbf`) with small clock skew; `iss` and `aud` when several issuers/services exist; optionally that the user still exists and is enabled (a database lookup per request — a freshness vs statelessness trade-off); optionally a denylist (`jti`) or token version for revocation.

## SecurityContext Population

```java
Authentication authentication = UsernamePasswordAuthenticationToken.authenticated(user, null, user.getAuthorities());
SecurityContext context = SecurityContextHolder.createEmptyContext();   // new context: avoids races
context.setAuthentication(authentication);
SecurityContextHolder.setContext(context);
```

Because the API is `STATELESS`, the context is not saved anywhere; the next request repeats the validation.

## AuthenticationManager in the Login Endpoint

The login endpoint should **delegate** to the `AuthenticationManager` rather than comparing passwords itself — this reuses `UserDetailsService`, `PasswordEncoder`, account checks (locked/disabled) and generic error handling (`BadCredentialsException` → 401).

## How It Works

A complete, runnable stateless API: BCrypt users, `AuthenticationManager`, login endpoint, jjwt 0.12 token service, JWT filter, URL authorization and a 401 entry point — exercised with `MockMvc` against the real `springSecurityFilterChain`.

```java
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import javax.crypto.SecretKey;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.RequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

public class JwtSecurityDemo {

    // ---------- JWT creation and validation ----------
    static class JwtService {
        private final SecretKey key;
        private final Duration ttl;

        JwtService(String secret, Duration ttl) {
            this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));   // at least 256 bits for HS256
            this.ttl = ttl;
        }

        String generate(UserDetails user) {
            Instant now = Instant.now();
            return Jwts.builder()
                    .subject(user.getUsername())
                    .claim("roles", user.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList())
                    .issuedAt(Date.from(now))
                    .expiration(Date.from(now.plus(ttl)))
                    .signWith(key)                                  // HS256, chosen from the key size
                    .compact();
        }

        Claims validate(String token) {                            // throws JwtException if invalid or expired
            return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
        }
    }

    // ---------- Filter: Authorization header -> SecurityContext ----------
    static class JwtAuthenticationFilter extends OncePerRequestFilter {
        private final JwtService jwtService;
        private final UserDetailsService userDetailsService;

        JwtAuthenticationFilter(JwtService jwtService, UserDetailsService userDetailsService) {
            this.jwtService = jwtService;
            this.userDetailsService = userDetailsService;
        }

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                        FilterChain chain) throws ServletException, IOException {
            String header = request.getHeader("Authorization");
            if (header == null || !header.startsWith("Bearer ")) {
                chain.doFilter(request, response);                 // anonymous; authorization decides later
                return;
            }
            try {
                Claims claims = jwtService.validate(header.substring(7));
                UserDetails user = userDetailsService.loadUserByUsername(claims.getSubject());
                Authentication authentication = UsernamePasswordAuthenticationToken.authenticated(
                        user, null, user.getAuthorities());
                SecurityContext context = SecurityContextHolder.createEmptyContext();
                context.setAuthentication(authentication);
                SecurityContextHolder.setContext(context);
            } catch (JwtException e) {
                SecurityContextHolder.clearContext();              // invalid token: stays unauthenticated
            }
            chain.doFilter(request, response);
        }
    }

    // ---------- Configuration ----------
    @Configuration
    @EnableWebMvc                                                  // Spring Boot configures MVC automatically
    @EnableWebSecurity
    static class SecurityConfig {

        @Bean
        PasswordEncoder passwordEncoder() {
            return new BCryptPasswordEncoder();
        }

        @Bean
        UserDetailsService userDetailsService(PasswordEncoder encoder) {
            return new InMemoryUserDetailsManager(
                    User.withUsername("asha").password(encoder.encode("asha-pass")).roles("USER").build(),
                    User.withUsername("ravi").password(encoder.encode("ravi-pass")).roles("ADMIN").build());
        }

        @Bean
        AuthenticationManager authenticationManager(UserDetailsService uds, PasswordEncoder encoder) {
            DaoAuthenticationProvider provider = new DaoAuthenticationProvider(uds);
            provider.setPasswordEncoder(encoder);
            return new ProviderManager(provider);
        }

        @Bean
        JwtService jwtService() {
            return new JwtService("change-me-to-a-long-random-secret-of-32-bytes-or-more", Duration.ofMinutes(15));
        }

        @Bean
        SecurityFilterChain api(HttpSecurity http, JwtService jwt, UserDetailsService uds) throws Exception {
            return http
                    .csrf(csrf -> csrf.disable())                                     // stateless API, no cookies
                    .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                    .authorizeHttpRequests(auth -> auth
                            .requestMatchers("/api/auth/login").permitAll()
                            .requestMatchers("/api/admin/**").hasRole("ADMIN")
                            .anyRequest().authenticated())
                    .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                    .addFilterBefore(new JwtAuthenticationFilter(jwt, uds), UsernamePasswordAuthenticationFilter.class)
                    .build();
        }

        @Bean
        AuthController authController(AuthenticationManager manager, JwtService jwt) {
            return new AuthController(manager, jwt);
        }

        @Bean
        ApiController apiController() {
            return new ApiController();
        }
    }

    record LoginRequest(String username, String password) {
    }

    @RestController
    static class AuthController {
        private final AuthenticationManager authenticationManager;
        private final JwtService jwtService;

        AuthController(AuthenticationManager authenticationManager, JwtService jwtService) {
            this.authenticationManager = authenticationManager;
            this.jwtService = jwtService;
        }

        @PostMapping("/api/auth/login")
        Map<String, String> login(@RequestBody LoginRequest request) {
            Authentication result = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(request.username(), request.password()));
            return Map.of("accessToken", jwtService.generate((UserDetails) result.getPrincipal()));
        }
    }

    @RestController
    static class ApiController {
        @GetMapping("/api/me")
        String me(@AuthenticationPrincipal UserDetails user) {
            return user.getUsername() + " " + user.getAuthorities();
        }

        @GetMapping("/api/admin/stats")
        String stats() {
            return "orders today: 42";
        }
    }

    static String call(MockMvc mvc, String label, RequestBuilder request) throws Exception {
        var response = mvc.perform(request).andReturn().getResponse();
        String body = response.getContentAsString();
        String shown = body.startsWith("{\"accessToken\"") ? "{\"accessToken\":\"eyJ...\"}" : body;
        System.out.printf("%-32s -> %d %s%n", label, response.getStatus(), shown);
        return body;
    }

    static String token(String loginBody) {
        return loginBody.replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
    }

    public static void main(String[] args) throws Exception {
        AnnotationConfigWebApplicationContext context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        context.register(SecurityConfig.class);
        context.refresh();
        MockMvc mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        call(mvc, "login, wrong password", post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON).content("{\"username\":\"asha\",\"password\":\"nope\"}"));
        String asha = token(call(mvc, "login asha (USER)", post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON).content("{\"username\":\"asha\",\"password\":\"asha-pass\"}")));
        System.out.println("token parts (header.payload.signature): " + asha.split("\\.").length);

        call(mvc, "GET /api/me, no token", get("/api/me"));
        call(mvc, "GET /api/me, asha's token", get("/api/me").header("Authorization", "Bearer " + asha));
        call(mvc, "GET /api/admin/stats, asha", get("/api/admin/stats").header("Authorization", "Bearer " + asha));
        String tampered = asha.substring(0, asha.lastIndexOf('.') + 1) + "invalidSignature";
        call(mvc, "GET /api/me, tampered token", get("/api/me").header("Authorization", "Bearer " + tampered));

        String ravi = token(call(mvc, "login ravi (ADMIN)", post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON).content("{\"username\":\"ravi\",\"password\":\"ravi-pass\"}")));
        call(mvc, "GET /api/admin/stats, ravi", get("/api/admin/stats").header("Authorization", "Bearer " + ravi));
        context.close();
    }
}
```

**Output:**

```text
login, wrong password            -> 401 
login asha (USER)                -> 200 {"accessToken":"eyJ..."}
token parts (header.payload.signature): 3
GET /api/me, no token            -> 401 
GET /api/me, asha's token        -> 200 asha [ROLE_USER]
GET /api/admin/stats, asha       -> 403 
GET /api/me, tampered token      -> 401 
login ravi (ADMIN)               -> 200 {"accessToken":"eyJ..."}
GET /api/admin/stats, ravi       -> 200 orders today: 42
```

The wrong-password login became 401 because the `BadCredentialsException` thrown by the controller propagated to `ExceptionTranslationFilter`, which called the 401 entry point. In a Spring Boot application, drop `@EnableWebMvc` and the manual context setup; keep the beans. Keep the secret out of code (`app.jwt.secret` from an environment variable).

### Spring's built-in alternative

Instead of a hand-written filter, Spring Security's **OAuth2 resource server** validates JWTs with `BearerTokenAuthenticationFilter` and a `JwtDecoder`: `http.oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))` with `spring.security.oauth2.resourceserver.jwt.issuer-uri` (or a public key / secret). It is the recommended approach when tokens come from an authorization server — see [OAuth2 Awareness](../oauth2-awareness/content.md).

## Internal Behavior

- The filter is created inside the security configuration and added to the chain — **not** declared as a `@Component`, which would also register it as a global servlet filter (running twice and outside security's ordering).
- Exceptions thrown inside the filter are outside `@ControllerAdvice`; handle them in the filter or with the entry point.
- `@AuthenticationPrincipal` resolves the principal from the `SecurityContext` set by the filter.
- With `STATELESS`, Spring Security does not create sessions; `JSESSIONID` cookies should not appear.

## Common Mistakes

- Filter registered as `@Component` and in the chain (runs twice).
- Filter added after `AuthorizationFilter`, or reading the token but never setting the context.
- Using `UsernamePasswordAuthenticationToken(principal, credentials)` (two-argument constructor = **unauthenticated**) instead of the three-argument/`authenticated` form.
- Roles stored without `ROLE_` prefix, so `hasRole` fails → unexpected 403.
- CSRF left enabled on the stateless API → POST requests fail with 403.
- Hard-coded secrets, long-lived access tokens, no refresh/revocation plan.

## Common Interview Traps

- **"The JWT filter authorizes the request."** It authenticates (populates the context); `AuthorizationFilter` and method security authorize.
- **"Spring Security has a built-in JWT login endpoint."** It doesn't — you write the login endpoint (or use an authorization server); Spring provides validation via the resource server.
- **"An invalid token should return 403."** Invalid/expired token = not authenticated = 401.

## Key Takeaways

- Login: `AuthenticationManager.authenticate` → issue signed JWT. Requests: filter validates → `SecurityContext` → `AuthorizationFilter` → controller.
- Filter before `UsernamePasswordAuthenticationFilter`, stateless sessions, CSRF disabled for header tokens, 401 entry point.
- Validate signature, expiry, algorithm, issuer/audience; keep access tokens short-lived; keep secrets external.
