# OpenAPI, Swagger and API Documentation — Practice

### P1. Where is the spec?

**Difficulty:** Easy · **Type:** MCQ

With springdoc defaults, where is the generated OpenAPI JSON served?

- A) `/swagger.json`
- B) `/v3/api-docs`
- C) `/actuator/openapi`
- D) `/api/spec`

<details>
<summary>Answer</summary>

**Answer:** B) `/v3/api-docs`

</details>

### P2. Missing errors

**Difficulty:** Medium · **Type:** Scenario

The mobile team complains that the docs show only 200 responses and they cannot handle errors. What do you add?

<details>
<summary>Answer</summary>

`@ApiResponse` entries for 400, 401, 403, 404 and 409 on the relevant operations (or global responses via an `OpenApiCustomizer`), with the `application/problem+json` ProblemDetail schema and examples, plus documentation of error codes in the `type` URIs.

</details>
