# Request Data: Headers, Body, Path Variables and Query Parameters — Interview Questions

## Beginner

### Q1. What is the difference between `@PathVariable` and `@RequestParam`?

<details>
<summary>Answer</summary>

`@PathVariable` binds a segment of the URI path, used to identify a specific resource (`/orders/42`). `@RequestParam` binds a query-string (or form) parameter, used for optional filtering, sorting, pagination and options (`/orders?status=SHIPPED`). Path variables are part of the resource identity; query parameters modify what is returned.

</details>

### Q2. What does `@RequestBody` do?

<details>
<summary>Answer</summary>

It binds the HTTP request body to a method parameter by converting it with an `HttpMessageConverter` selected from the `Content-Type` — for JSON, Jackson deserialises it into the DTO. Combined with `@Valid`, the DTO is validated before the method runs. A method can have only one `@RequestBody`.

</details>

### Q3. What is the difference between `Content-Type` and `Accept`?

<details>
<summary>Answer</summary>

`Content-Type` states the media type of the body being sent (request or response). `Accept` is a request header listing the media types the client is willing to receive in the response. A mismatch on `Content-Type` gives 415; an unsatisfiable `Accept` gives 406.

</details>

## Intermediate

### Q4. What happens if a required `@RequestParam` is missing or cannot be converted?

<details>
<summary>Answer</summary>

Missing → `MissingServletRequestParameterException`; not convertible (e.g. `page=abc` for an `int`) → `MethodArgumentTypeMismatchException`. Both are resolved to 400 Bad Request by default and can be customised in a `@RestControllerAdvice`. Use `required = false` or `defaultValue` for optional parameters.

</details>

### Q5. A client posts JSON and every field of the DTO is null. What are the likely causes?

<details>
<summary>Answer</summary>

The parameter lacks `@RequestBody` (so Spring binds query/form parameters instead of the body); the JSON property names do not match the DTO (e.g. snake_case vs camelCase without a naming strategy); the DTO has no way to be populated (no setters/constructor binding for a class); or the client wraps the object in another level (`{"order": {...}}`).

</details>

### Q6. Why should sensitive values not be sent as query parameters?

<details>
<summary>Answer</summary>

URLs are logged by servers, proxies and load balancers, stored in browser history, and can leak through the `Referer` header. Tokens, passwords and personal data belong in headers or the body over HTTPS.

</details>

## Advanced

### Q7. How does Spring know the name of a `@PathVariable` without an explicit value?

<details>
<summary>Answer</summary>

From the method parameter name, which is available at runtime only when the code is compiled with `-parameters` (Spring Boot's Maven and Gradle plugins enable it). Since Spring Framework 6.1, Spring no longer falls back to reading local-variable debug information, so without the flag an unnamed `@PathVariable` fails with an error asking you to name it explicitly.

</details>

### Q8. How would you design a search endpoint with many optional filters?

<details>
<summary>Answer</summary>

`GET /products?category=…&minPrice=…&maxPrice=…&brand=a&brand=b&page=0&size=20&sort=price,asc`, binding the filters to a `ProductFilter` record (no annotation needed) and the paging to `Pageable`. In the service, translate present filters into a JPA `Specification` or query. If the criteria are too large or structured for a URL, `POST /products/search` with a JSON body is acceptable.

</details>
