# JWT Structure: Header, Payload and Signature

**Module:** Spring Security · **Interview priority:** Core

## Definition

A **JSON Web Token (JWT, RFC 7519)** is a compact, URL-safe string carrying **claims** (statements about a subject) that is **signed** so the receiver can verify it was issued by a trusted party and not modified. A signed JWT (JWS) has three Base64url-encoded parts separated by dots:

```text
xxxxx.yyyyy.zzzzz
header.payload.signature
```

## Why It Matters

- JWTs are the most common bearer token format in Spring Boot APIs; interviewers ask about each part, what is visible, and why tampering fails.
- Misunderstandings ("JWT is encrypted", "alg none", storing secrets in claims) lead to real vulnerabilities.

## JWT

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9                       ← header (Base64url)
.eyJzdWIiOiJhc2hhIiwicm9sZXMiOlsiUk9MRV9VU0VSIl0sImV4cCI6MTc2NzIyNjUwMH0   ← payload (Base64url)
.Hk3x…                                                      ← signature (Base64url)
```

Signed ≠ encrypted: anyone holding the token can **read** the header and payload; only the signature prevents **changing** them. (Encrypted JWTs — JWE — exist but are less common.)

## Header

Metadata about the token:

```json
{ "alg": "HS256", "typ": "JWT", "kid": "2026-10-key" }
```

- `alg` — signing algorithm. `HS256` (HMAC-SHA256, one shared secret) or `RS256`/`ES256` (private key signs, public key verifies).
- `kid` — key id, used to pick the right key during key rotation.

## Payload

The **claims**:

| Claim | Meaning |
|-------|---------|
| `sub` | Subject — the user id/username |
| `iss` | Issuer — who created the token |
| `aud` | Audience — who the token is for |
| `exp` | Expiration time (seconds since epoch) |
| `iat` | Issued at |
| `nbf` | Not valid before |
| `jti` | Unique token id (useful for revocation) |
| custom | e.g. `roles`, `tenantId`, `scope` |

Keep the payload **small and non-sensitive**: no passwords, no personal data you would not show the user, no large permission lists (tokens travel on every request).

## Signature

```text
signature = HMACSHA256( base64url(header) + "." + base64url(payload), secret )      for HS256
signature = RSASSA-PKCS1-v1_5-SHA256( same input, privateKey )                      for RS256
```

The server recomputes (HMAC) or verifies (RSA/EC) the signature over the received header and payload. Any change to either part — e.g. `ROLE_USER` → `ROLE_ADMIN` — produces a different expected signature, and verification fails. Without the secret/private key an attacker cannot produce a valid signature.

## How It Works

The program builds and verifies an HS256 token using only the JDK — what libraries like jjwt do internally.

```java
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/** Builds and verifies an HS256 JWT with only the JDK, to show what libraries do. */
public class JwtAnatomy {

    private static final Base64.Encoder B64URL = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder B64URL_DECODER = Base64.getUrlDecoder();

    static String hmacSha256(String data, byte[] secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret, "HmacSHA256"));
        return B64URL.encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
    }

    static boolean verify(String token, byte[] secret) throws Exception {
        String[] parts = token.split("\\.");
        String expected = hmacSha256(parts[0] + "." + parts[1], secret);
        // constant-time comparison avoids timing attacks
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.US_ASCII),
                parts[2].getBytes(StandardCharsets.US_ASCII));
    }

    public static void main(String[] args) throws Exception {
        byte[] secret = "a-256-bit-secret-known-only-to-the-server!".getBytes(StandardCharsets.UTF_8);

        String header = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
        String payload = "{\"sub\":\"asha\",\"roles\":[\"ROLE_USER\"],\"iat\":1767225600,\"exp\":1767226500}";

        String encodedHeader = B64URL.encodeToString(header.getBytes(StandardCharsets.UTF_8));
        String encodedPayload = B64URL.encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        String signature = hmacSha256(encodedHeader + "." + encodedPayload, secret);
        String token = encodedHeader + "." + encodedPayload + "." + signature;

        System.out.println("header part:  " + encodedHeader);
        System.out.println("payload part: " + encodedPayload.substring(0, 20) + "...");
        System.out.println("anyone can decode the payload: "
                + new String(B64URL_DECODER.decode(encodedPayload), StandardCharsets.UTF_8));
        System.out.println("valid signature?    " + verify(token, secret));

        // An attacker changes the role in the payload but cannot recompute the signature without the secret
        String forgedPayload = B64URL.encodeToString(
                payload.replace("ROLE_USER", "ROLE_ADMIN").getBytes(StandardCharsets.UTF_8));
        String forged = encodedHeader + "." + forgedPayload + "." + signature;
        System.out.println("forged token valid? " + verify(forged, secret));
    }
}
```

**Output:**

```text
header part:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
payload part: eyJzdWIiOiJhc2hhIiwi...
anyone can decode the payload: {"sub":"asha","roles":["ROLE_USER"],"iat":1767225600,"exp":1767226500}
valid signature?    true
forged token valid? false
```

In real code use a maintained library — jjwt, Nimbus JOSE + JWT (used by Spring Security's OAuth2 resource server) — which also validates `exp`/`nbf`, algorithms and key sizes. See [JWT Authentication Flow](../jwt-authentication-flow/content.md).

## HS256 vs RS256

| | HS256 (HMAC) | RS256 / ES256 (asymmetric) |
|--|--------------|----------------------------|
| Keys | One shared secret signs and verifies | Private key signs; public key verifies |
| Who can create tokens | Anyone with the secret (every verifier!) | Only the private-key holder |
| Distribution | Secret must be shared with every service | Publish public keys (JWKS endpoint) |
| Use | One application issues and verifies | Auth server issues, many services verify (OAuth2/OIDC) |
| Key size | ≥ 256-bit random secret | RSA ≥ 2048-bit / EC P-256 |

## Common Vulnerabilities

- **`alg: none`** — accepting unsigned tokens. Libraries must be configured with the expected algorithm/key (modern libraries reject `none` by default).
- **Algorithm confusion** — verifying an HS256 token with an RSA *public* key as the HMAC secret. Pin the algorithm per key.
- **Weak secrets** — short, guessable HMAC secrets can be brute-forced offline from any token. Use 256+ random bits from a secrets manager.
- **No expiry / long expiry** — stolen tokens remain valid.
- **Sensitive data in payload** — it is readable.
- **Not validating `iss`/`aud`** — tokens issued for another service are accepted.

## Common Mistakes

- Treating Base64url as encryption.
- Putting the secret in `application.properties` in the repository.
- Comparing signatures with `String.equals` in hand-written code (timing leak) — use libraries.
- Using JWTs as long-lived session replacements without refresh/revocation design.

## Common Interview Traps

- **"JWT payload is encrypted."** It is encoded; signing protects integrity, not confidentiality.
- **"JWT means secure authentication."** Security depends on key management, short expiry, validation of algorithm/issuer/audience, and safe client storage.
- **"The server must store issued JWTs."** Not for validation; only for revocation or refresh-token handling.

## Key Takeaways

- JWT = `base64url(header).base64url(payload).base64url(signature)`.
- Header: algorithm/key id; payload: claims (`sub`, `exp`, `iat`, `iss`, `aud`, custom); signature: integrity proof.
- Readable by anyone, unforgeable without the key; validate signature, algorithm, expiry, issuer and audience.
