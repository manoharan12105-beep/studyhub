# Access Tokens, Refresh Tokens and Expiration

**Module:** Spring Security · **Interview priority:** Frequently asked

## Definition

- An **access token** is a short-lived credential (typically a JWT valid for 5–15 minutes) sent with every API request to prove identity and permissions.
- A **refresh token** is a long-lived credential (days to weeks), used **only** at a dedicated endpoint to obtain a new access token without asking for the password again.
- **Token expiration** limits how long a stolen token is useful; **rotation** issues a new refresh token on every use and invalidates the old one, so a stolen refresh token can be detected when it is reused.

## Why It Matters

- Short access tokens alone force frequent logins; long access tokens are dangerous and cannot be revoked. The access + refresh pair solves both.
- "Why do we need refresh tokens?", "Where do you store tokens?" and "How does logout work with JWT?" follow every JWT discussion.

## Access Token

- Sent on every request (`Authorization: Bearer …`), validated statelessly.
- Short lifetime → limited damage if leaked (logs, browser extensions, XSS).
- Contains only what authorization needs (`sub`, roles/scopes, `exp`).

## Refresh Token

- Sent **only** to `POST /api/auth/refresh` (and logout) — rarely exposed.
- Usually an **opaque random string** (not a JWT), stored **server-side as a hash** with user id, expiry, device info and a "family" id — so it can be revoked.
- On refresh: validate → **rotate** (issue new refresh token, revoke the old one) → issue a new access token.
- **Reuse detection:** if an already-used refresh token is presented again, someone copied it — revoke the whole family and force re-login.

## Token Expiration

| Token | Typical lifetime | On expiry |
|-------|------------------|-----------|
| Access token | 5–15 minutes | 401 → client calls refresh endpoint |
| Refresh token | 7–30 days (sliding or absolute) | 401 on refresh → user logs in again |
| Absolute session limit | e.g. 30–90 days | Re-authentication even if active |

Include clock-skew tolerance (a minute) when validating `exp`.

## Flow

```text
login ─► { accessToken (15 min), refreshToken (14 days, stored hashed server-side) }
   … API calls with access token …
access token expires → API returns 401
client ─► POST /api/auth/refresh  (refresh token in HttpOnly cookie or body)
server:  hash(token) found? not revoked? not expired? not already used?
         yes → mark used, store new refresh token (same family) → return new access + refresh tokens
         reused (already used) → revoke entire family → 401 → user must log in
logout ─► revoke the refresh token (and its family); client drops the access token
```

## How It Works

A plain-Java model of rotation with reuse detection (a real implementation stores the records in a database table):

```java
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public class RefreshTokenRotationDemo {

    record StoredToken(String userId, String familyId, Instant expiresAt, boolean used, boolean revoked) {
    }

    static class RefreshTokenService {
        private final Map<String, StoredToken> byHash = new HashMap<>();   // a database table in reality
        private final SecureRandom random = new SecureRandom();
        private final Duration ttl = Duration.ofDays(14);

        String issue(String userId, String familyId) {
            byte[] bytes = new byte[32];
            random.nextBytes(bytes);
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);  // opaque, 256 bits
            byHash.put(sha256(token), new StoredToken(userId, familyId, Instant.now().plus(ttl), false, false));
            return token;                                                  // only the hash is stored
        }

        /** Returns a new refresh token, or empty if the presented one must be rejected. */
        Optional<String> rotate(String presented) {
            String hash = sha256(presented);
            StoredToken stored = byHash.get(hash);
            if (stored == null || stored.revoked() || stored.expiresAt().isBefore(Instant.now())) {
                return Optional.empty();
            }
            if (stored.used()) {                                           // reuse → assume theft
                revokeFamily(stored.familyId());
                return Optional.empty();
            }
            byHash.put(hash, new StoredToken(stored.userId(), stored.familyId(), stored.expiresAt(), true, false));
            return Optional.of(issue(stored.userId(), stored.familyId()));
        }

        void revokeFamily(String familyId) {
            byHash.replaceAll((h, t) -> t.familyId().equals(familyId)
                    ? new StoredToken(t.userId(), t.familyId(), t.expiresAt(), t.used(), true) : t);
        }

        private static String sha256(String value) {
            try {
                return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                        .digest(value.getBytes(StandardCharsets.UTF_8)));
            } catch (Exception e) {
                throw new IllegalStateException(e);
            }
        }
    }

    public static void main(String[] args) {
        RefreshTokenService service = new RefreshTokenService();
        String first = service.issue("asha", UUID.randomUUID().toString());

        Optional<String> second = service.rotate(first);
        System.out.println("1. refresh with first token:         " + (second.isPresent() ? "new token issued" : "rejected"));

        Optional<String> third = service.rotate(second.orElseThrow());
        System.out.println("2. refresh with second token:        " + (third.isPresent() ? "new token issued" : "rejected"));

        Optional<String> stolen = service.rotate(first);                   // attacker replays an old token
        System.out.println("3. replay of first (used) token:     " + (stolen.isPresent() ? "new token issued" : "rejected, family revoked"));

        Optional<String> legit = service.rotate(third.orElseThrow());       // even the latest token is now dead
        System.out.println("4. legitimate client's latest token: " + (legit.isPresent() ? "new token issued" : "rejected -> log in again"));
    }
}
```

