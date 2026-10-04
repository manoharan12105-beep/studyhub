# Filters and Interceptors — Practice

### P1. Choose the component

**Difficulty:** Easy · **Type:** MCQ

You need to add an `X-Correlation-Id` header to **every** response, including 404s for unknown URLs and static files. Which component fits?

- A) `HandlerInterceptor.preHandle`
- B) A servlet filter
- C) `@ControllerAdvice`
- D) An AOP aspect on services

<details>
<summary>Answer</summary>

**Answer:** B) A servlet filter

**Explanation:** Only filters see every request, including those that never reach a handler.

</details>

### P2. Leaking MDC

**Difficulty:** Medium · **Type:** Debugging

Log lines of some requests show another request's `userId` in MDC. The filter sets `MDC.put("userId", …)` before `chain.doFilter` and never removes it. Explain.

<details>
<summary>Answer</summary>

MDC is thread-local and Tomcat reuses pooled threads. Without `MDC.remove` (or `MDC.clear`) in a `finally` block, the value stays on the thread and appears in logs of the next request that does not set it (for example unauthenticated requests).

</details>

### P3. Annotation-driven check

**Difficulty:** Medium · **Type:** Coding

Write an interceptor that rejects requests with 403 when the controller method is annotated with a custom `@AdminOnly` and the header `X-Role` is not `ADMIN`. (In real applications use Spring Security; this is an interceptor exercise.)

<details>
<summary>Answer</summary>

```java
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@interface AdminOnly {
}

class AdminOnlyInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (handler instanceof HandlerMethod method
                && method.hasMethodAnnotation(AdminOnly.class)
                && !"ADMIN".equals(request.getHeader("X-Role"))) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            return false;                        // handler is not invoked
        }
        return true;
    }
}
```

Only an interceptor can see the `HandlerMethod` and its annotations.

</details>

### P4. Empty body

**Difficulty:** Hard · **Type:** Debugging

A logging filter calls `request.getInputStream().readAllBytes()` to log the JSON body. Afterwards, every POST fails with 400 "Required request body is missing". Why, and how do you fix it?

<details>
<summary>Answer</summary>

The servlet input stream can be read only once; the filter consumed it, so the message converter finds nothing. Wrap the request in `ContentCachingRequestWrapper`, pass the wrapper down the chain, and log `getContentAsByteArray()` after `chain.doFilter` (the content is cached as the controller reads it).

</details>
