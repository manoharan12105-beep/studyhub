# CORS, Same-Origin Policy and Preflight

**Module:** CORS, CSRF and Web Security · **Interview priority:** Core

## Definition

- The **same-origin policy (SOP)** is a browser rule: JavaScript on a page may read responses only from the **same origin** — same **scheme + host + port**. `https://shop.example.com` and `https://api.example.com` are different origins.
- **CORS (Cross-Origin Resource Sharing)** is the standard mechanism by which a **server** tells browsers which other origins may read its responses, using `Access-Control-*` response headers.
- A **preflight request** is an automatic `OPTIONS` request the browser sends before certain cross-origin requests to ask the server for permission.

## Why It Matters

- A React/Angular front end on one origin calling a Spring Boot API on another fails with "blocked by CORS policy" until CORS is configured — a daily issue in full-stack projects.
- Misconfigured CORS (wildcards with credentials, reflecting any origin) is a security vulnerability.
- "CORS vs CSRF" is a classic comparison.

## Same-Origin Policy

| URL A | URL B | Same origin? |
|-------|-------|-------------|
| `https://shop.example.com` | `https://shop.example.com/cart` | Yes (path doesn't matter) |
| `https://shop.example.com` | `http://shop.example.com` | No (scheme) |
| `https://shop.example.com` | `https://api.example.com` | No (host) |
| `http://localhost:3000` | `http://localhost:8080` | No (port) |

SOP is enforced **by browsers**. It does not stop the request from being sent in all cases, and it does not apply to server-to-server calls, Postman or curl — which is why "it works in Postman but not in the browser" is the classic CORS symptom.

## CORS

For a cross-origin request, the browser adds `Origin: https://shop.example.com`. The server answers with:

| Response header | Meaning |
|-----------------|---------|
| `Access-Control-Allow-Origin` | The allowed origin (exact) or `*` |
| `Access-Control-Allow-Methods` | Allowed methods (preflight) |
| `Access-Control-Allow-Headers` | Allowed request headers (preflight) |
| `Access-Control-Allow-Credentials: true` | Browser may send cookies/HTTP auth and expose the response |
| `Access-Control-Expose-Headers` | Response headers JS may read (e.g. `Location`, `X-Total-Count`) |
| `Access-Control-Max-Age` | Seconds the preflight result may be cached |

If the headers do not allow the origin, the browser **blocks JavaScript from reading the response** (and for preflighted requests, does not send the actual request).

CORS **relaxes** SOP; it is not a protection for your API. Clients that are not browsers ignore it entirely — authentication and authorization still protect the API.

## Preflight Request

**Simple requests** (GET/HEAD/POST with only "safe" headers and a `Content-Type` of `text/plain`, `multipart/form-data` or `application/x-www-form-urlencoded`) are sent directly. Anything else — `PUT`/`PATCH`/`DELETE`, `Content-Type: application/json`, an `Authorization` header — triggers a preflight:

```http
OPTIONS /api/products HTTP/1.1
Origin: https://shop.example.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: Authorization, Content-Type

HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://shop.example.com
Access-Control-Allow-Methods: GET,POST,PUT,DELETE
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 3600
```

Only if the preflight succeeds does the browser send the real `PUT`.

## OPTIONS

The HTTP method used for preflight. Preflight requests **carry no credentials** (no `Authorization` header, no cookies). If your security configuration requires authentication for `OPTIONS` requests, the preflight fails with 401/403 and the browser reports a CORS error — the most common Spring Security + CORS bug. Spring Security's `.cors()` places `CorsFilter` early in the chain so preflights are answered before authentication.

## How It Works (Spring)

Configure CORS **in Spring Security** when security is present (so preflight is handled before authentication), using a `CorsConfigurationSource` bean:

```java
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;

import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.RequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

public class CorsDemo {

    @Configuration
    @EnableWebMvc
    @EnableWebSecurity
    static class Config {

        @Bean
        CorsConfigurationSource corsConfigurationSource() {
            CorsConfiguration cors = new CorsConfiguration();
            cors.setAllowedOrigins(List.of("https://shop.example.com"));        // exact origins, no "*"
            cors.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
            cors.setAllowedHeaders(List.of("Authorization", "Content-Type"));
            cors.setAllowCredentials(true);
            cors.setMaxAge(3600L);                                              // cache preflight for 1 hour
            UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
            source.registerCorsConfiguration("/api/**", cors);
            return source;
        }

        @Bean
        SecurityFilterChain api(HttpSecurity http) throws Exception {
            return http
                    .cors(Customizer.withDefaults())                 // uses the CorsConfigurationSource bean
                    .csrf(csrf -> csrf.disable())
                    .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                    .httpBasic(Customizer.withDefaults())
                    .build();
        }

        @Bean
        ProductController productController() {
            return new ProductController();
        }
    }

    @RestController
    static class ProductController {
        @GetMapping("/api/products")
        String products() {
            return "[\"keyboard\"]";
        }
    }

    static void show(MockMvc mvc, String label, RequestBuilder request) throws Exception {
        MockHttpServletResponse r = mvc.perform(request).andReturn().getResponse();
        System.out.println(label + " -> " + r.getStatus()
                + ", Access-Control-Allow-Origin=" + r.getHeader("Access-Control-Allow-Origin")
                + ", Allow-Methods=" + r.getHeader("Access-Control-Allow-Methods"));
    }

    public static void main(String[] args) throws Exception {
        AnnotationConfigWebApplicationContext context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        context.register(Config.class);
        context.refresh();
        MockMvc mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        show(mvc, "preflight from allowed origin ", options("/api/products")
                .header("Origin", "https://shop.example.com")
                .header("Access-Control-Request-Method", "PUT")
                .header("Access-Control-Request-Headers", "Authorization"));
        show(mvc, "preflight from unknown origin ", options("/api/products")
                .header("Origin", "https://evil.example.net")
                .header("Access-Control-Request-Method", "PUT"));
        show(mvc, "GET from allowed origin, no auth", get("/api/products")
                .header("Origin", "https://shop.example.com"));
        context.close();
    }
}
```

**Output:**

```text
preflight from allowed origin  -> 200, Access-Control-Allow-Origin=https://shop.example.com, Allow-Methods=GET,POST,PUT,DELETE
preflight from unknown origin  -> 403, Access-Control-Allow-Origin=null, Allow-Methods=null
GET from allowed origin, no auth -> 401, Access-Control-Allow-Origin=https://shop.example.com, Allow-Methods=null
```

- The allowed preflight succeeded **without credentials** — `CorsFilter` answered it before authentication.
- The unknown origin was rejected with no CORS headers.
- The real `GET` without credentials got 401, but still with CORS headers, so the front end can read the 401 and redirect to login.

Other ways to configure CORS (without Spring Security, or per endpoint):

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
class WebCorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {                // global, Spring MVC level
        registry.addMapping("/api/**")
                .allowedOrigins("https://shop.example.com")
                .allowedMethods("GET", "POST", "PUT", "DELETE");
    }
}

