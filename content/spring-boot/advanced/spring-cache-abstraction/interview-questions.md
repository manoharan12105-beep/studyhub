# Cache Abstraction: @Cacheable, @CachePut and @CacheEvict — Interview Questions

## Beginner

### Q1. What is the difference between `@Cacheable`, `@CachePut` and `@CacheEvict`?

<details>
<summary>Answer</summary>

`@Cacheable` returns the cached value if present and only executes the method on a miss, storing the result. `@CachePut` always executes the method and stores its result, keeping the cache updated. `@CacheEvict` removes one entry (by key) or all entries of a cache, typically after deletes or updates.

</details>

### Q2. How do you enable caching in Spring Boot?

<details>
<summary>Answer</summary>

Add `@EnableCaching` to a configuration class (and a provider dependency such as Caffeine or `spring-boot-starter-data-redis`; `spring-boot-starter-cache` brings the support). Boot auto-configures a `CacheManager` for the detected provider, or a simple `ConcurrentMapCacheManager` if none is present.

</details>

## Intermediate

### Q3. How are cache keys generated?

<details>
<summary>Answer</summary>

By default with `SimpleKeyGenerator`: no arguments → `SimpleKey.EMPTY`, one argument → that argument, several → a `SimpleKey` of all arguments. Custom keys use SpEL (`key = "#product.id"`, `key = "#userId + ':' + #page"`) or a `KeyGenerator` bean.

</details>

### Q4. Why might `@Cacheable` have no effect?

<details>
<summary>Answer</summary>

`@EnableCaching` missing; the method is called from the same class (self-invocation) or is private; the object is not a Spring bean; `condition`/`unless` prevent caching; or keys differ between calls (arguments without proper `equals`/`hashCode`).

</details>

## Advanced

### Q5. What is `sync = true` on `@Cacheable`?

<details>
<summary>Answer</summary>

On a cache miss, only one thread computes the value for a key while others wait for it, preventing a stampede of identical expensive calls within the application instance (support depends on the provider). It cannot be combined with `unless` and does not coordinate across instances.

</details>

### Q6. How do you make cache eviction consistent with transactions?

<details>
<summary>Answer</summary>

Evict after commit so concurrent readers cannot repopulate the cache with old data before the new data is committed: wrap the `CacheManager` in `TransactionAwareCacheManagerProxy` (or enable transaction awareness in the Redis cache manager), or evict in an `@TransactionalEventListener(AFTER_COMMIT)`.

</details>
