# Response Handling and ResponseEntity

**Module:** Spring MVC · **Interview priority:** Core

## Definition

**Response handling** is how Spring MVC turns a controller's return value into an HTTP response: status code, headers and body. With `@ResponseBody` (implied by `@RestController`), the return value is serialised by an **`HttpMessageConverter`** chosen through **content negotiation**. **`ResponseEntity<T>`** is a return type that represents the whole response — status, headers and body — so the controller can control all three explicitly.

## Why It Matters

- Correct status codes and headers (201 + `Location`, 204, 409) are part of a good REST API and of REST interview answers.
- Understanding message converters explains JSON naming, date formats, 406 errors and infinite-recursion errors when serialising entities.

## Response Handling

| Controller returns | What the client receives |
|--------------------|--------------------------|
| A DTO / record / `List` | 200 OK, body serialised to JSON |
| `void` | 200 OK, empty body (or the status set by `@ResponseStatus`) |
| `ResponseEntity<T>` | Exactly the status, headers and body you built |
| `@ResponseStatus(HttpStatus.CREATED)` on the method + DTO | 201 with JSON body |
| `ProblemDetail` / `ErrorResponse` | RFC 9457 error body with its status |
| `String` in a `@RestController` | Plain text (`StringHttpMessageConverter`), not JSON |

### HttpMessageConverter

Converters read request bodies (`@RequestBody`) and write response bodies:

| Converter | Handles |
|-----------|---------|
| Jackson JSON converter (`JacksonJsonHttpMessageConverter` in Boot 4; `MappingJackson2HttpMessageConverter` in Boot 3) | Objects ↔ `application/json` |
| `StringHttpMessageConverter` | `String` ↔ `text/plain` |
| `ByteArrayHttpMessageConverter` | `byte[]` |
| `ResourceHttpMessageConverter` | `Resource` (file downloads) |
| Jackson XML converter (if on classpath) | `application/xml` |

Jackson behaviour (property naming, dates, null handling) is configured with `spring.jackson.*` properties or customizer beans — not by replacing the mapper.

### Content negotiation

1. Determine acceptable types from the request's `Accept` header (missing → `*/*`).
2. Determine producible types: the mapping's `produces` attribute, or what converters can write for the return type.
3. Pick the most specific compatible type; none → **406 Not Acceptable**.

## ResponseEntity

```java
import java.net.URI;
import java.util.List;
import java.util.Optional;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

record ProductDto(Long id, String name) {
}

interface CatalogService {
    ProductDto create(ProductDto product);

    Optional<ProductDto> find(long id);

    boolean delete(long id);

    List<ProductDto> all();
}

@RestController
@RequestMapping("/api/products")
class CatalogController {
    private final CatalogService service;

    CatalogController(CatalogService service) {
        this.service = service;
    }

    @PostMapping
    ResponseEntity<ProductDto> create(@RequestBody ProductDto request) {
        ProductDto created = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);           // 201 + Location header
    }

    @GetMapping("/{id}")
    ResponseEntity<ProductDto> get(@PathVariable long id) {
        return ResponseEntity.of(service.find(id));                       // 200 with body, or 404
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable long id) {
        return service.delete(id)
                ? ResponseEntity.noContent().build()                     // 204
                : ResponseEntity.notFound().build();                     // 404
    }

    @GetMapping
    ResponseEntity<List<ProductDto>> list() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofMinutes(5)))
                .header("X-Total-Count", String.valueOf(service.all().size()))
                .body(service.all());
    }

    @PostMapping("/import")
    ResponseEntity<Void> importCatalog() {
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();       // 202: processing later
    }
}
```

Builders worth remembering: `ok()`, `created(uri)`, `accepted()`, `noContent()`, `badRequest()`, `notFound()`, `unprocessableEntity()`, `status(...)`, `of(Optional)`, `ofNullable(...)`, plus `.header()`, `.eTag()`, `.cacheControl()`, `.contentType()`.

### `ResponseEntity` vs `@ResponseStatus`

| | `ResponseEntity` | `@ResponseStatus` + DTO |
|--|-------------------|--------------------------|
| Status decided | At runtime (can vary) | Fixed per method |
| Headers | Any (`Location`, cache, ETag) | None |
| Verbosity | More | Less |
| Use when | Status/headers depend on outcome | Always the same status |

Many teams return DTOs directly for the success path and let **exceptions** (mapped by `@RestControllerAdvice`) produce error statuses — instead of returning `ResponseEntity.notFound()` from every method. See [Global Exception Handling](../../exception-handling/global-exception-handling/content.md).

## Internal Behavior

- `HttpEntityMethodProcessor` handles `ResponseEntity` return values; `RequestResponseBodyMethodProcessor` handles `@ResponseBody`. Both use the same converters and content negotiation.
- `ResponseBodyAdvice` beans can modify the body just before it is written (for example wrapping every response in an envelope) — use sparingly.
- Serialising a JPA entity with a bidirectional relationship causes infinite recursion (`Order → items → order → …`) or lazy-loading exceptions; DTOs avoid both.

## Common Mistakes

- Returning 200 for creation instead of 201 with a `Location` header.
- Returning `ResponseEntity<Object>` everywhere, losing type information and documentation.
- Building error responses manually in every controller instead of central exception handling.
- Returning a raw `String` of JSON from a `@RestController` — it is sent as `text/plain` unless `produces` says otherwise.

## Common Interview Traps

- **"`ResponseEntity` is required to return JSON."** Any object returned from a `@RestController` is serialised; `ResponseEntity` is for controlling status and headers.
- **"Jackson writes the response."** Jackson serialises; the message converter writes to the response; content negotiation decides which converter.
- **"`@ResponseBody` means JSON."** It means "write the return value as the body"; the format comes from negotiation and converters.

## Key Takeaways

- Return value → return value handler → content negotiation → `HttpMessageConverter` → body.
- Use `ResponseEntity` when status or headers vary: `created(uri)`, `noContent()`, `of(optional)`.
- Return DTOs, not entities; let global exception handling produce error responses.