@RestController
class StatusController {
    @CrossOrigin(origins = "https://partner.example.org")              // per controller / method
    @GetMapping("/api/status")
    String status() {
        return "ok";
    }
}
```

With Spring Security, `.cors(Customizer.withDefaults())` also picks up the Spring MVC CORS configuration if no `CorsConfigurationSource` bean exists.

## Common Mistakes

- `allowedOrigins("*")` with `allowCredentials(true)` — invalid per the CORS spec; Spring rejects it at request time with an `IllegalArgumentException`. Use explicit origins or `allowedOriginPatterns("https://*.example.com")`.
- Configuring CORS only in Spring MVC while Spring Security rejects the unauthenticated `OPTIONS` preflight.
- Reflecting any `Origin` back with credentials (lets any website read authenticated responses).
- Forgetting `exposedHeaders` — the front end cannot read `Location` or custom headers.
- Expecting CORS to block Postman/curl or to protect the API.

## Common Interview Traps

- **"CORS protects my API from other websites."** It is a browser read-permission mechanism; non-browser clients ignore it, and requests may still reach the server.
- **"CORS errors are server errors."** The browser blocks the response; the server may have processed the request.
- **"`*` is fine everywhere."** Not with credentials, and rarely appropriate for authenticated APIs.

## Key Takeaways

- Origin = scheme + host + port; SOP blocks cross-origin reads in browsers; CORS headers relax it.
- Non-simple requests trigger an `OPTIONS` preflight without credentials — allow it before authentication.
- In Spring Boot with security: `CorsConfigurationSource` bean + `http.cors(withDefaults())`; explicit origins; no `*` with credentials.
