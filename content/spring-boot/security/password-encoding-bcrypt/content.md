# PasswordEncoder and BCrypt

**Module:** Spring Security · **Interview priority:** Core

## Definition

A **`PasswordEncoder`** turns a raw password into a one-way **hash** for storage (`encode`) and checks a login attempt against the stored hash (`matches`). **BCrypt** is a deliberately **slow, salted** password-hashing function and Spring Security's default choice; its **cost factor** (strength) makes each guess expensive for attackers.

## Why It Matters

- Leaked password tables are common; how you hash decides whether attackers recover passwords in hours or centuries.
- "Why BCrypt instead of SHA-256?" and "Why is the BCrypt hash different every time?" are frequent interview questions.

## PasswordEncoder

```java
public interface PasswordEncoder {
    String encode(CharSequence rawPassword);                                   // at registration / password change
    boolean matches(CharSequence rawPassword, String encodedPassword);         // at login
    default boolean upgradeEncoding(String encodedPassword) { return false; }  // re-hash with stronger settings?
}
```

Rules:

- **Never** store plain text or reversibly encrypted passwords.
- **Never** compare hashes with `equals` — always `matches` (salts differ per hash).
- Hash with a **password-hashing function** (BCrypt, Argon2, scrypt, PBKDF2) — not a fast general hash.

## BCrypt

How it defends:

1. **Salt** — a random 128-bit salt per password, stored inside the hash. Equal passwords produce different hashes, so precomputed rainbow tables and "same hash = same password" analysis fail.
2. **Cost factor** — `2^cost` rounds of key expansion. Default strength 10; each +1 doubles the time. Tune so one hash takes roughly 100 ms–1 s on your servers.
3. **Slowness by design** — a GPU that computes billions of SHA-256 hashes per second manages far fewer BCrypt hashes.

Hash format (60 characters):

```text
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
 │  │  └────────── 22 chars salt ──────┘└──────── 31 chars hash ────────┘
 │  └── cost (log2 rounds)
 └── algorithm version
```

Limit: BCrypt uses at most **72 bytes** of input; Spring Security's encoder rejects longer passwords — set a max length on the password DTO (`@Size(max = 72)`).

## How It Works

```java
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;

public class PasswordEncodingDemo {

    public static void main(String[] args) {
        PasswordEncoder bcrypt = new BCryptPasswordEncoder();          // strength (log rounds) 10 by default

        String first = bcrypt.encode("S3cret!pass");
        String second = bcrypt.encode("S3cret!pass");

        System.out.println("hash prefix:          " + first.substring(0, 7));   // $2a$10$ = version + cost
        System.out.println("hash length:          " + first.length());
        System.out.println("same password, same hash? " + first.equals(second));      // random salt each time
        System.out.println("matches(correct):     " + bcrypt.matches("S3cret!pass", first));
        System.out.println("matches(second hash): " + bcrypt.matches("S3cret!pass", second));
        System.out.println("matches(wrong):       " + bcrypt.matches("s3cret!pass", first));

        PasswordEncoder delegating = PasswordEncoderFactories.createDelegatingPasswordEncoder();
        String stored = delegating.encode("S3cret!pass");
        System.out.println("delegating prefix:    " + stored.substring(0, stored.indexOf('}') + 1));
        System.out.println("delegating matches:   " + delegating.matches("S3cret!pass", stored));
    }
}
```

**Output:**

```text
hash prefix:          $2a$10$
hash length:          60
same password, same hash? false
matches(correct):     true
matches(second hash): true
matches(wrong):       false
delegating prefix:    {bcrypt}
delegating matches:   true
```

`matches` reads the salt and cost from the stored hash, re-hashes the attempt with them and compares.

### DelegatingPasswordEncoder

`PasswordEncoderFactories.createDelegatingPasswordEncoder()` stores an **algorithm id prefix** (`{bcrypt}$2a$10$…`, `{argon2}…`, `{pbkdf2}…`). It encodes new passwords with the current default (BCrypt) and can still verify old hashes of other algorithms — enabling **migration** without forcing resets. With `upgradeEncoding` support, Spring Security re-hashes a user's password at successful login (via `UserDetailsPasswordService`).

### Registering the encoder

```java
@Bean
PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);       // or PasswordEncoderFactories.createDelegatingPasswordEncoder()
}
```

Use it at registration — `user.setPasswordHash(passwordEncoder.encode(request.password()))` — and let `DaoAuthenticationProvider` call `matches` at login.

## Comparison

| Algorithm | Kind | Suitable for passwords? | Notes |
|-----------|------|------------------------|-------|
| MD5, SHA-1 | Fast hash (broken) | **No** | Collisions, extremely fast to brute-force |
| SHA-256 / SHA-512 (even salted) | Fast hash | **No** | Designed for speed — GPUs test billions per second |
| **BCrypt** | Adaptive password hash | Yes | Default in Spring; cost factor; 72-byte limit |
| **Argon2id** | Memory-hard password hash | Yes (OWASP's first choice) | Resists GPU/ASIC attacks via memory cost; needs Bouncy Castle in Spring |
| scrypt | Memory-hard | Yes | |
| PBKDF2 | Iterated HMAC | Yes (FIPS environments) | Needs very high iteration counts |
| AES encryption | Reversible | **No** | Key compromise reveals all passwords |

## Common Mistakes

- Hashing with SHA-256/MD5, or with a single global salt.
- Comparing `encode(raw).equals(stored)` — always false with BCrypt.
- Encoding the password twice (in the service and in an entity listener).
- Cost too high (login becomes a CPU-based denial-of-service vector) or too low (weak).
- Logging raw passwords in request logs.

## Common Interview Traps

- **"BCrypt is encryption."** It is a one-way hash; you cannot decrypt it.
- **"Different hashes for the same password means BCrypt is broken."** The random salt makes them different by design; `matches` still works.
- **"Salting alone makes SHA-256 safe."** Salt stops rainbow tables but not fast brute force; you need a slow function.

## Key Takeaways

- `PasswordEncoder.encode` at registration, `matches` at login; never `equals`.
- BCrypt = salt + adaptive cost; hash format `$2a$cost$salt+hash`, 60 chars, 72-byte input limit.
- Prefer a `DelegatingPasswordEncoder` for future algorithm upgrades; Argon2id is the modern alternative.
