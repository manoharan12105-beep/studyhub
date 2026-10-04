# Request Data: Headers, Body, Path Variables and Query Parameters — Practice

### P1. Choose the binding

**Difficulty:** Easy · **Type:** MCQ

`GET /api/users/15/orders?status=SHIPPED` — how should `15` and `SHIPPED` be bound?

- A) Both `@RequestParam`
- B) `15` with `@PathVariable`, `SHIPPED` with `@RequestParam`
- C) Both `@PathVariable`
- D) `15` with `@RequestBody`, `SHIPPED` with `@RequestHeader`

<details>
<summary>Answer</summary>

**Answer:** B) `15` with `@PathVariable`, `SHIPPED` with `@RequestParam`

**Explanation:** The user id is in the path (resource identity); the status is a query filter.

</details>

### P2. Predict the status

**Difficulty:** Medium · **Type:** Behavior

For `@PostMapping(value = "/api/orders", consumes = "application/json")` with `@RequestBody CreateOrder`, what status does each request get? (a) JSON body with `Content-Type: application/json`; (b) same body with no `Content-Type`; (c) `Content-Type: application/json` but body `{"quantity": "two"}` where `quantity` is an `int`.

<details>
<summary>Answer</summary>

(a) Success (200/201 depending on the method). (b) 415 Unsupported Media Type. (c) 400 Bad Request — the body cannot be converted (`HttpMessageNotReadableException`).

</details>

### P3. Null fields

**Difficulty:** Medium · **Type:** Debugging

```java
@PostMapping("/api/products")
ProductDto create(CreateProductRequest request) {
    return service.create(request);
}
```

The client sends valid JSON, but every field of `request` is null. Fix it.

<details>
<summary>Answer</summary>

Add `@RequestBody` (and `@Valid` for validation): `create(@Valid @RequestBody CreateProductRequest request)`. Without it, Spring binds request parameters (query/form) into the object, and the JSON body is ignored.

</details>

### P4. Naming mismatch

**Difficulty:** Medium · **Type:** Scenario

A mobile team sends `{"first_name": "Asha"}` while your DTO has `firstName`. Give two ways to accept it.

<details>
<summary>Answer</summary>

Annotate the field/component with `@JsonProperty("first_name")`, or configure the whole API with `spring.jackson.property-naming-strategy=SNAKE_CASE` (which also changes response naming). Choose one convention for the API and document it.

</details>
