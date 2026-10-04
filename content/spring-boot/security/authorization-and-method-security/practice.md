# Roles, Authorities and Method Security — Practice

### P1. Prefix rules

**Difficulty:** Easy · **Type:** MCQ

A user has authority `ROLE_SELLER`. Which expression grants access?

- A) `hasRole('ROLE_SELLER')`
- B) `hasRole('SELLER')`
- C) `hasAuthority('SELLER')`
- D) `hasRole('seller')`

<details>
<summary>Answer</summary>

**Answer:** B) `hasRole('SELLER')`

**Explanation:** `hasRole` adds the `ROLE_` prefix; `hasAuthority` needs the full string `ROLE_SELLER`.

</details>

### P2. Write the rule

**Difficulty:** Medium · **Type:** Coding

A seller may update only their own products; admins may update any. Write the `@PreAuthorize` using a helper bean `productSecurity` with method `isOwner(Long productId, Authentication auth)`.

<details>
<summary>Answer</summary>

```java
@PreAuthorize("hasRole('ADMIN') or (hasRole('SELLER') and @productSecurity.isOwner(#productId, authentication))")
public void updateProduct(Long productId, String name) {
}
```

The bean checks ownership in the database; the expression combines it with role checks.

</details>

### P3. Ignored annotation

**Difficulty:** Medium · **Type:** Debugging

`@PreAuthorize("hasRole('ADMIN')")` on `UserService.deleteAll()` does nothing; any user can call it through `UserController`. Name two likely causes.

<details>
<summary>Answer</summary>

`@EnableMethodSecurity` is not configured; or the controller calls a non-annotated method of `UserService` that then calls `deleteAll()` via `this` (self-invocation), bypassing the proxy.

</details>
