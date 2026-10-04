# Projections, Pagination, Sorting and Specifications — Practice

### P1. Cheapest read

**Difficulty:** Easy · **Type:** MCQ

A list screen needs only product id, name and price for 50 products. Which repository return type reads the least data?

- A) `List<Product>`
- B) `List<ProductSummary>` where `ProductSummary` is a record `(Long id, String name, BigDecimal price)`
- C) `List<Object>`
- D) An open interface projection using `@Value("#{target.name}")`

<details>
<summary>Answer</summary>

**Answer:** B) `List<ProductSummary>` where `ProductSummary` is a record `(Long id, String name, BigDecimal price)`

**Explanation:** A DTO projection selects only the three columns and creates no managed entities; open projections load full entities.

</details>

### P2. Optional filters

**Difficulty:** Medium · **Type:** Coding

Add a `Specification<Product>` for "price at most `max`" and combine it with `inCategory` only when both filters are present.

<details>
<summary>Answer</summary>

```java
static Specification<Product> priceAtMost(BigDecimal max) {
    return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("price"), max);
}

// in the service:
// List<Specification<Product>> specs = new ArrayList<>();
// if (category != null) specs.add(ProductSpecs.inCategory(category));
// if (max != null) specs.add(ProductSpecs.priceAtMost(max));
// repository.findAll(Specification.allOf(specs), pageable);
```

</details>

### P3. Unknown sort property

**Difficulty:** Medium · **Type:** Debugging

`GET /api/products?sort=popularity,desc` returns 500 with `PropertyReferenceException: No property 'popularity' found for type 'Product'`. How should the API behave, and how do you implement it?

<details>
<summary>Answer</summary>

It should return 400 for unsupported sort fields. Validate `pageable.getSort()` against a whitelist before calling the repository (throwing a domain exception mapped to 400), or map `PropertyReferenceException` to 400 in the global exception handler.

</details>
