# AuthenticationManager, AuthenticationProvider and UserDetailsService

**Module:** Spring Security · **Interview priority:** Core

## Definition

- **`AuthenticationManager`** — the single entry point for authentication: `Authentication authenticate(Authentication request)`. It returns a fully authenticated `Authentication` or throws an `AuthenticationException`. The standard implementation is **`ProviderManager`**.
- **`AuthenticationProvider`** — one strategy for authenticating one kind of credential (`supports(Class)` + `authenticate`). `ProviderManager` asks each provider in turn.
- **`DaoAuthenticationProvider`** — the provider for username/password: it loads the user with a **`UserDetailsService`** and checks the password with a **`PasswordEncoder`**.
- **`UserDetailsService`** — `UserDetails loadUserByUsername(String username)`: loads user data (username, password hash, authorities, account flags) from your store.
- **`UserDetails`** — Spring Security's view of a user record.

## Why It Matters

- Implementing login (form or JWT) means wiring these pieces correctly; "What is the role of `UserDetailsService`?" and "AuthenticationManager vs AuthenticationProvider" are standard questions.
- Knowing the flow explains error messages (`BadCredentialsException`, `DisabledException`) and how to add new login methods (OTP, API keys).

## AuthenticationManager

```text
UsernamePasswordAuthenticationToken.unauthenticated("asha", "secret")
        │
        ▼
ProviderManager.authenticate()
   for each AuthenticationProvider that supports(UsernamePasswordAuthenticationToken):
        DaoAuthenticationProvider
           ├─ userDetailsService.loadUserByUsername("asha")   → UserDetails (hash, authorities, flags)
           │     not found → UsernameNotFoundException (reported as BadCredentialsException)
           ├─ pre-checks: locked? disabled? account expired?   → LockedException / DisabledException …
           ├─ passwordEncoder.matches("secret", hash)          → mismatch → BadCredentialsException
           ├─ post-checks: credentials expired?
           └─ return UsernamePasswordAuthenticationToken.authenticated(userDetails, null, authorities)
   no provider succeeded → ProviderNotFoundException / last exception; parent manager (if any) is tried
        │
        ▼
authenticated Authentication (credentials erased) → stored in SecurityContext / used to issue a JWT
```

- `ProviderManager` can have a **parent** manager and erases credentials after success.
- By default `DaoAuthenticationProvider` hides "user not found" as `BadCredentialsException` (`hideUserNotFoundExceptions = true`) and performs a dummy password check, so attackers cannot discover valid usernames by message or timing.

## AuthenticationProvider

Write one when credentials are not username/password-from-a-store — e.g. OTP login or API keys:

```java
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;

class ApiKeyAuthentication extends UsernamePasswordAuthenticationToken {
    ApiKeyAuthentication(String apiKey) {
        super(apiKey, apiKey);
    }
}

class ApiKeyAuthenticationProvider implements AuthenticationProvider {

    @Override
    public Authentication authenticate(Authentication authentication) {
        String key = (String) authentication.getCredentials();
        if (!"partner-key-123".equals(key)) {                 // in reality: look up a hashed key
            throw new BadCredentialsException("Invalid API key");
        }
        return UsernamePasswordAuthenticationToken.authenticated(
                "partner-app", null, AuthorityUtils.createAuthorityList("ROLE_PARTNER"));
    }

    @Override
    public boolean supports(Class<?> authenticationType) {
        return ApiKeyAuthentication.class.isAssignableFrom(authenticationType);
    }
}
```

## UserDetails

| Method | Meaning |
|--------|---------|
| `getUsername()`, `getPassword()` | Identity and **encoded** password |
| `getAuthorities()` | Roles/permissions (`ROLE_ADMIN`, `order:write`) |
| `isAccountNonLocked()`, `isEnabled()`, `isAccountNonExpired()`, `isCredentialsNonExpired()` | Account state checked during login (default methods return `true`) |

Spring's `User` class (`User.withUsername(..).password(..).roles(..).build()`) is a ready implementation. For JPA users, either adapt your entity or implement a separate `UserDetails` wrapper — keeping the security model separate from the entity avoids leaking security concerns into the domain.

## UserDetailsService

```java
import java.util.List;
import java.util.Optional;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

record AppUser(String email, String passwordHash, String role, boolean active) {
}

interface AppUserRepository {
    Optional<AppUser> findByEmailIgnoreCase(String email);
}

@Service
class DatabaseUserDetailsService implements UserDetailsService {
    private final AppUserRepository users;

    DatabaseUserDetailsService(AppUserRepository users) {
        this.users = users;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        AppUser user = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("No user " + email));
        return User.withUsername(user.email())
                .password(user.passwordHash())                       // BCrypt hash from the database
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + user.role())))
                .disabled(!user.active())
                .build();
    }
}
```

If exactly one `UserDetailsService` bean exists (and a `PasswordEncoder`), Spring Boot/Security wire a `DaoAuthenticationProvider` automatically and stop creating the default in-memory user.

## Exposing the AuthenticationManager

A login endpoint (e.g. for JWT) needs the manager. Two common ways:

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
class AuthenticationConfig {

    // Option A: build it explicitly (clear and testable)
    @Bean
    AuthenticationManager authenticationManager(UserDetailsService userDetailsService, PasswordEncoder encoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);  // Security 6.3+
        provider.setPasswordEncoder(encoder);
        return new ProviderManager(provider);
    }

    // Option B (alternative): reuse the one Spring Security builds
    // @Bean
    // AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
    //     return config.getAuthenticationManager();
    // }
}
```

`DaoAuthenticationProvider`'s no-argument constructor was deprecated in Spring Security 6.3 and removed in 7; pass the `UserDetailsService` to the constructor. A complete login + JWT example is in [JWT Authentication Flow](../jwt-authentication-flow/content.md).

## Comparison

| | `AuthenticationManager` | `AuthenticationProvider` | `UserDetailsService` |
|--|--------------------------|--------------------------|----------------------|
| Role | Entry point / coordinator | One authentication strategy | Loads user data |
| Typical implementation | `ProviderManager` | `DaoAuthenticationProvider`, custom | Your database-backed service, `InMemoryUserDetailsManager` |
| Checks password? | Delegates | `DaoAuthenticationProvider` does (via `PasswordEncoder`) | No |
| Called by | Filters, login endpoints | `ProviderManager` | `DaoAuthenticationProvider`, JWT filters |

## Common Mistakes

- Storing plain-text passwords or comparing passwords manually in the login controller instead of `authenticationManager.authenticate`.
- Returning different error messages for "user not found" and "wrong password" (user enumeration).
- Putting a JPA entity with lazy collections as the principal; then serialising it or accessing it outside a transaction.
- Defining both a custom `AuthenticationProvider` and a `UserDetailsService` and being surprised which is used — check the `ProviderManager` configuration.

## Common Interview Traps

- **"`UserDetailsService` authenticates the user."** It only loads user data; the provider verifies the password.
- **"`AuthenticationManager` and `AuthenticationProvider` are the same."** The manager coordinates possibly many providers.
- **"Throw `UsernameNotFoundException` to the client."** It is converted to `BadCredentialsException`; clients should see one generic message.

## Key Takeaways

- `AuthenticationManager` (`ProviderManager`) → `AuthenticationProvider`s → (`DaoAuthenticationProvider` → `UserDetailsService` + `PasswordEncoder`).
- `UserDetailsService.loadUserByUsername` returns `UserDetails`: username, hash, authorities, account flags.
- Write a custom provider for new credential types; expose the manager as a bean for login endpoints.
