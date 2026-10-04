# Filters and Interceptors

**Module:** Spring MVC · **Interview priority:** Frequently asked

## Definition

- A **filter** (`jakarta.servlet.Filter`) is a Servlet API component that wraps request processing **in the servlet container**, before and after the `DispatcherServlet`. It sees every request, including those that never reach Spring MVC (static resources, errors, unknown URLs).
- An **interceptor** (`org.springframework.web.servlet.HandlerInterceptor`) is a Spring MVC component that runs **inside the `DispatcherServlet`**, around the execution of a selected handler. It knows which controller method will handle the request.

## Why It Matters

- "Filter vs Interceptor" is one of the most common Spring MVC interview comparisons.
- Choosing the wrong one causes bugs: authentication in an interceptor runs too late for Spring Security; body logging in an interceptor cannot see the JSON response.
- Spring Security itself is a filter chain, so understanding filters is a prerequisite for JWT authentication.

## Filters

```java
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)               // run before other filters (including Spring Security)
public class CorrelationIdFilter extends OncePerRequestFilter {

    private static final String HEADER = "X-Correlation-Id";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String id = request.getHeader(HEADER);
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
        MDC.put("correlationId", id);                // appears in every log line of this request
        response.setHeader(HEADER, id);
        try {
            chain.doFilter(request, response);       // continue to the next filter / DispatcherServlet
        } finally {
            MDC.remove("correlationId");             // threads are pooled: always clean up
        }
    }
}
```

- `OncePerRequestFilter` guarantees one execution per request even when the request is forwarded or dispatched again (error dispatch, async).
- In Spring Boot, a `Filter` **bean is registered automatically** for all URLs. For URL patterns or explicit ordering, register it with a `FilterRegistrationBean` instead (and do not make it a `@Component`).
- A filter can stop processing by not calling `chain.doFilter` and writing the response itself (e.g. 429 for rate limiting).
- Filters can wrap the request/response (e.g. `ContentCachingRequestWrapper`) to read bodies.

## Interceptors

```java
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

class TimingInterceptor implements HandlerInterceptor {
    private static final Logger log = LoggerFactory.getLogger(TimingInterceptor.class);

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        request.setAttribute("start", System.nanoTime());
        return true;                                   // false = stop; the handler is not called
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        long tookMs = (System.nanoTime() - (long) request.getAttribute("start")) / 1_000_000;
        String target = handler instanceof HandlerMethod hm
                ? hm.getBeanType().getSimpleName() + "." + hm.getMethod().getName()
                : handler.toString();
        log.info("{} {} -> {} ({} ms, status {})", request.getMethod(), request.getRequestURI(),
                target, tookMs, response.getStatus());
    }
}

@Configuration
class WebConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new TimingInterceptor())
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/health");
    }
}
```

| Method | When | Typical use |
|--------|------|-------------|
| `preHandle` | After handler selection, before argument resolution | Checks needing the handler (annotations on the method), timing start, locale |
| `postHandle` | After the handler returns, before view rendering; **not** called on exceptions | Adding model attributes for views (not useful for `@ResponseBody`) |
| `afterCompletion` | Always, after the response is complete (also on exceptions) | Cleanup, timing, metrics |

## How It Works

```text
Tomcat ─► Filter 1 ─► Filter 2 (Spring Security FilterChainProxy) ─► … ─► DispatcherServlet
                                                                             │ HandlerMapping
                                                                             │ Interceptor.preHandle
                                                                             │ Controller
                                                                             │ Interceptor.postHandle
                                                                             │ (render / write body)
                                                                             │ Interceptor.afterCompletion
Tomcat ◄─ Filter 1 ◄─ Filter 2 ◄──────────────────────────────────────────── ┘
```

The ordering is demonstrated by a runnable `MockMvc` program in [Request Lifecycle](../spring-mvc-request-lifecycle/content.md#how-it-works).

## Comparison

| Aspect | Filter | Interceptor |
|--------|--------|-------------|
| API | Servlet (`jakarta.servlet.Filter`) | Spring MVC (`HandlerInterceptor`) |
| Runs | Before/after the `DispatcherServlet` | Inside it, around the handler |
| Sees | All requests (static files, errors, 404s) | Only requests mapped to a handler |
| Knows the handler (controller method, annotations) | No | Yes (`HandlerMethod`) |
| Can replace request/response objects | Yes (wrappers) | No |
| Access to Spring beans | Yes if it is a bean | Yes |
| Exception handling by `@ControllerAdvice` | No | Exceptions from `preHandle` — yes (inside dispatch) |
| Typical uses | Security, CORS, correlation ids, compression, request/response logging, rate limiting | Per-handler checks, timing, locale, auditing based on annotations |
| Registration in Boot | Bean (auto, all URLs) or `FilterRegistrationBean` | `WebMvcConfigurer.addInterceptors` |

Rule of thumb: **generic HTTP concerns → filter; concerns that need to know the controller method → interceptor; business cross-cutting concerns → AOP on services.**

## Common Mistakes

- Annotating a filter with `@Component` **and** adding it to the Spring Security chain — it runs twice (once as a servlet filter, once in the security chain). Disable the servlet registration with a `FilterRegistrationBean` (`setEnabled(false)`) or do not make it a bean.
- Forgetting to call `chain.doFilter` — the request silently hangs or returns an empty 200.
- Not clearing `ThreadLocal`/MDC values in a `finally` block — values leak into the next request on the same pooled thread.
- Reading the request body in a filter without a caching wrapper — the controller then sees an empty body.
- Trying to modify a JSON response in `postHandle`.

## Common Interview Traps

- **"Interceptors are Spring's name for filters."** They are different APIs at different layers.
- **"Spring Security uses interceptors."** Web security is a servlet **filter** chain; method security uses AOP.
- **"`postHandle` always runs."** Not when the handler throws; `afterCompletion` does.

## Key Takeaways

- Filters: Servlet level, all requests, can wrap request/response, run before Spring MVC (security lives here).
- Interceptors: Spring MVC level, know the handler, `preHandle`/`postHandle`/`afterCompletion`.
- Clean up thread-local state; avoid double registration of filter beans.
