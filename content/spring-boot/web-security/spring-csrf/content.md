# CSRF and CSRF vs CORS

**Module:** CORS, CSRF and Web Security · **Interview priority:** Core

## Definition

**Cross-Site Request Forgery (CSRF)** is an attack in which a malicious website makes the victim's browser send a **state-changing request** to a site where the victim is logged in. Because browsers attach that site's **cookies automatically**, the request is authenticated as the victim. Spring Security prevents it with **CSRF tokens**: unsafe requests (POST, PUT, PATCH, DELETE) must carry a secret token that a foreign site cannot read.

## Why It Matters

- Cookie-based authentication (sessions, or JWTs stored in cookies) is vulnerable by default.
- "Why do my POST requests return 403?" is often CSRF; "Why is it OK to disable CSRF for a JWT API?" is a classic interview question.

## CSRF

```text
1. Asha logs in to bank.example → browser stores cookie JSESSIONID=abc (domain bank.example)
2. Asha visits evil.example, which contains:
      <form action="https://bank.example/transfer" method="POST">
        <input name="to" value="attacker"><input name="amount" value="50000">
      </form>
      <script>document.forms[0].submit()</script>
3. Browser sends POST https://bank.example/transfer with Cookie: JSESSIONID=abc  (automatically!)
4. bank.example sees a valid session → transfer executed
```

The attacker never sees the response and never reads the cookie; they only need the browser to **send** an authenticated request.

## Why CSRF Matters

- Any state change reachable by a cookie-authenticated request is at risk: transfers, password/email changes, deletions, purchases.
- Changing the email address is often a stepping stone to account takeover (password reset to the new email).

## How Spring Security Protects

1. The server generates a random **CSRF token** tied to the user's session (or a cookie, depending on the repository).
2. The page includes it in forms (hidden `_csrf` field — Thymeleaf adds it automatically) or JavaScript reads it from a cookie/endpoint and sends it in a header (`X-XSRF-TOKEN` / `X-CSRF-TOKEN`).
3. `CsrfFilter` checks every POST/PUT/PATCH/DELETE: missing or wrong token → **403**.
4. A foreign site cannot read the token (same-origin policy), so it cannot forge a valid request.

GET, HEAD, OPTIONS and TRACE are not checked — **safe methods must not change state**.

```java
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.RequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

public class CsrfDemo {

    @Configuration
    @EnableWebMvc
    @EnableWebSecurity
    static class Config {

        @Bean
        SecurityFilterChain web(HttpSecurity http) throws Exception {
            return http                                                // session/cookie-based: CSRF stays ON
                    .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                    .formLogin(Customizer.withDefaults())
                    .build();
        }

        @Bean
        AccountController accountController() {
            return new AccountController();
        }
    }

    @RestController
    static class AccountController {
        @GetMapping("/account/email")
        String email() {
            return "asha@example.com";
        }

        @PostMapping("/account/email")
        String changeEmail() {
            return "email changed";
        }
    }

    static void show(MockMvc mvc, String label, RequestBuilder request) throws Exception {
        var r = mvc.perform(request).andReturn().getResponse();
        System.out.println(label + " -> " + r.getStatus() + " " + r.getContentAsString());
    }

    public static void main(String[] args) throws Exception {
        AnnotationConfigWebApplicationContext context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        context.register(Config.class);
        context.refresh();
        MockMvc mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        show(mvc, "GET  (safe method), logged in          ", get("/account/email").with(user("asha")));
        show(mvc, "POST without CSRF token, logged in     ", post("/account/email").with(user("asha")));
        show(mvc, "POST with valid CSRF token, logged in  ", post("/account/email").with(user("asha")).with(csrf()));
        show(mvc, "POST with forged CSRF token, logged in ", post("/account/email").with(user("asha")).with(csrf().useInvalidToken()));
        context.close();
    }
}
```

**Output:**

```text
GET  (safe method), logged in           -> 200 asha@example.com
POST without CSRF token, logged in      -> 403 
POST with valid CSRF token, logged in   -> 200 email changed
POST with forged CSRF token, logged in  -> 403 
```

The user was authenticated in every case; only requests carrying the correct token could change state.

### SPAs with cookie sessions

For a single-page app using session cookies, Spring Security can expose the token in a readable cookie for JavaScript to echo back in a header:

```java
http.csrf(csrf -> csrf.spa());     // Spring Security 6.4+: XSRF-TOKEN cookie + X-XSRF-TOKEN header handling
```

(Older versions: `csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())` plus a request handler.) Angular and Axios send the `XSRF-TOKEN` cookie value as `X-XSRF-TOKEN` automatically.

### When disabling CSRF is acceptable

- The API is **stateless** and authenticates only with a token in the **`Authorization` header** (no cookies for authentication). Browsers never attach that header automatically, so a forged cross-site request is unauthenticated.
- Service-to-service APIs without browsers.

If the JWT (or session) travels in a **cookie**, CSRF protection is required again (or at least `SameSite=Strict/Lax` cookies plus origin checks).

### Other defences

- **SameSite cookies** (`Lax` is the default in modern browsers): cookies are not sent on cross-site POSTs — strong mitigation, but not a full replacement (subdomains count as same-site; older browsers).
- Checking `Origin`/`Referer` headers.
- Re-authentication for critical actions.

## CSRF vs CORS

| Aspect | CSRF | CORS |
|--------|------|------|
| What it is | An **attack** | A **browser mechanism** (relaxes same-origin policy) |
| Problem | Browser sends authenticated requests on behalf of the user | Browser blocks cross-origin reads by default |
| Exploits / controls | Automatic cookie sending | Which origins may read responses |
| Defence / configuration | CSRF tokens, SameSite cookies, header-based auth | `Access-Control-Allow-*` headers |
| Attacker needs the response? | No | — |
| Relevant when | Authentication via cookies | Front end and API on different origins |
| Spring | `CsrfFilter`, `http.csrf(...)` | `CorsFilter`, `http.cors(...)` |
| Does one solve the other? | No | No |

## Common Mistakes

- Disabling CSRF in a session-based web app because "POST returns 403".
- Storing the JWT in a cookie and disabling CSRF anyway.
- State-changing GET endpoints (CSRF tokens do not protect GET).
- Thinking a restrictive CORS policy prevents CSRF.

## Common Interview Traps

- **"CSRF and CORS are the same problem."** One is an attack on cookie-based auth; the other is a mechanism for cross-origin reads.
- **"JWT APIs are immune to CSRF."** Only when the token is sent in a header, not a cookie.
- **"CSRF lets the attacker read data."** CSRF performs actions; reading requires other flaws (XSS, CORS misconfiguration).

## Key Takeaways

- CSRF = forged state-changing request riding on automatically sent cookies.
- Spring Security requires a CSRF token on POST/PUT/PATCH/DELETE by default; forms and SPAs echo it back.
- Disable only for header-token stateless APIs; use SameSite cookies as defence in depth.
- CSRF ≠ CORS.
