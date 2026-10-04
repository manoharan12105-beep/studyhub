# DTOs: Entity vs DTO — Interview Questions

## Beginner

### Q1. What is a DTO?

<details>
<summary>Answer</summary>

A Data Transfer Object: a simple, logic-free object that carries data across a boundary, such as the request or response of a REST endpoint. In Spring Boot APIs, request and response DTOs (often Java records) are mapped to and from entities in the service layer.

</details>

### Q2. What is the difference between an entity and a DTO?

<details>
<summary>Answer</summary>

An entity is a JPA-managed object mapped to database tables, with relationships, lazy loading and dirty checking; its shape follows the schema. A DTO is a plain object whose shape follows the API contract for one use case; it is not managed by JPA, contains only exposed fields and usually carries input validation annotations.

</details>

### Q3. Why use DTOs instead of returning entities?

<details>
<summary>Answer</summary>

To avoid exposing internal fields (password hashes, flags), to prevent mass assignment on input, to decouple the API from the database schema, to avoid lazy-loading exceptions and hidden queries during serialisation, to avoid infinite recursion with bidirectional relationships, and to give each operation its own validation and documentation.

</details>

## Intermediate

### Q4. What is mass assignment and how do DTOs prevent it?

<details>
<summary>Answer</summary>

Binding client JSON directly into an object that has sensitive fields, letting the client set fields it should not — for example `{"name": "x", "role": "ADMIN"}` bound into a `User` entity. A request DTO contains only the fields the operation allows, and the service copies them explicitly into the entity, so extra JSON properties are ignored.

</details>

### Q5. Where should entity-to-DTO mapping happen?

<details>
<summary>Answer</summary>

In the service layer (or a mapper called by it), inside the transaction, so any lazy associations needed by the DTO are loaded deliberately and the controller never sees entities. For read-only endpoints, DTO projections in repository queries avoid loading entities at all.

</details>

### Q6. Manual mapping or MapStruct?

<details>
<summary>Answer</summary>

Manual mapping is explicit and dependency-free — fine for small DTOs and teams that value clarity. MapStruct generates mapping code at compile time, is type-safe and fast, and reduces boilerplate for large models; unmapped target properties can be reported as build warnings or errors. Avoid reflection-based mappers that silently skip or mis-map fields.

</details>

## Advanced

### Q7. Your API returns `Order` entities and production logs show hundreds of SQL queries per request. How are DTOs related to the fix?

<details>
<summary>Answer</summary>

Jackson serialises every getter, triggering lazy loading for each association of each order (N+1), often through Open Session in View. Returning DTOs means you decide which data is needed and load it in one query (fetch join, entity graph or DTO projection) inside the service. Also disable `spring.jpa.open-in-view` so accidental lazy loading fails fast.

</details>

### Q8. Should PATCH use the same DTO as PUT?

<details>
<summary>Answer</summary>

Usually not. PUT expects a complete representation with required fields validated. PATCH needs to distinguish "not sent" from "set to null", so it uses nullable fields (or `Optional`/`JsonNullable`, or a merge-patch document) and different validation rules. Separate DTOs keep both semantics correct.

</details>
