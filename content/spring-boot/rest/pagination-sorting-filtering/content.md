# Pagination, Sorting and Filtering

**Module:** REST API Development · **Interview priority:** Core

## Definition

- **Pagination** returns a large collection in fixed-size **pages** instead of all at once.
- **Sorting** orders the results by one or more fields and directions.
- **Filtering** narrows the collection by criteria.

All three are expressed with **query parameters** on a collection resource: `GET /api/products?category=laptops&minPrice=30000&page=0&size=20&sort=price,asc`. Spring Data provides `Pageable`, `Sort`, `Page` and `Slice` to implement them end to end.

## Why It Matters

- Returning an unbounded list is a performance and availability risk: one request can load millions of rows into memory.
- "How would you implement pagination?" is a standard project question; good answers mention stable sorting, maximum page size, count cost, and keyset pagination for large data.

## Pagination

```java
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

record ProductSummary(long id, String name, BigDecimal price) {
}

record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages, boolean last) {
    static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
    }
}

record ProductFilter(String category, BigDecimal minPrice, BigDecimal maxPrice, String q) {
}

interface ProductSearchService {
    Page<ProductSummary> search(ProductFilter filter, Pageable pageable);
}

@RestController
@RequestMapping("/api/products")
class ProductSearchController {
    private final ProductSearchService service;

    ProductSearchController(ProductSearchService service) {
        this.service = service;
    }

    // GET /api/products?category=laptops&minPrice=30000&page=1&size=20&sort=price,desc&sort=id
    @GetMapping
    PageResponse<ProductSummary> search(ProductFilter filter,                              // bound from query params
                                        @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return PageResponse.from(service.search(filter, pageable));
    }

    static Pageable example() {
        return PageRequest.of(0, 20, Sort.by(Sort.Order.desc("price"), Sort.Order.asc("id")));
    }
}
```

`Pageable` is resolved from `page` (zero-based), `size` and `sort` parameters by Spring Data's argument resolver. Relevant properties:

```properties
spring.data.web.pageable.default-page-size=20
spring.data.web.pageable.max-page-size=100
spring.data.web.pageable.one-indexed-parameters=false
```

Always cap `max-page-size` (the default cap is 2000) so `size=1000000` cannot exhaust memory.

### Response shape

Return your own `PageResponse` DTO (above) or Spring Data's `PagedModel`. Since Spring Data 3.3, serialising `PageImpl` directly logs a warning because its JSON structure is not a stable contract; `@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)` makes Spring render pages through a stable DTO.

### Page vs Slice

| | `Page<T>` | `Slice<T>` |
|--|-----------|------------|
| Knows total elements/pages | Yes | No |
| Extra query | **`COUNT(*)`** query | None (fetches `size + 1` rows to compute `hasNext`) |
| UI | "Page 3 of 57" | "Load more" / infinite scroll |
| Cost on large tables | Count can be expensive | Cheaper |

### Offset vs keyset pagination

Offset pagination (`LIMIT 20 OFFSET 100000`) makes the database scan and discard all skipped rows — deep pages get slow — and rows inserted between requests shift pages (duplicates/skips).

**Keyset (seek) pagination** continues after the last seen key: `WHERE (created_at, id) < (:lastCreatedAt, :lastId) ORDER BY created_at DESC, id DESC LIMIT 20`. It uses an index, stays fast at any depth, and is stable under inserts — but cannot jump to page N. Spring Data supports it with `ScrollPosition`/`Window` (`findFirst20By…(ScrollPosition position)`), or write the query yourself. Use it for feeds, large exports and infinite scroll.

## Sorting

- Query parameter format: `sort=price,desc&sort=id,asc` (multiple allowed).
- **Always add a unique tie-breaker** (usually `id`) — sorting only by a non-unique column (price, date) gives non-deterministic order across pages, so items appear twice or never.
- **Whitelist sortable fields.** Unknown property names cause a `PropertyReferenceException` (Spring Data rejects properties that do not exist on the entity), and sorting on unindexed columns can be slow. Validate against an allowed set and return 400.
- Map API field names to entity properties if they differ, so the API does not expose internal names.

## Filtering

Simple filters bind as query parameters; the service builds the query:

| Approach | Good for |
|----------|----------|
| Derived query methods (`findByCategoryAndPriceBetween`) | A few fixed combinations |
| `@Query` with optional parameters (`(:category is null or p.category = :category)`) | A handful of optional filters (can produce poor plans) |
| **Specifications** (Criteria API) | Many optional, combinable filters — see [Projections, Pagination, Sorting and Specifications](../../jpa-hibernate/projections-pagination-specifications/content.md) |
| Query by Example | Simple equality filters from a probe object |
| Search engine (Elasticsearch/OpenSearch) | Full-text search, facets, relevance ranking |

Validate filter input (`minPrice <= maxPrice`, allowed enum values) and return 400 for nonsense. Text search with `LIKE '%term%'` cannot use normal B-tree indexes — fine for small tables, not for large catalogues.

## Common Mistakes

- Endpoints that return `findAll()` without paging.
- No maximum page size.
- Sorting without a unique tie-breaker.
- Serialising `Page` entities directly (unstable JSON, entity leaks, lazy loading).
- Pagination combined with a collection fetch join, which Hibernate applies **in memory** (warning `HHH90003004`) — see [The N+1 Problem](../../jpa-hibernate/n-plus-one-problem/content.md).
- Deep offset pagination on large tables.

## Common Interview Traps

- **"Pagination is a UI concern."** It is primarily a server-side protection against unbounded queries.
- **"`Page` is always the right return type."** The count query can cost as much as the data query; use `Slice` or keyset pagination when totals are not needed.
- **"Page numbers start at 1 in Spring."** Spring Data pages are zero-based unless configured otherwise.

## Key Takeaways

- Use query parameters `page`, `size`, `sort` + filters; bind to `Pageable` and a filter record.
- Cap page size, always add a unique sort tie-breaker, whitelist sort fields.
- `Page` = data + count query; `Slice` = no count; keyset pagination for deep or live data.
- Return a stable page DTO, not entities or raw `PageImpl`.
