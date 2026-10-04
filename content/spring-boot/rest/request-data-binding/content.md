# Request Data: Headers, Body, Path Variables and Query Parameters

**Module:** REST API Development · **Interview priority:** Core

## Definition

An HTTP request carries data in four places, and Spring MVC binds each to controller parameters:

| Location | Example | Spring annotation |
|----------|---------|-------------------|
| **Path** | `/orders/42` | `@PathVariable` |
| **Query string** | `/orders?status=SHIPPED&page=2` | `@RequestParam` (or a bound object) |
| **Headers** | `Authorization`, `Accept-Language`, `X-Correlation-Id` | `@RequestHeader` |
| **Body** | JSON document | `@RequestBody` |

Two headers control the body's format: **`Content-Type`** describes what the client **sends**, **`Accept`** describes what the client wants **back**.

## Why It Matters

- "PathVariable vs RequestParam" is a standard question.
- 400, 415 and 406 errors come straight from binding and content-type rules.
- Choosing the right location makes an API predictable and cache-friendly.

## Request Headers

Metadata about the request: authentication (`Authorization: Bearer …`), formats (`Content-Type`, `Accept`), caching (`If-None-Match`), tracing (`traceparent`, `X-Correlation-Id`), idempotency (`Idempotency-Key`), locale (`Accept-Language`).

```java
@GetMapping("/api/profile")
String profile(@RequestHeader("Accept-Language") String language,
               @RequestHeader(value = "X-Client-Version", required = false) String clientVersion,
               @RequestHeader HttpHeaders allHeaders) {
    return language + " / " + clientVersion;
}
```

Spring Security reads `Authorization` itself; controllers rarely need it directly (use `@AuthenticationPrincipal`).

## Request Body

The payload of `POST`, `PUT` and `PATCH`. `@RequestBody` tells Spring to convert the body using an `HttpMessageConverter` chosen by `Content-Type` — Jackson for `application/json`. Only **one** `@RequestBody` per method; wrap multiple objects in one DTO.

## Path Variables

Identify **a specific resource** in a hierarchy.

```java
@GetMapping("/api/customers/{customerId}/orders/{orderId}")
String get(@PathVariable long customerId, @PathVariable long orderId) {
    return "customer " + customerId + ", order " + orderId;
}
```

