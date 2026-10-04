# HTTP Methods and Idempotency — Interview Questions

## Beginner

### Q1. What is the difference between PUT and PATCH?

<details>
<summary>Answer</summary>

PUT replaces the entire resource with the representation in the request — omitted fields are cleared — and is idempotent. PATCH applies a partial change, leaving other fields untouched, and is not guaranteed to be idempotent. Use PUT when the client sends the full object, PATCH for updating a few fields.

</details>

### Q2. What is the difference between GET and POST?

<details>
<summary>Answer</summary>

GET retrieves data, is safe and idempotent, sends parameters in the URL, and can be cached and bookmarked. POST sends data in the body to create a resource or trigger processing, changes state, is neither safe nor idempotent, and is generally not cached.

</details>

### Q3. Which HTTP methods are idempotent?

<details>
<summary>Answer</summary>

GET, HEAD, OPTIONS, TRACE, PUT and DELETE. POST is not; PATCH is not guaranteed to be. Safe methods (GET, HEAD, OPTIONS, TRACE) are a subset of idempotent ones.

</details>

## Intermediate

### Q4. What does idempotent mean, and why does it matter?

<details>
<summary>Answer</summary>

Applying the same request multiple times has the same effect on server state as applying it once. It matters for reliability: after a timeout the client cannot know whether the request was processed, so only idempotent requests can be retried blindly by clients, load balancers and retry libraries without causing duplicates.

</details>

### Q5. DELETE returns 204 the first time and 404 the second time. Is it still idempotent?

<details>
<summary>Answer</summary>

Yes. Idempotency is defined by the server state after the requests — the resource is absent either way — not by identical responses.

</details>

### Q6. How would you implement PATCH in Spring Boot?

<details>
<summary>Answer</summary>

`@PatchMapping("/{id}")` accepting a DTO whose fields are nullable (or `Optional`), then in the service loading the entity and applying only non-null fields — dirty checking writes the changes at commit. For explicit null-setting or array operations, accept JSON Merge Patch (`application/merge-patch+json`) or JSON Patch (`application/json-patch+json`) and apply it with a library. Validate the result after applying the patch.

</details>

## Advanced

### Q7. How do you prevent duplicate orders when a client retries `POST /orders`?

<details>
<summary>Answer</summary>

Require an `Idempotency-Key` header generated per checkout attempt. Store the key with a unique constraint (with user id and request hash) before processing; on a repeat with the same key, return the stored response instead of creating another order; if processing is still in progress, return 409. Expire keys after a window. The unique constraint, not an application-level "exists" check, guarantees correctness under concurrency.

</details>

### Q8. Can PATCH be idempotent? Give one idempotent and one non-idempotent example.

<details>
<summary>Answer</summary>

It can be, depending on the operation. Idempotent: merge patch `{"status": "SHIPPED"}` — repeated application leaves the same state. Non-idempotent: JSON Patch `{"op": "add", "path": "/items/-", "value": …}` (appends each time) or a custom `{"incrementStock": 5}`.

</details>

### Q9. When is it acceptable to use POST for a read operation?

<details>
<summary>Answer</summary>

When the query is too large or complex for a URL (many filters, nested criteria), or contains sensitive data that must not appear in URLs and logs — e.g. `POST /orders/search`. Document that it is safe and idempotent in behaviour, even though HTTP infrastructure will not treat it as cacheable.

</details>
