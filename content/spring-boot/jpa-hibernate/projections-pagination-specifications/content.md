# Projections, Pagination, Sorting and Specifications

**Module:** Spring Data JPA and Hibernate · **Interview priority:** Frequently asked

## Definition

- A **projection** returns only selected fields instead of whole entities — as an **interface** (Spring creates a proxy), a **class/record DTO**, or dynamically chosen by the caller.
- **Pagination and sorting** at the repository level use `Pageable`/`Sort` parameters and return `Page`, `Slice`, `List` or a keyset `Window`.
- A **Specification** is a reusable, composable predicate built with the JPA Criteria API, executed through `JpaSpecificationExecutor` — the standard Spring Data tool for **dynamic filtering**.

## Why It Matters

- Loading full entities (with snapshots for dirty checking) for read-only screens wastes memory and bandwidth; projections are the cheapest way to read.
- Real search screens have many optional filters; specifications avoid writing one query per combination.
- The REST-level design of paging and filtering is in [Pagination, Sorting and Filtering](../../rest/pagination-sorting-filtering/content.md); this topic covers the repository side.

## Projections

```java
package com.example.catalog;

import java.math.BigDecimal;
import java.util.List;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Entity
@Table(name = "category")
class Category {
    @Id
    @GeneratedValue
    Long id;
    String name;
}

@Entity
@Table(name = "product")
class Product {
    @Id
    @GeneratedValue
    Long id;
    String name;
    String description;                       // large text we do not want on list screens
    BigDecimal price;
    @ManyToOne(fetch = FetchType.LAZY)
    Category category;
}

// 1. Interface-based (closed) projection: getters matching entity properties
interface ProductNameOnly {
    String getName();

    BigDecimal getPrice();
}

// 2. Class-based (DTO) projection: a record whose constructor parameters match
record ProductSummary(Long id, String name, BigDecimal price) {
}

interface ProductProjectionRepository extends JpaRepository<Product, Long> {

    List<ProductNameOnly> findByPriceLessThan(BigDecimal max);                 // selects only name, price

    List<ProductSummary> findByNameContaining(String fragment);                // derived query → DTO

    @Query("""
            select new com.example.catalog.ProductSummary(p.id, p.name, p.price)
            from Product p join p.category c
            where c.name = :category
            """)
    List<ProductSummary> summariesInCategory(@Param("category") String category); // JPQL constructor expression

    <T> List<T> findByCategoryName(String categoryName, Class<T> type);        // 3. dynamic projection
}
```

| Kind | How | Selects only those columns? | Notes |
|------|-----|-----------------------------|-------|
| Interface, closed | Getters matching properties (`getName()`), nested (`getCategoryName()` or nested interface) | Yes | Simple; proxies created per row |
| Interface, open | `@Value("#{target.firstName + ' ' + target.lastName}")` | **No** — loads the full entity | Convenience only |
| Class / record DTO | Derived query return type, or JPQL `select new fully.qualified.Dto(...)` | Yes | Plain objects; constructor expression needs the full class name |
| Dynamic | `<T> List<T> find…(…, Class<T> type)` | Depends on type | Caller chooses |
| Native query + interface | `@Query(nativeQuery = true)` with column aliases matching getters | Yes | Useful for reporting SQL |

Projections are **not managed entities**: no dirty checking, no lazy loading, no persistence-context memory — ideal for list screens, exports and APIs.

## Pagination

```java
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.ScrollPosition;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Window;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface ProductPagingRepository extends JpaRepository<Product, Long> {

    Page<Product> findByCategoryName(String category, Pageable pageable);          // content + count query

    Slice<Product> findByPriceGreaterThan(java.math.BigDecimal min, Pageable pageable);  // no count query

    @Query("select p from Product p where p.category.name = :category")               // count query derived
    Page<Product> pageInCategory(String category, Pageable pageable);

    Window<Product> findFirst20ByCategoryNameOrderByIdAsc(String category, ScrollPosition position); // keyset

    static Pageable firstPageByPrice() {
        return PageRequest.of(0, 20, Sort.by("price").descending().and(Sort.by("id")));
    }
}
```

