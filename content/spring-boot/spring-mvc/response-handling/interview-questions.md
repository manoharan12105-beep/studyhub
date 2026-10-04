# Response Handling and ResponseEntity — Interview Questions

## Beginner

### Q1. What is `ResponseEntity`?

<details>
<summary>Answer</summary>

A Spring type representing the full HTTP response: status code, headers and body. Returning it from a controller lets you decide the status and headers at runtime, for example `ResponseEntity.created(location).body(dto)` for 201 or `ResponseEntity.noContent().build()` for 204.

</details>

### Q2. How does a returned Java object become JSON?

<details>
<summary>Answer</summary>

Because of `@ResponseBody` (implied by `@RestController`), the return value handler performs content negotiation against the `Accept` header and writes the object with a matching `HttpMessageConverter`; for JSON that is the Jackson converter, which serialises the object using the auto-configured Jackson mapper.

</details>

### Q3. What is `@ResponseStatus`?

<details>
<summary>Answer</summary>

An annotation that sets a fixed status code: on a handler method (e.g. `@ResponseStatus(HttpStatus.CREATED)`) for successful responses, or on an exception class so that throwing it produces that status. It cannot add headers.

</details>

## Intermediate

### Q4. When would you use `ResponseEntity` instead of returning a DTO directly?

<details>
<summary>Answer</summary>

When the status code or headers depend on the outcome or must be set: 201 with a `Location` header after creation, 204 for delete, 202 for asynchronous processing, caching headers (`ETag`, `Cache-Control`), file downloads with `Content-Disposition`. For a fixed 200 with a body, returning the DTO is simpler.

</details>

### Q5. What is content negotiation and when does Spring return 406?

<details>
<summary>Answer</summary>

Selecting the response media type by matching the client's acceptable types (`Accept` header) with the types the handler can produce (`produces` and converters able to write the return type). If no acceptable type can be produced — e.g. the client sends `Accept: application/xml` but only JSON is available — Spring responds 406 Not Acceptable.

</details>

### Q6. Why should you not return JPA entities from controllers?

<details>
<summary>Answer</summary>

Serialising them can trigger lazy loading outside a transaction (`LazyInitializationException`) or N+1 queries, bidirectional relationships cause infinite recursion, internal fields (password hashes, audit columns) leak, and the API becomes coupled to the database schema. DTOs give a stable, explicit contract.

</details>

## Advanced

### Q7. How would you add a common envelope `{ "data": …, "timestamp": … }` to every response, and should you?

<details>
<summary>Answer</summary>

Technically with a `ResponseBodyAdvice` that wraps the body before it is written (careful with `String` bodies, errors and already-wrapped types). Often it is better not to: HTTP already carries status and metadata in headers, envelopes complicate clients and documentation, and RFC 9457 `ProblemDetail` covers errors. Use envelopes only if clients require them, and be consistent.

</details>

### Q8. How does Spring know to use `ResponseEntity`'s status but `@ResponseBody` for a DTO?

<details>
<summary>Answer</summary>

Different `HandlerMethodReturnValueHandler`s claim different return types: `HttpEntityMethodProcessor` supports `HttpEntity`/`ResponseEntity` and applies its status and headers before writing the body; `RequestResponseBodyMethodProcessor` handles `@ResponseBody` return values. Both delegate body writing to the same message converters.

</details>
