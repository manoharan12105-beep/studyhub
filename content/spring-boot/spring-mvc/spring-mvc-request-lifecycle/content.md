# Request Lifecycle: DispatcherServlet to Response

**Module:** Spring MVC · **Interview priority:** Core

## Definition

The **request lifecycle** is the path an HTTP request takes through a Spring Boot application: the servlet container accepts the connection and runs the **filter chain**, the **`DispatcherServlet`** finds a handler through a **`HandlerMapping`**, runs **interceptors**, invokes the controller through a **`HandlerAdapter`** (which resolves arguments, validates and converts the body), the controller calls the **service**, **repository** and **database**, and the return value is converted by an **`HttpMessageConverter`** into the response. Exceptions at any step are turned into error responses by **`HandlerExceptionResolver`s**.

## Why It Matters

- "Explain what happens when a request hits your Spring Boot API" is a top-five Spring interview question.
- The lifecycle explains where each feature lives: security (filters), logging/auth checks (filters or interceptors), validation (argument resolution), JSON (message converters), error handling (exception resolvers).
- Debugging 400/401/403/404/415 errors requires knowing which step produced them.

## Request Lifecycle

```text
Client
  │  HTTP request: POST /api/orders  (Content-Type: application/json, Authorization: Bearer …)
  ▼
Servlet container (embedded Tomcat)
  │  1. Accept connection, parse HTTP, create HttpServletRequest/Response, take a worker thread
  ▼
Filter chain (jakarta.servlet.Filter)
  │  2. e.g. CharacterEncodingFilter, Spring Security's FilterChainProxy (authentication,
  │     authorization, CORS, CSRF), your logging/correlation-id filters
  ▼
DispatcherServlet.doDispatch()
  │  3. HandlerMapping → HandlerExecutionChain (controller method + interceptors)
  │     – no match → 404 (NoResourceFoundException / NoHandlerFoundException)
  │  4. HandlerAdapter chosen (RequestMappingHandlerAdapter)
  │  5. Interceptors: preHandle()  – may stop the request by returning false
  │  6. Argument resolution: @PathVariable, @RequestParam, @RequestHeader,
  │     @RequestBody → HttpMessageConverter reads JSON (Content-Type checked → 415)
  │     @Valid → Bean Validation (failure → MethodArgumentNotValidException → 400)
  │  7. Invoke controller method
  ▼
Controller → Service (@Transactional proxy: begin transaction)
              → Repository (Spring Data proxy) → Hibernate → JDBC → Database
              ← entities ← rows
           ← DTO (transaction commits when the service method returns)
  ▼
DispatcherServlet (continued)
  │  8. Return value handling: @ResponseBody / ResponseEntity →
  │     content negotiation (Accept header, produces) → HttpMessageConverter writes JSON (406 if impossible)
  │  9. Interceptors: postHandle() (response body may already be written)
  │ 10. Exceptions from steps 3–9 → HandlerExceptionResolvers
  │     (@ExceptionHandler/@ControllerAdvice → @ResponseStatus → default Spring MVC mappings)
  │ 11. Interceptors: afterCompletion() (always, for cleanup)
  ▼
Filter chain unwinds (code after chain.doFilter runs)
  ▼
Servlet container writes the HTTP response; thread returns to the pool
  ▼
Client receives: 201 Created, Location header, JSON body
```

## HandlerMapping

A `HandlerMapping` maps a request to a **handler** plus the interceptors that apply. `RequestMappingHandlerMapping` builds, at startup, a registry of every `@RequestMapping` method keyed by path pattern, HTTP method, `consumes`/`produces`, params and headers. At request time it picks the **most specific** match.

- Path matches but method does not → **405 Method Not Allowed**.
- `consumes` does not match `Content-Type` → **415 Unsupported Media Type**.
- `produces` cannot satisfy `Accept` → **406 Not Acceptable**.
- Nothing matches → **404**.

Other mappings exist for static resources (`/static/**`) and functional routes.

## HandlerAdapter

The `DispatcherServlet` does not know how to call a handler; a `HandlerAdapter` does. For annotated controllers, `RequestMappingHandlerAdapter`:

1. Resolves every method argument with the list of **`HandlerMethodArgumentResolver`s**.
2. Runs data binding and validation where requested.
3. Invokes the method (through the bean, which may be a proxy).
4. Passes the return value to the **`HandlerMethodReturnValueHandler`s**.

This indirection is why Spring MVC can support very different handler types (annotated methods, `HttpRequestHandler`, functional endpoints).

## Argument Resolvers

Each parameter of a controller method is produced by the first resolver that supports it:

| Parameter | Resolver |
|-----------|----------|
| `@PathVariable` | `PathVariableMethodArgumentResolver` |
| `@RequestParam` | `RequestParamMethodArgumentResolver` |
| `@RequestBody` | `RequestResponseBodyMethodProcessor` (uses `HttpMessageConverter`s; runs `@Valid`) |
| `@RequestHeader` | `RequestHeaderMethodArgumentResolver` |
| `Pageable` | `PageableHandlerMethodArgumentResolver` (Spring Data) |
| `@AuthenticationPrincipal` | `AuthenticationPrincipalArgumentResolver` (Spring Security) |
| `HttpServletRequest`, `Principal`, `Locale` | `ServletRequestMethodArgumentResolver` |

You can add your own — for example to inject a `ClientInfo` built from headers into any controller method. It is registered through `WebMvcConfigurer.addArgumentResolvers` (shown in the demo below via MockMvc).

## Response Handling

