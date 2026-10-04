# PasswordEncoder and BCrypt — Interview Questions

## Beginner

### Q1. Why must passwords be hashed instead of encrypted?

<details>
<summary>Answer</summary>

The system never needs the original password — it only needs to check a login attempt — so a one-way hash is sufficient and safer. Encryption is reversible: anyone who obtains the key can recover every password.

</details>

### Q2. Why is the BCrypt hash different each time for the same password?

<details>
<summary>Answer</summary>

BCrypt generates a random salt for every hash and embeds it in the result. Different salts give different hashes. To verify, `matches` extracts the salt and cost from the stored hash, hashes the attempt with them, and compares.

</details>

### Q3. How do you configure password encoding in Spring Security?

<details>
<summary>Answer</summary>

Declare a `PasswordEncoder` bean — `new BCryptPasswordEncoder()` or `PasswordEncoderFactories.createDelegatingPasswordEncoder()`. Use `encode` when storing passwords; `DaoAuthenticationProvider` uses `matches` during login.

</details>

## Intermediate

### Q4. Why not use SHA-256 with a salt?

<details>
<summary>Answer</summary>

SHA-256 is designed to be fast; GPUs compute billions of hashes per second, so leaked salted hashes can be brute-forced quickly for common passwords. Password-hashing functions like BCrypt, scrypt and Argon2 are intentionally slow (and, for scrypt/Argon2, memory-hard) with tunable cost, making each guess expensive.

</details>

### Q5. What is the BCrypt cost factor, and how do you choose it?

<details>
<summary>Answer</summary>

The base-2 logarithm of the number of key-expansion rounds (default 10). Each increment doubles the hashing time. Choose the highest value that keeps a single hash around a few hundred milliseconds on production hardware, and revisit it as hardware improves; too high a cost turns the login endpoint into a denial-of-service target.

</details>

### Q6. What is `DelegatingPasswordEncoder` for?

<details>
<summary>Answer</summary>

It prefixes hashes with an algorithm id (`{bcrypt}`, `{argon2}`…), encodes new passwords with the current default, and verifies existing hashes with whichever algorithm their prefix names. This allows changing algorithms or cost without forcing password resets, and with `upgradeEncoding` hashes can be upgraded on the next successful login.

</details>

## Advanced

### Q7. What is BCrypt's 72-byte limit and how should an application handle it?

<details>
<summary>Answer</summary>

BCrypt only uses the first 72 bytes of input; longer passwords would collide on their first 72 bytes. Spring Security's `BCryptPasswordEncoder` rejects passwords longer than 72 bytes. Enforce a maximum length (in bytes, considering multi-byte UTF-8) in validation, or use Argon2, which has no such limit.

</details>

### Q8. Beyond hashing, how would you protect a login endpoint?

<details>
<summary>Answer</summary>

Rate limiting per IP and per account, account lockout or increasing delays after failures, CAPTCHA after repeated failures, generic error messages, MFA, breached-password checks at registration, HTTPS only, monitoring for credential-stuffing patterns, and never logging passwords.

</details>