**Output:**

```text
1. refresh with first token:         new token issued
2. refresh with second token:        new token issued
3. replay of first (used) token:     rejected, family revoked
4. legitimate client's latest token: rejected -> log in again
```

A fast hash (SHA-256) is fine for refresh tokens because they are 256-bit random values — unlike passwords, they cannot be guessed.

## Where to Store Tokens (Clients)

| Storage | XSS can steal? | CSRF risk? | Notes |
|---------|----------------|------------|-------|
| JavaScript memory | During the attack only | No | Lost on page reload — combine with a refresh cookie |
| `localStorage` / `sessionStorage` | **Yes** | No | Simple, but any injected script reads it |
| **HttpOnly, Secure, SameSite cookie** | No (JS cannot read) | Yes → SameSite + CSRF protection | Good for refresh tokens, path-scoped to `/api/auth/refresh` |
| Mobile secure storage (Keychain/Keystore) | n/a | n/a | Standard for native apps |

A common browser setup: access token in memory, refresh token in an `HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh` cookie. Or a BFF keeping tokens entirely server-side.

## Logout and Revocation

- **Logout:** delete/revoke the refresh token (and family) server-side; client discards the access token.
- **Access tokens remain valid until `exp`.** For immediate revocation (password change, account compromise): a denylist of `jti`s until expiry (Redis with TTL), or a `tokenVersion` per user stored in the token and checked against the database/cache.
- **Password change / "log out everywhere":** revoke all refresh token families of the user and bump the token version.

## Comparison: Access Token vs Refresh Token

| Aspect | Access token | Refresh token |
|--------|--------------|---------------|
| Purpose | Call APIs | Obtain new access tokens |
| Lifetime | Minutes | Days/weeks |
| Sent to | Every API request | Only the refresh/logout endpoint |
| Format | Usually JWT (stateless validation) | Usually opaque random string |
| Server storage | None (stateless) | Hashed in DB, with family, expiry, used/revoked flags |
| Revocation | Hard before expiry (denylist) | Easy (delete/flag) |
| Theft impact | Limited by short TTL | High → rotation + reuse detection, HttpOnly cookie |

## Common Mistakes

- One long-lived JWT (days) with no refresh token or revocation.
- Refresh tokens as JWTs that are never stored → cannot be revoked.
- Storing refresh tokens in plain text in the database.
- Accepting refresh tokens at every endpoint, or access tokens at the refresh endpoint.
- No rotation, so a stolen refresh token works until it expires.

## Common Interview Traps

- **"Logout deletes the JWT on the server."** Stateless access tokens are not stored; logout revokes the refresh token, and access tokens die at expiry unless denylisted.
- **"Refresh tokens make JWT fully stateless."** Proper refresh tokens are server-side state.
- **"localStorage is fine because we use HTTPS."** HTTPS does not protect against XSS reading storage.

## Key Takeaways

- Access token: short-lived, stateless, sent everywhere. Refresh token: long-lived, opaque, stored hashed, sent to one endpoint.
- Rotate refresh tokens on every use; reuse → revoke the family.
- Logout = revoke refresh tokens; immediate access revocation needs a denylist or token version.
