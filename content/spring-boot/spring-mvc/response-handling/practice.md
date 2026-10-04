# Response Handling and ResponseEntity — Practice

### P1. Create response

**Difficulty:** Easy · **Type:** MCQ

Which return value is most appropriate after successfully creating an order with id 17?

- A) `ResponseEntity.ok(order)`
- B) `ResponseEntity.created(URI.create("/api/orders/17")).body(order)`
- C) `ResponseEntity.noContent().build()`
- D) `ResponseEntity.accepted().body(order)`

<details>
<summary>Answer</summary>

**Answer:** B) `ResponseEntity.created(URI.create("/api/orders/17")).body(order)`

**Explanation:** Creation returns 201 Created with a `Location` header pointing to the new resource.

</details>

### P2. Text, not JSON

**Difficulty:** Medium · **Type:** Behavior

A `@RestController` method returns `"{\"status\":\"ok\"}"` as a `String`. What `Content-Type` does the client typically receive, and why?

<details>
<summary>Answer</summary>

`text/plain` (with `Accept: */*`). `StringHttpMessageConverter` is preferred for `String` return values and writes the text as-is. Return an object or a `Map` to get Jackson's JSON, or declare `produces = "application/json"`.

</details>

### P3. Optional to 404

**Difficulty:** Easy · **Type:** Coding

Write a handler that returns 200 with a `UserDto` or 404, given `Optional<UserDto> userService.find(long id)`.

<details>
<summary>Answer</summary>

```java
import java.util.Optional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

record UserDto(long id, String name) {
}

interface UserService {
    Optional<UserDto> find(long id);
}

@RestController
class UserController {
    private final UserService userService;

    UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/api/users/{id}")
    ResponseEntity<UserDto> get(@PathVariable long id) {
        return ResponseEntity.of(userService.find(id));
    }
}
```

An alternative used by many teams: throw a `ResourceNotFoundException` from the service and map it to 404 globally.

</details>

### P4. Infinite JSON

**Difficulty:** Medium · **Type:** Debugging

`GET /api/orders/1` fails with a Jackson error mentioning "Document nesting depth exceeds" / infinite recursion. The controller returns the `Order` entity, which has `List<OrderItem> items`, and each `OrderItem` has `Order order`. Fix it properly.

<details>
<summary>Answer</summary>

Return an `OrderResponse` DTO with a list of `OrderItemResponse` that does not contain the back-reference. (`@JsonManagedReference`/`@JsonBackReference` or `@JsonIgnore` also stop the recursion, but keep exposing entities and risk lazy loading.)

</details>
