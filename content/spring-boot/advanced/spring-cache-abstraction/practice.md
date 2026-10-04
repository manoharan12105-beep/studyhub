# Cache Abstraction: @Cacheable, @CachePut and @CacheEvict — Practice

### P1. Always runs

**Difficulty:** Easy · **Type:** MCQ

Which annotation always executes the method body?

- A) `@Cacheable`
- B) `@CachePut`
- C) Neither
- D) Both

<details>
<summary>Answer</summary>

**Answer:** B) `@CachePut`

</details>

### P2. Annotate the service

**Difficulty:** Medium · **Type:** Coding

Annotate `findById(long id)`, `update(long id, ProductUpdate u)` (returns the updated DTO) and `deleteById(long id)` for a `products` cache.

<details>
<summary>Answer</summary>

`@Cacheable(cacheNames = "products", key = "#id")` on `findById`; `@CachePut(cacheNames = "products", key = "#id")` on `update` (it returns the new DTO); `@CacheEvict(cacheNames = "products", key = "#id")` on `deleteById`. Configure a TTL in the cache provider.

</details>

### P3. Leaking data

**Difficulty:** Hard · **Type:** Debugging

`@Cacheable("cart") Cart currentCart()` reads the user from the `SecurityContext`. Users start seeing other people's carts. Why?

<details>
<summary>Answer</summary>

The method has no parameters, so every call uses the same key (`SimpleKey.EMPTY`): the first user's cart is cached and returned to everyone. Include the user in the key — `currentCart(long userId)` with `key = "#userId"` — or don't cache it.

</details>
