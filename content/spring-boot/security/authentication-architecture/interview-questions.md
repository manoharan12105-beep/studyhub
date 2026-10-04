# AuthenticationManager, AuthenticationProvider and UserDetailsService — Interview Questions

## Beginner

### Q1. What is `UserDetailsService`?

<details>
<summary>Answer</summary>

A Spring Security interface with one method, `loadUserByUsername(String)`, that loads a user's data — username, encoded password, authorities and account status — as `UserDetails`, typically from a database. It does not verify passwords.

</details>

### Q2. What is the difference between `AuthenticationManager` and `AuthenticationProvider`?

<details>
<summary>Answer</summary>

`AuthenticationManager` is the entry point that authenticates an `Authentication` request; its usual implementation `ProviderManager` iterates over `AuthenticationProvider`s, each of which supports specific token types and performs the actual verification (e.g. `DaoAuthenticationProvider` for username/password).

</details>

### Q3. What does `DaoAuthenticationProvider` do?

<details>
<summary>Answer</summary>

It authenticates username/password tokens: loads the user through the `UserDetailsService`, checks account status (locked, disabled, expired), verifies the raw password against the stored hash with the `PasswordEncoder`, and returns an authenticated token with the user's authorities.

</details>

## Intermediate

### Q4. Why does Spring Security report "Bad credentials" even when the username does not exist?

<details>
<summary>Answer</summary>

To prevent user enumeration: `DaoAuthenticationProvider` converts `UsernameNotFoundException` into `BadCredentialsException` (`hideUserNotFoundExceptions`) and still performs a password-encoding check so response timing does not reveal whether the user exists.

</details>

### Q5. How do you expose an `AuthenticationManager` for a custom login endpoint?

<details>
<summary>Answer</summary>

Either declare it yourself — `new ProviderManager(daoProvider)` with a `DaoAuthenticationProvider(userDetailsService)` and a `PasswordEncoder` — or obtain the one Spring Security builds via `AuthenticationConfiguration.getAuthenticationManager()`. The login controller calls `authenticate(UsernamePasswordAuthenticationToken.unauthenticated(username, password))`.

</details>

### Q6. How would you add OTP-based login alongside password login?

<details>
<summary>Answer</summary>

Create an `OtpAuthenticationToken` and an `OtpAuthenticationProvider` that supports it, validates the OTP (expiry, attempts, hashed storage) and returns an authenticated token. Register both providers in the `ProviderManager`. The OTP login endpoint (or filter) builds the unauthenticated OTP token and calls the manager.

</details>

## Advanced

### Q7. Should your JPA `User` entity implement `UserDetails`?

<details>
<summary>Answer</summary>

It works, but couples the domain entity to Spring Security and puts a managed entity (possibly with lazy associations) into the `SecurityContext`, where it lives beyond the transaction and may be serialised. A separate immutable `UserDetails` (or Spring's `User`) built in `loadUserByUsername` is safer and clearer.

</details>

### Q8. What happens if `ProviderManager` has no provider supporting the token type?

<details>
<summary>Answer</summary>

It delegates to its parent manager if configured; otherwise it throws `ProviderNotFoundException` (an `AuthenticationException`), which results in a 401. This often indicates a custom token class without a matching provider.

</details>
