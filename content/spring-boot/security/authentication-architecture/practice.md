# AuthenticationManager, AuthenticationProvider and UserDetailsService — Practice

### P1. Who checks the password?

**Difficulty:** Easy · **Type:** MCQ

In username/password authentication, which component compares the submitted password with the stored hash?

- A) `UserDetailsService`
- B) `DaoAuthenticationProvider` using a `PasswordEncoder`
- C) `SecurityContextHolder`
- D) The controller

<details>
<summary>Answer</summary>

**Answer:** B) `DaoAuthenticationProvider` using a `PasswordEncoder`

</details>

### P2. Manual login

**Difficulty:** Medium · **Type:** Code analysis

```java
@PostMapping("/login")
String login(@RequestBody LoginRequest r) {
    User u = userRepository.findByEmail(r.email()).orElseThrow(() -> new RuntimeException("No such user"));
    if (!u.getPassword().equals(r.password())) {
        throw new RuntimeException("Wrong password");
    }
    return jwtService.generate(u);
}
```

List the problems.

<details>
<summary>Answer</summary>

Plain-text password comparison (passwords must be hashed and checked with `PasswordEncoder.matches`); different messages reveal whether an email exists; generic `RuntimeException`s become 500 instead of 401; account status (locked/disabled) is ignored; and it bypasses Spring Security's authentication machinery (events, lockout handling). Use `authenticationManager.authenticate(...)` and map `AuthenticationException` to 401.

</details>

### P3. Disabled users

**Difficulty:** Medium · **Type:** Coding

Users have an `active` flag. How do you make deactivated users fail login with Spring Security's standard mechanism?

<details>
<summary>Answer</summary>

Map the flag in `loadUserByUsername`: `User.withUsername(...).disabled(!user.active())...build()`. `DaoAuthenticationProvider`'s pre-authentication checks then throw `DisabledException`, which results in 401 (map it to a clear message if desired).

</details>
