# Spring MVC and the Layered Architecture

**Module:** Spring MVC · **Interview priority:** Core

## Definition

**Spring MVC** is Spring Framework's servlet-based web framework. All HTTP requests go to one servlet, the **`DispatcherServlet`** (a *front controller*), which finds the right **controller** method, converts request data into method arguments, invokes it, and turns the return value into an HTTP response. In a Spring Boot REST service, the controller is the entry point of a **layered architecture**: Controller → Service → Repository → Database.

## Why It Matters

- Every `@RestController` you write runs inside Spring MVC; interviewers expect you to explain what happens between the HTTP request and your method.
- Clear layer responsibilities are a common project-discussion topic ("Where do you put validation? transactions? mapping?").

## Spring MVC

Spring MVC provides:

- **Request mapping** — `@RequestMapping`, `@GetMapping`, `@PostMapping`… map URL + HTTP method (+ headers, content types) to handler methods.
- **Argument binding** — `@PathVariable`, `@RequestParam`, `@RequestBody`, `@RequestHeader`, `Pageable`, `Principal`…
- **Response conversion** — `HttpMessageConverter`s write return values as JSON/XML; `ResponseEntity` controls status and headers.
- **Validation** — `@Valid` on arguments.
- **Exception handling** — `@ExceptionHandler`, `@ControllerAdvice`.
- **Extension points** — interceptors, argument resolvers, message converters, CORS, view resolution.

Spring MVC is **blocking**: one request uses one thread (a platform thread or, with Java 21, a virtual thread) for its whole duration. The non-blocking alternative is **Spring WebFlux**.

## MVC Architecture

The classic **Model–View–Controller** pattern:

| Part | Responsibility | In a REST API |
|------|----------------|---------------|
| Model | Data passed to the view | The DTO returned by the controller |
| View | Renders the model (HTML) | JSON serialisation by an `HttpMessageConverter` — no template |
| Controller | Handles input, calls business logic, chooses model/view | `@RestController` methods |

For server-rendered pages, a controller returns a view name (`"orders"`) and a `Model`; a `ViewResolver` finds the template (Thymeleaf). For REST, `@ResponseBody` replaces the view: the return value *is* the response body.

## DispatcherServlet

The `DispatcherServlet` is the **front controller**: a single servlet registered for `/` that receives every request and delegates to specialised components.

```text
                 ┌──────────────────────── DispatcherServlet ───────────────────────┐
HTTP request ──► │ HandlerMapping ──► HandlerAdapter ──► Controller method           │
                 │       │                 │ argument resolvers / message converters │
                 │       ▼                 ▼                                         │
                 │  Interceptors     Return value handlers ──► HttpMessageConverter  │──► HTTP response
                 │                   HandlerExceptionResolvers (on errors)           │
                 └───────────────────────────────────────────────────────────────────┘
```

| Component | Job | Default implementation for annotated controllers |
|-----------|-----|---------------------------------------------------|
| `HandlerMapping` | Find the handler for a request | `RequestMappingHandlerMapping` |
| `HandlerAdapter` | Invoke the handler, whatever its type | `RequestMappingHandlerAdapter` |
| `HandlerMethodArgumentResolver` | Produce each method argument | e.g. `RequestResponseBodyMethodProcessor` for `@RequestBody` |
| `HandlerMethodReturnValueHandler` | Process the return value | e.g. `RequestResponseBodyMethodProcessor` for `@ResponseBody` |
| `HttpMessageConverter` | Read/write bodies | Jackson JSON converter |
| `HandlerExceptionResolver` | Turn exceptions into responses | `ExceptionHandlerExceptionResolver`, `ResponseStatusExceptionResolver`, `DefaultHandlerExceptionResolver` |
| `ViewResolver` | Resolve view names (server-side rendering) | Thymeleaf, etc. |

Spring Boot registers `DispatcherServlet` automatically (`DispatcherServletAutoConfiguration`) and configures these components (`WebMvcAutoConfiguration`). The full step-by-step flow is in [Request Lifecycle](../spring-mvc-request-lifecycle/content.md).

## Controller

The web layer's job is **HTTP translation**, not business logic:

```java
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

record CreateProductRequest(@NotBlank String name, @Min(1) long pricePaise) {
}

record ProductResponse(long id, String name, long pricePaise) {
}

interface ProductService {
    ProductResponse create(CreateProductRequest request);

    ProductResponse findById(long id);
}

@RestController
@RequestMapping("/api/products")
class ProductController {
    private final ProductService productService;

    ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    ResponseEntity<ProductResponse> create(@Valid @RequestBody CreateProductRequest request) {
        ProductResponse created = productService.create(request);
        return ResponseEntity.created(URI.create("/api/products/" + created.id())).body(created);
    }

    @GetMapping("/{id}")
    ProductResponse get(@PathVariable long id) {
        return productService.findById(id);
    }
}
```

## Service

The service layer holds **business rules** and defines **transaction boundaries**:

- Validates business invariants (stock available, user allowed to cancel).
- Coordinates repositories and other services.
- Carries `@Transactional` — one use case = one transaction.
- Maps entities to DTOs (or delegates to a mapper), so controllers never see entities.

## Repository

The repository layer handles **persistence only**: Spring Data JPA interfaces (`JpaRepository<Product, Long>`) with derived queries, `@Query` methods and projections. No business rules, no HTTP concepts.

### Layer responsibilities

| Layer | Does | Does not |
|-------|------|----------|
| Controller | Map URLs, bind and validate input, choose status codes, call one service method | Business rules, transactions, entity access |
| Service | Business logic, transactions, orchestration, entity ↔ DTO mapping | Know about HTTP (`HttpServletRequest`, `ResponseEntity`) |
| Repository | Queries and persistence | Business decisions |

Typical package structures: **by layer** (`controller/`, `service/`, `repository/`) for small apps, or **by feature** (`order/`, `product/`, each containing its controller, service, repository) for larger ones — feature packaging keeps related code together and scales better.

## Common Mistakes

- Business logic or repository calls directly in controllers ("fat controllers").
- Returning JPA entities from controllers (lazy-loading errors, leaking fields, tight coupling) — use DTOs.
- `@Transactional` on controllers instead of services.
- Services depending on web types such as `HttpServletRequest`.

## Common Interview Traps

- **"DispatcherServlet is created by Spring Boot only."** It is a Spring Framework class; Boot registers it automatically.
- **"In REST, there is no View in MVC."** The view's role is played by message conversion (JSON serialisation).
- **"Each controller is a servlet."** There is one `DispatcherServlet`; controllers are plain beans it delegates to.

## Key Takeaways

- Spring MVC = front controller (`DispatcherServlet`) + handler mapping + handler adapter + argument/return-value processing + exception resolvers.
- Controller (HTTP) → Service (business, transactions) → Repository (persistence) → DB.
- Controllers translate HTTP; services decide; repositories persist.
