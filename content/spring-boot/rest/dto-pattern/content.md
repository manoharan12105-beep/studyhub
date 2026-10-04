# DTOs: Entity vs DTO

**Module:** REST API Development · **Interview priority:** Core

## Definition

A **DTO (Data Transfer Object)** is a simple object that carries data across a boundary — here, between the API and its clients. It has no business logic and no persistence mapping. An **entity** is a JPA-managed object that maps to database tables and lives inside the persistence context. REST APIs should accept **request DTOs** and return **response DTOs**, keeping entities inside the service and repository layers.

## Why It Matters

- "Why use DTOs?" and "Entity vs DTO" come up in nearly every Spring Boot project discussion.
- Returning entities causes real production bugs: leaked password hashes, `LazyInitializationException`, N+1 queries during serialisation, infinite JSON recursion, mass-assignment vulnerabilities.

## DTO

Java records are ideal DTOs: immutable, concise, with `equals`/`hashCode`/`toString`, and supported by Jackson and Bean Validation.

```java
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

// What the client may send when registering
record RegisterUserRequest(
        @NotBlank @Size(max = 80) String name,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 72) String password) {
}

// What the client may change in its profile (no email, no role, no password here)
record UpdateProfileRequest(@Size(max = 80) String name, @Size(max = 15) String phone) {
}

// What the client receives (no password hash, no internal flags)
record UserResponse(long id, String name, String email, Instant createdAt) {
}
```

Different operations get **different shapes**: create, update and response DTOs rarely have identical fields.

## Entity vs DTO

```java
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "users")
class User {
    enum Role { CUSTOMER, ADMIN }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;                  // must never leave the server

    @Enumerated(EnumType.STRING)
    private Role role = Role.CUSTOMER;            // must not be settable by clients

    private boolean locked;
    private Instant createdAt = Instant.now();

    protected User() {                            // required by JPA
    }

    User(String name, String email, String passwordHash) {
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
    }

    Long getId() { return id; }
    String getName() { return name; }
    String getEmail() { return email; }
    Instant getCreatedAt() { return createdAt; }

    void rename(String newName) {
        this.name = newName;
    }
}
```

| Aspect | Entity | DTO |
|--------|--------|-----|
| Purpose | Persist domain state | Transfer data across the API boundary |
| Managed by | JPA persistence context | Nobody — plain object |
| Shape follows | Database schema and relationships | Client's needs for one use case |
| Contains | All columns, relationships, lazy proxies | Only exposed fields |
| Mutability | Mutable (dirty checking) | Usually immutable (records) |
| Validation | Database constraints, invariants | Input validation (`@NotBlank`, `@Email`) |
| Changes when | Schema changes | API contract changes (versioned) |
| Serialised to JSON | Should not be | Yes |

## Why Use DTOs?

1. **Security — no over-exposure:** the response contains only chosen fields; `passwordHash`, `role`, `locked` never leak.
2. **Security — no mass assignment:** binding JSON directly into an entity lets a client send `"role": "ADMIN"`; a request DTO simply has no such field.
3. **Decoupling:** renaming a column or splitting a table does not break clients; the API contract changes only when you decide.
4. **No lazy-loading surprises:** mapping happens in the service, inside the transaction, so every needed field is loaded deliberately (and efficiently) — no `LazyInitializationException` or hidden N+1 queries during JSON serialisation.
5. **No recursion:** bidirectional relationships (`Order ↔ OrderItem`) cause infinite JSON; DTOs are trees.
6. **Use-case-specific validation:** the create request requires a password; the update request does not allow one.
7. **Documentation:** OpenAPI schemas generated from DTOs describe exactly the contract.

## Mapping

```java
import org.springframework.stereotype.Component;

@Component
class UserMapper {
    UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getCreatedAt());
    }
}
```

Options:

| Approach | Pros | Cons |
|----------|------|------|
| Manual methods / static factories (`UserResponse.from(user)`) | Explicit, debuggable, no dependency | Boilerplate for large objects |
| **MapStruct** (annotation processor) | Generates type-safe mapping code at compile time; fast | Build setup; learning curve |
| ModelMapper (reflection) | Little code | Runtime reflection, silent mistakes |
| JPA **DTO projections** | Database returns only needed columns — no entity at all | Read-only, query-specific |

Where to map: the **service** returns DTOs (or the controller maps service results), but entities should not reach Jackson. For read-heavy endpoints, [projections](../../jpa-hibernate/projections-pagination-specifications/content.md) skip entity loading entirely.

## Common Mistakes

- One "god DTO" reused for create, update and response — clients see fields they cannot set, validation becomes conditional.
- Mapping outside the transaction and hitting lazy associations.
- Returning `Page<User>` entities from a controller.
- Copying entity fields blindly with reflection utilities (`BeanUtils.copyProperties(request, entity)`), reintroducing mass assignment.

## Common Interview Traps

- **"DTOs are just duplicate classes; entities are fine for small apps."** Even small apps leak password hashes and expose mass-assignment risks.
- **"`@JsonIgnore` on entity fields solves it."** It hides fields from responses, but still couples the API to the schema and does nothing for lazy loading or update shapes.
- **"DTO = Value Object."** A value object is a domain concept with equality by value and invariants; a DTO is a data carrier for transfer.

## Key Takeaways

- Entities model persistence; DTOs model the API contract.
- Request DTOs prevent mass assignment and carry validation; response DTOs prevent leaks and lazy-loading/recursion issues.
- Map in the service (manually or with MapStruct), or use projections for read endpoints.