- Names match the template; if the parameter name differs, give it: `@PathVariable("orderId") long id`. (Name inference needs the `-parameters` compiler flag, which Boot's build plugins enable.)
- A value that cannot be converted (`/orders/abc` for a `long`) → **400** (`MethodArgumentTypeMismatchException`).
- Required by default; missing segment usually means a different URL, so a 404.

## Query Parameters

**Filter, sort, paginate or modify** a collection or representation; usually optional.

```java
@GetMapping("/api/products")
List<String> search(@RequestParam(required = false) String category,
                    @RequestParam(defaultValue = "0") int page,
                    @RequestParam(defaultValue = "20") int size,
                    @RequestParam(name = "tag", required = false) List<String> tags) {
    return List.of();
}
```

- Required by default unless `required = false` or `defaultValue` is given; missing required parameter → **400** (`MissingServletRequestParameterException`).
- Repeated parameters bind to lists: `?tag=new&tag=sale` or `?tag=new,sale`.
- Many parameters can bind to an object without annotations (`ProductFilter filter`) — handy for search endpoints.

## Content-Type

Declares the **format of the request body**. A JSON body must be sent with `Content-Type: application/json`. If no converter can read the declared type, or the mapping's `consumes` excludes it → **415 Unsupported Media Type**.

## Accept

Declares the **formats the client can handle** in the response. Spring negotiates against producible types; if none match → **406 Not Acceptable**. Missing `Accept` means anything (`*/*`).

## JSON

JSON is the default representation. Spring Boot auto-configures Jackson to map JSON ↔ Java:

| JSON | Java |
|------|------|
| object | record / class (field or constructor binding) |
| array | `List`, arrays |
| string `"2026-10-04"` | `LocalDate` (ISO-8601 via the JSR-310 support Boot registers) |
| number | `int`, `long`, `BigDecimal` |
| unknown property | ignored by Boot's default configuration (`FAIL_ON_UNKNOWN_PROPERTIES` disabled) |

Configure via properties such as `spring.jackson.property-naming-strategy=SNAKE_CASE` or `spring.jackson.default-property-inclusion=non_null`, or annotations (`@JsonProperty`, `@JsonIgnore`, `@JsonFormat`). Malformed JSON → **400** (`HttpMessageNotReadableException`).

Use `BigDecimal` (or integer minor units such as paise) for money — never `double`.

## How It Works

```java
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.RequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

public class RequestBindingDemo {

    record CreateOrder(String product, int quantity) {
    }

    record OrderCreated(long id, String product, int quantity) {
    }

    @RestController
    @RequestMapping("/api/orders")
    static class OrderController {

        @GetMapping("/{orderId}")
        String get(@PathVariable long orderId,
                   @RequestParam(defaultValue = "false") boolean includeItems,
                   @RequestHeader(value = "X-Client", required = false) String client) {
            return "order=" + orderId + ", includeItems=" + includeItems + ", client=" + client;
        }

        @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
        @ResponseStatus(HttpStatus.CREATED)
        OrderCreated create(@RequestBody CreateOrder request) {
            return new OrderCreated(101, request.product(), request.quantity());
        }
    }

    static void call(MockMvc mvc, String label, RequestBuilder request) throws Exception {
        MvcResult result = mvc.perform(request).andReturn();
        System.out.println(label + " -> " + result.getResponse().getStatus() + " "
                + result.getResponse().getContentAsString());
    }

    public static void main(String[] args) throws Exception {
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new OrderController()).build();
        String json = "{\"product\":\"keyboard\",\"quantity\":2}";

        call(mvc, "GET path+query+header", get("/api/orders/42?includeItems=true").header("X-Client", "web"));
        call(mvc, "GET defaults        ", get("/api/orders/42"));
        call(mvc, "GET bad path var    ", get("/api/orders/abc"));
        call(mvc, "POST JSON           ", post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(json));
        call(mvc, "POST text/plain     ", post("/api/orders").contentType(MediaType.TEXT_PLAIN).content(json));
        call(mvc, "POST Accept: xml    ", post("/api/orders").contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_XML).content(json));
        call(mvc, "POST malformed JSON ", post("/api/orders").contentType(MediaType.APPLICATION_JSON).content("{oops"));
    }
}
```

**Output:**

```text
GET path+query+header -> 200 order=42, includeItems=true, client=web
GET defaults         -> 200 order=42, includeItems=false, client=null
GET bad path var     -> 400 
POST JSON            -> 201 {"id":101,"product":"keyboard","quantity":2}
POST text/plain      -> 415 
POST Accept: xml     -> 406 
POST malformed JSON  -> 400 
```

The empty bodies on errors are because this standalone setup has no error handling configured; a Spring Boot application adds an error body (and your `@RestControllerAdvice` can return `ProblemDetail`).

## Comparison: PathVariable vs RequestParam

| Aspect | `@PathVariable` | `@RequestParam` |
|--------|-----------------|-----------------|
| Location | URI path segment | Query string (or form field) |
| Purpose | Identify a resource | Filter, sort, paginate, options |
| Required | Yes (part of the URL) | Yes by default; often optional with defaults |
| Example | `/orders/42` | `/orders?status=SHIPPED` |
| Caching/bookmarking | Distinct URL per resource | Distinct URL per query |
| Rule of thumb | "Which one?" | "Which ones / how?" |

## Common Mistakes

- Sending JSON without `Content-Type: application/json` → 415.
- Forgetting `@RequestBody` → Spring tries to bind query/form parameters to the object; fields stay null.
- Using path variables for optional filters (`/products/category/{c}/brand/{b}`) — combinatorial URLs.
- Putting sensitive data (tokens, passwords) in query parameters — they end up in logs and browser history.
- Using `double` for money in JSON DTOs.

## Common Interview Traps

- **"Content-Type and Accept are the same."** Content-Type describes the body sent; Accept describes the response wanted.
- **"GET requests can carry a JSON body like POST."** Semantics are undefined and many proxies drop it; use query parameters (or POST for complex searches).
- **"@RequestParam is only for GET."** It also binds form fields in POST requests.

## Key Takeaways

- Path → `@PathVariable` (identity), query → `@RequestParam` (filters/options), headers → `@RequestHeader`, body → `@RequestBody`.
- `Content-Type` wrong → 415; `Accept` unsatisfiable → 406; conversion/parse/validation failure → 400.
- Jackson maps JSON ↔ records/classes; configure with `spring.jackson.*`.
