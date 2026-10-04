# Jakarta Bean Validation — Practice

### P1. Whitespace name

**Difficulty:** Easy · **Type:** MCQ

Which constraint rejects `"   "` (three spaces)?

- A) `@NotNull`
- B) `@NotEmpty`
- C) `@NotBlank`
- D) `@Size(min = 1)`

<details>
<summary>Answer</summary>

**Answer:** C) `@NotBlank`

**Explanation:** `"   "` is not null, not empty and has length 3; only `@NotBlank` checks for non-whitespace characters.

</details>

### P2. Which fields fail?

**Difficulty:** Medium · **Type:** Behavior

```java
record SignupRequest(@NotBlank String name,
                     @Email String email,
                     @Size(min = 8) String password,
                     @Min(18) Integer age) {
}
```

The JSON is `{"name": "Asha"}` and the controller uses `@Valid @RequestBody`. Which fields fail?

<details>
<summary>Answer</summary>

None. `email`, `password` and `age` are null, and `@Email`, `@Size` and `@Min` treat null as valid. Add `@NotBlank` to `email`/`password` and `@NotNull` to `age` if they are required.

</details>

### P3. Validate the order

**Difficulty:** Medium · **Type:** Coding

Write a request DTO for placing an order: 1–20 items, each with a required product id and quantity 1–5; a required delivery address with a 6-digit pincode; an optional note of at most 200 characters.

<details>
<summary>Answer</summary>

```java
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

record ItemRequest(@NotNull Long productId, @Min(1) @Max(5) int quantity) {
}

record DeliveryAddress(@NotBlank String line1, @NotBlank String city,
                       @NotBlank @Pattern(regexp = "\\d{6}", message = "must be 6 digits") String pincode) {
}

record PlaceOrderRequest(@NotNull @Size(min = 1, max = 20) List<@Valid ItemRequest> items,
                         @NotNull @Valid DeliveryAddress address,
                         @Size(max = 200) String note) {
}
```

</details>

### P4. Nothing is validated

**Difficulty:** Medium · **Type:** Debugging

After creating a new project, `@NotBlank` constraints on a request DTO are never enforced, even with `@Valid` on the parameter. What do you check first?

<details>
<summary>Answer</summary>

That `spring-boot-starter-validation` (Hibernate Validator) is on the classpath — the web starter no longer includes it. Then check imports are `jakarta.validation` (not `javax.validation`) and that `@Valid` is on the `@RequestBody` parameter.

</details>