For `@RestController` methods, `RequestResponseBodyMethodProcessor` handles the return value: it performs **content negotiation** (the client's `Accept` header against what converters can produce) and writes the body with the chosen **`HttpMessageConverter`** — Jackson for JSON. `ResponseEntity` additionally sets status and headers. Details in [Response Handling and ResponseEntity](../response-handling/content.md).

## How It Works

The program below runs one request through a filter, an interceptor, a custom argument resolver and a controller using `MockMvc`, which drives a real `DispatcherServlet` without starting a server. Each component records when it runs.

```java
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.ArrayList;
import java.util.List;
import org.springframework.core.MethodParameter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.servlet.HandlerInterceptor;

public class RequestLifecycleDemo {

    static final List<String> TRACE = new ArrayList<>();

    record ClientInfo(String client) {
    }

    static class TraceFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                        FilterChain chain) throws java.io.IOException, jakarta.servlet.ServletException {
            TRACE.add("filter: before");
            chain.doFilter(request, response);
            TRACE.add("filter: after");
        }
    }

    static class TraceInterceptor implements HandlerInterceptor {
        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
            TRACE.add("interceptor: preHandle");
            return true;
        }

        @Override
        public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler,
                               org.springframework.web.servlet.ModelAndView modelAndView) {
            TRACE.add("interceptor: postHandle");
        }

        @Override
        public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler,
                                    Exception ex) {
            TRACE.add("interceptor: afterCompletion");
        }
    }

    static class ClientInfoResolver implements HandlerMethodArgumentResolver {
        @Override
        public boolean supportsParameter(MethodParameter parameter) {
            return parameter.getParameterType() == ClientInfo.class;
        }

        @Override
        public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mav,
                                      NativeWebRequest request, WebDataBinderFactory binderFactory) {
            TRACE.add("argument resolver: ClientInfo");
            String client = request.getHeader("X-Client");
            return new ClientInfo(client == null ? "unknown" : client);
        }
    }

    @RestController
    static class OrderController {
        @GetMapping("/orders/{id}")
        String get(@PathVariable long id, ClientInfo clientInfo) {
            TRACE.add("controller: id=" + id + ", client=" + clientInfo.client());
            return "order " + id;
        }
    }

    public static void main(String[] args) throws Exception {
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new OrderController())
                .addFilters(new TraceFilter())
                .addInterceptors(new TraceInterceptor())
                .setCustomArgumentResolvers(new ClientInfoResolver())
                .build();

        String body = mvc.perform(get("/orders/42").header("X-Client", "android"))
                .andReturn().getResponse().getContentAsString();

        TRACE.forEach(System.out::println);
        System.out.println("response body: " + body);
    }
}
```

**Output:**

```text
filter: before
interceptor: preHandle
argument resolver: ClientInfo
controller: id=42, client=android
interceptor: postHandle
interceptor: afterCompletion
filter: after
response body: order 42
```

## Internal Behavior

- **Thread model:** in Spring MVC the same thread runs the filters, the controller, the service, the repository call and the response writing. That is why `ThreadLocal`-based context works: `SecurityContextHolder`, `RequestContextHolder`, `TransactionSynchronizationManager`, MDC logging. Moving work to another thread (`@Async`, `CompletableFuture`) loses that context unless it is propagated.
- **Security runs before the `DispatcherServlet`.** Spring Security is a filter (`FilterChainProxy` via `DelegatingFilterProxy`), so unauthenticated requests get 401/403 without reaching controllers — and `@ControllerAdvice` cannot handle exceptions thrown there.
- **Validation is part of argument resolution.** `@Valid @RequestBody` fails before the controller body executes.
- **Transactions start in the service proxy**, not at the request: the database connection is borrowed when the transactional method starts and returned when it commits (unless Open Session in View keeps the persistence context open — see [Fetching and Lazy Loading](../../jpa-hibernate/fetching-and-lazy-loading/content.md)).
- **`postHandle` and `@ResponseBody`:** the body is written during return value handling, before `postHandle`, so `postHandle` cannot change a JSON response — use a `ResponseBodyAdvice` or a filter instead.

## Comparison

| Error | Produced at step | Typical cause |
|-------|------------------|---------------|
| 401 / 403 | Filter chain (Spring Security) | Missing/invalid token; insufficient role |
| 404 | Handler mapping | Wrong path, wrong context path |
| 405 | Handler mapping | Wrong HTTP method |
| 415 | Handler mapping / argument resolution | `Content-Type` not `application/json` |
| 400 | Argument resolution | Malformed JSON, type mismatch, `@Valid` failure |
| 406 | Return value handling | `Accept` asks for a type no converter can produce |
| 500 | Anywhere | Unhandled exception |

## Common Mistakes

- Expecting `@ControllerAdvice` to handle exceptions from filters (including JWT filters).
- Modifying a JSON response in `postHandle`.
- Doing database work inside a filter or interceptor for every request without need.
- Assuming the request thread's context (security, MDC) exists in `@Async` code.

## Common Interview Traps

- **"The request goes Controller → DispatcherServlet."** The `DispatcherServlet` comes first and calls the controller.
- **"Interceptors run before filters."** Filters wrap the whole `DispatcherServlet`; interceptors run inside it.
- **"Validation happens in the service."** `@Valid` on controller arguments runs during argument resolution, before the controller method body.

## Key Takeaways

- Container → filters → `DispatcherServlet` → `HandlerMapping` → interceptors `preHandle` → argument resolvers (+ message conversion, validation) → controller → service → repository → DB → return value handling (message converter) → `postHandle` → `afterCompletion` → filters unwind.
- Errors map to specific steps: 401/403 filters, 404/405 mapping, 400/415 argument resolution, 406 response conversion.
- One thread per request, so thread-local context flows through the whole call.
