# DTOs: Entity vs DTO — Practice

### P1. The leak

**Difficulty:** Easy · **Type:** MCQ

`GET /api/users/5` returns the `User` entity. Which problem is most serious?

- A) The JSON is slightly larger
- B) The `passwordHash` and internal flags are exposed to clients
- C) Jackson is slower with entities
- D) The status code is wrong

<details>
<summary>Answer</summary>

**Answer:** B) The `passwordHash` and internal flags are exposed to clients

**Explanation:** Exposing credentials and internal state is a security issue; DTOs expose only intended fields.

</details>

### P2. Mass assignment

**Difficulty:** Medium · **Type:** Code analysis

```java
@PutMapping("/api/users/{id}")
User update(@PathVariable long id, @RequestBody User body) {
    body.setId(id);
    return userRepository.save(body);
}
```

Describe two attacks or failures this enables.

<details>
<summary>Answer</summary>

1. A client sends `"role": "ADMIN"` or `"locked": false` and escalates privileges or unlocks an account.
2. Fields the client omits (e.g. `passwordHash`, `createdAt`) are saved as null — `save` merges the whole detached object, wiping data.

Fix: accept an `UpdateProfileRequest` DTO, load the entity in a transactional service, change only allowed fields, return a `UserResponse`.

</details>

### P3. Design the DTOs

**Difficulty:** Medium · **Type:** Design

For a product catalogue, define request/response DTOs for: creating a product (name, price, category id), changing only the price, and listing products (id, name, price, category name).

<details>
<summary>Answer</summary>

```java
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

record CreateProductRequest(@NotBlank String name,
                            @NotNull @Positive BigDecimal price,
                            @NotNull Long categoryId) {
}

record ChangePriceRequest(@NotNull @Positive BigDecimal price) {
}

record ProductSummary(long id, String name, BigDecimal price, String categoryName) {
}
```

`ProductSummary` flattens the category; with a JPQL constructor expression or interface projection it can be loaded without entities.

</details>

### P4. JsonIgnore is enough?

**Difficulty:** Hard · **Type:** Scenario

A teammate argues: "We'll just add `@JsonIgnore` to `passwordHash` and keep returning entities." Give three reasons it is not enough.

<details>
<summary>Answer</summary>

It does not stop mass assignment on input unless every sensitive field is also protected for deserialisation; lazy associations can still throw `LazyInitializationException` or trigger N+1 queries during serialisation; bidirectional relationships still recurse; and every schema change still changes the API. The API contract stays implicit instead of designed.

</details>