- `Page` runs an extra `COUNT` query; `Slice` fetches `size + 1` rows to know if there is a next slice.
- With `@Query` JPQL, Spring Data derives the count query; for complex or native queries, provide `countQuery`.
- **Keyset scrolling** (`Window` + `ScrollPosition.keyset()`): pass `window.positionAt(window.size() - 1)` to get the next window; constant cost at any depth.
- Never combine a **collection fetch join** with `Pageable` — Hibernate paginates in memory (see [The N+1 Problem](../n-plus-one-problem/content.md)).

## Sorting

- `Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id"))`, or `OrderBy…` in derived method names.
- Sort properties are validated against the entity: unknown names throw `PropertyReferenceException` — validate client-supplied sorts.
- `JpaSort.unsafe("length(name)")` allows function expressions; never pass user input to it.

## Specifications Awareness

```java
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Service;

interface ProductSearchRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
}

final class ProductSpecs {
    private ProductSpecs() {
    }

    static Specification<Product> inCategory(String category) {
        return (root, query, cb) -> cb.equal(root.get("category").get("name"), category);
    }

    static Specification<Product> priceBetween(BigDecimal min, BigDecimal max) {
        return (root, query, cb) -> cb.between(root.get("price"), min, max);
    }

    static Specification<Product> nameContains(String text) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("name")), "%" + text.toLowerCase() + "%");
    }
}

record ProductFilter(String category, BigDecimal minPrice, BigDecimal maxPrice, String q) {
}

@Service
class ProductSearchService {
    private final ProductSearchRepository repository;

    ProductSearchService(ProductSearchRepository repository) {
        this.repository = repository;
    }

    Page<Product> search(ProductFilter filter, Pageable pageable) {
        List<Specification<Product>> specs = new ArrayList<>();
        if (filter.category() != null) {
            specs.add(ProductSpecs.inCategory(filter.category()));
        }
        if (filter.minPrice() != null && filter.maxPrice() != null) {
            specs.add(ProductSpecs.priceBetween(filter.minPrice(), filter.maxPrice()));
        }
        if (filter.q() != null && !filter.q().isBlank()) {
            specs.add(ProductSpecs.nameContains(filter.q()));
        }
        return repository.findAll(Specification.allOf(specs), pageable);   // only present filters apply
    }
}
```

- Each `Specification<T>` is a lambda `(root, query, criteriaBuilder) → Predicate`; combine with `and`, `or`, `not`, `Specification.allOf/anyOf`.
- Values are bound as parameters (no injection), but `root.get("name")` uses strings — the JPA static metamodel (`Product_.name`, generated by `hibernate-jpamodelgen`) makes them type-safe.
- Alternatives: Querydsl (type-safe fluent queries), Query by Example (`Example.of(probe)`) for simple equality filters.

## Internal Behavior

- Closed interface projections and DTO return types make Spring Data generate a select list of only the needed properties; open projections fall back to selecting the entity.
- `Page` responses issue two queries per request; some databases make `COUNT(*)` on large filtered tables expensive.
- Specifications are translated into a Criteria query, which Hibernate converts into SQL like any JPQL.

## Common Mistakes

- Open projections with `@Value` expecting a narrow SELECT.
- `select new Dto(...)` without the fully qualified class name (fails at startup).
- Sorting by unvalidated client input (`PropertyReferenceException` → 500).
- Using `Page` where `Slice` suffices on huge tables.
- Specifications that join collections without `query.distinct(true)` → duplicate rows.

## Common Interview Traps

- **"Projections are only for performance."** They also prevent accidental writes and lazy-loading problems because results are not managed.
- **"Specifications are a Hibernate feature."** They are Spring Data's wrapper around the JPA Criteria API.
- **"`Pageable` makes Hibernate page any query efficiently."** Not with collection fetch joins (in-memory paging) or deep offsets.

## Key Takeaways

- Projections (interface, record DTO, dynamic) read only what you need and return unmanaged objects.
- `Page` = data + count; `Slice` = data + hasNext; `Window` = keyset scrolling.
- Specifications compose optional filters safely; use the metamodel or Querydsl for type safety.
