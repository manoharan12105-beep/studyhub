# Cache Abstraction: @Cacheable, @CachePut and @CacheEvict

**Module:** Advanced Spring · **Interview priority:** Frequently asked

## Definition

Spring's **cache abstraction** adds caching to bean methods declaratively. Annotated methods are wrapped by a proxy that consults a **`CacheManager`**: **`@Cacheable`** returns a cached result if present, otherwise calls the method and stores the result; **`@CachePut`** always calls the method and updates the cache; **`@CacheEvict`** removes entries. The provider (simple in-memory map, Caffeine, Redis, Hazelcast…) is pluggable. Enable it with **`@EnableCaching`**.

## Why It Matters

- It implements the cache-aside pattern (see [Caching Strategies and Redis](../../production/caching-and-redis/content.md)) with a few annotations.
- Interviewers ask for the difference between the three annotations, key generation, and why caching "does not work" on some calls.

## Caching Abstraction

| Element | Role |
|---------|------|
| `@EnableCaching` | Registers the caching interceptor/proxies |
| `CacheManager` | Provides named `Cache`s; Boot auto-configures one from the classpath (Caffeine, Redis, JCache…) or a `ConcurrentMapCacheManager` fallback |
| Cache name | `@Cacheable("products")` — a logical cache (a Redis key prefix, a Caffeine cache) |
| Key | By default from method arguments (`SimpleKeyGenerator`); customise with SpEL `key = "#id"` |

## @Cacheable

```java
@Cacheable(cacheNames = "products", key = "#id", unless = "#result == null")
public String find(long id) {
    return "product-" + id;          // in reality: load and map a DTO
}
```

- `condition` (evaluated before the call) decides whether to use the cache; `unless` (after) decides whether to store the result.
- `sync = true` lets only one thread compute a missing value per key in this JVM (stampede protection, provider permitting).

## @CachePut

Always executes the method and puts the result into the cache — keeps the cache updated after writes (write-through). Do not combine `@Cacheable` and `@CachePut` on the same method.

## @CacheEvict

Removes entries: `key = "#id"` for one entry, `allEntries = true` to clear the cache, `beforeInvocation = true` to evict even if the method throws. Use after updates/deletes when the method does not return the new value.

`@Caching` groups several cache annotations; `@CacheConfig(cacheNames = "products")` sets class-level defaults.

## How It Works

```java
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

public class CacheDemo {

    record Product(long id, String name, int price) {
    }

    static class ProductService {
        private final AtomicInteger databaseCalls = new AtomicInteger();
        private int price = 1500;

        public int databaseCalls() {                                 // access state through methods: the bean is a proxy
            return databaseCalls.get();
        }

        @Cacheable(cacheNames = "products", key = "#id")
        public Product find(long id) {
            databaseCalls.incrementAndGet();                         // expensive call we want to avoid
            return new Product(id, "Keyboard", price);
        }

        @CachePut(cacheNames = "products", key = "#id")            // always runs, then updates the cache
        public Product changePrice(long id, int newPrice) {
            price = newPrice;
            return new Product(id, "Keyboard", price);
        }

        @CacheEvict(cacheNames = "products", key = "#id")          // removes the entry
        public void delete(long id) {
        }

        public Product findViaThis(long id) {
            return find(id);                                         // self-invocation: cache bypassed
        }
    }

    @Configuration
    @EnableCaching                                                   // Spring Boot: add this; Boot picks the CacheManager
    static class Config {
        @Bean
        CacheManager cacheManager() {
            return new ConcurrentMapCacheManager("products");        // simple in-memory cache (Boot's fallback)
        }

        @Bean
        ProductService productService() {
            return new ProductService();
        }
    }

    public static void main(String[] args) {
        try (var context = new AnnotationConfigApplicationContext(Config.class)) {
            ProductService products = context.getBean(ProductService.class);

            products.find(1);
            products.find(1);
            System.out.println("two finds        -> database calls: " + products.databaseCalls());

            products.changePrice(1, 1200);
            System.out.println("after @CachePut  -> price from cache: " + products.find(1).price()
                    + ", database calls: " + products.databaseCalls());

            products.delete(1);
            products.find(1);
            System.out.println("after @CacheEvict-> database calls: " + products.databaseCalls());

            products.findViaThis(1);
            products.findViaThis(1);
            System.out.println("self-invocation  -> database calls: " + products.databaseCalls());
        }
    }
}
```

**Output:**

```text
two finds        -> database calls: 1
after @CachePut  -> price from cache: 1200, database calls: 1
after @CacheEvict-> database calls: 2
self-invocation  -> database calls: 4
```

The second `find` was served from the cache; `@CachePut` refreshed the entry without a "database" call; eviction forced a reload; internal calls via `this` bypassed the cache entirely (two extra calls).

## Internal Behavior

- `@EnableCaching` registers a `CacheInterceptor` advisor; beans with cache annotations are proxied, so self-invocation, private methods and non-beans are not cached (as above).
- Default keys: no arguments → `SimpleKey.EMPTY`; one argument → the argument; several → `SimpleKey(args…)`. Arguments therefore need proper `equals`/`hashCode`.
- Cached values must be serialisable for remote caches (Redis); prefer immutable DTOs/records over entities.
- Eviction inside a transaction happens immediately unless the cache is transaction-aware (`TransactionAwareCacheManagerProxy`), which defers puts/evicts until commit.

## Comparison

| | `@Cacheable` | `@CachePut` | `@CacheEvict` |
|--|-------------|-------------|---------------|
| Method executes | Only on cache miss | Always | Always |
| Cache effect | Read; store on miss | Store/overwrite result | Remove entry/entries |
| Typical method | `find…` | `update…` returning the new value | `delete…`, updates without return value |

## Common Mistakes

- Forgetting `@EnableCaching` — annotations silently ignored.
- Self-invocation, private methods.
- Caching mutable objects or JPA entities.
- No TTL in production cache configuration (the simple fallback map grows forever and never expires).
- Wrong keys: methods with several parameters where only one should form the key, or user-specific data cached without the user in the key.

## Common Interview Traps

- **"`@CachePut` reads from the cache."** It never skips the method; it updates the cache.
- **"Spring provides the cache storage."** It provides the abstraction; storage is the configured provider.
- **"Caching works on any method call."** Only through the proxy.

## Key Takeaways

- `@EnableCaching` + `CacheManager`; `@Cacheable` (read-through on miss), `@CachePut` (always run, update), `@CacheEvict` (remove).
- Keys from arguments or SpEL; conditions with `condition`/`unless`; `sync` against stampedes.
- Proxy-based: external calls only; cache immutable DTOs with TTLs.
