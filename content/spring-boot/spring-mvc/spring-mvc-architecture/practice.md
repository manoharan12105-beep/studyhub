# Spring MVC and the Layered Architecture — Practice

### P1. Front controller

**Difficulty:** Easy · **Type:** MCQ

How many `DispatcherServlet` instances handle the requests of a typical Spring Boot REST service with 30 controllers?

- A) 30
- B) 1
- C) One per request
- D) One per HTTP method

<details>
<summary>Answer</summary>

**Answer:** B) 1

**Explanation:** One front controller receives all requests and delegates to controller beans.

</details>

### P2. Fat controller

**Difficulty:** Medium · **Type:** Code analysis

```java
@PostMapping("/orders")
@Transactional
OrderEntity place(@RequestBody OrderEntity order) {
    Product p = productRepository.findById(order.getProductId()).orElseThrow();
    if (p.getStock() < order.getQuantity()) {
        throw new IllegalStateException("Out of stock");
    }
    p.setStock(p.getStock() - order.getQuantity());
    return orderRepository.save(order);
}
```

List four problems.

<details>
<summary>Answer</summary>

1. Business logic and repository access in the controller — belongs in an `OrderService`.
2. `@Transactional` on the controller instead of the service.
3. The JPA entity is used as request and response body — clients can set any field (mass assignment), lazy relations may fail during serialisation; use DTOs.
4. No validation (`@Valid` on a request DTO) and `IllegalStateException` maps to 500 instead of a meaningful 409/422 through a custom exception and global handler.

</details>

### P3. Place the logic

**Difficulty:** Medium · **Type:** Scenario

For each item, name the layer: (a) converting `OrderEntity` to `OrderResponse`; (b) returning 201 with a `Location` header; (c) checking that a coupon is not expired; (d) `findByCustomerIdAndStatus`.

<details>
<summary>Answer</summary>

(a) Service (or a mapper used by it) — controllers should not see entities. (b) Controller — HTTP concern. (c) Service — business rule. (d) Repository — query method.

</details>
