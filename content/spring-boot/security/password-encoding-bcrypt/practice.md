# PasswordEncoder and BCrypt — Practice

### P1. Correct verification

**Difficulty:** Easy · **Type:** MCQ

How should a login check compare a submitted password with a stored BCrypt hash?

- A) `encoder.encode(raw).equals(stored)`
- B) `encoder.matches(raw, stored)`
- C) `stored.equals(raw)`
- D) Decrypt the stored hash and compare

<details>
<summary>Answer</summary>

**Answer:** B) `encoder.matches(raw, stored)`

**Explanation:** Re-encoding uses a new random salt, so `equals` fails; BCrypt cannot be decrypted.

</details>

### P2. Read the hash

**Difficulty:** Easy · **Type:** Conceptual

What does `$2a$12$` at the start of a stored hash tell you?

<details>
<summary>Answer</summary>

BCrypt version `2a`, cost factor 12 (2¹² rounds). The next 22 characters are the salt and the last 31 the hash.

</details>

### P3. Migration

**Difficulty:** Hard · **Type:** Design

A legacy system stored unsalted SHA-1 hashes. How do you move to BCrypt without forcing every user to reset?

<details>
<summary>Answer</summary>

Use a `DelegatingPasswordEncoder` with the legacy encoder registered under an id (prefix existing hashes, e.g. `{sha1}…`), so logins still verify. On each successful login, re-hash with BCrypt (`upgradeEncoding` + `UserDetailsPasswordService`). For extra protection immediately, wrap old hashes: store `bcrypt(sha1(password))` for all users now and verify by applying SHA-1 first, then fully migrate on login.

</details>
