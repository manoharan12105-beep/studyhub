# JWT Structure: Header, Payload and Signature — Interview Questions

## Beginner

### Q1. What are the three parts of a JWT?

<details>
<summary>Answer</summary>

The header (algorithm and token type, e.g. `{"alg":"HS256","typ":"JWT"}`), the payload (claims such as `sub`, `exp`, roles) and the signature (computed over the encoded header and payload with a secret or private key). Each part is Base64url-encoded and they are joined with dots.

</details>

### Q2. Is the JWT payload encrypted?

<details>
<summary>Answer</summary>

No. In a signed JWT the payload is only Base64url-encoded, so anyone with the token can read it. The signature guarantees integrity and authenticity, not confidentiality. Never put secrets in it; use JWE if the content must be encrypted.

</details>

### Q3. Why can't a user change their role inside the token?

<details>
<summary>Answer</summary>

The signature covers the header and payload. If the payload changes, the signature the server computes (or verifies with the public key) no longer matches, and validation fails. Producing a new valid signature requires the server's secret or private key.

</details>

## Intermediate

### Q4. What is the difference between HS256 and RS256?

<details>
<summary>Answer</summary>

HS256 uses one shared secret for signing and verifying (HMAC-SHA256), so every verifier could also mint tokens. RS256 signs with a private key and verifies with a public key, so only the issuer can create tokens and verifiers can get public keys from a JWKS endpoint — the standard for OAuth2/OIDC with many services.

</details>

### Q5. What are registered claims?

<details>
<summary>Answer</summary>

Standard claim names defined by RFC 7519: `iss` (issuer), `sub` (subject), `aud` (audience), `exp` (expiration), `nbf` (not before), `iat` (issued at), `jti` (token id). Validators should check at least the signature, `exp`, and — in multi-service systems — `iss` and `aud`.

</details>

### Q6. What is the `alg: none` attack?

<details>
<summary>Answer</summary>

An attacker sends a token whose header says `alg: none` and has no signature; a naive library that trusts the header accepts it as valid, allowing arbitrary claims. Prevent it by configuring the verifier with the expected algorithm and key and rejecting unsigned tokens — modern libraries do this by default.

</details>

## Advanced

### Q7. How do you rotate JWT signing keys without logging everyone out?

<details>
<summary>Answer</summary>

Give each key an id (`kid` in the header). Start signing new tokens with the new key while still accepting the old key for verification until all tokens signed with it have expired (access-token TTL), then remove it. With asymmetric keys, publish both public keys in the JWKS during the overlap.

</details>

### Q8. Why is a weak HS256 secret dangerous even if it is never leaked?

<details>
<summary>Answer</summary>

Every issued token contains the data and an HMAC computed with the secret, so an attacker can brute-force or dictionary-attack the secret offline without contacting the server. Once found, they can forge tokens for any user. Use a long random secret (at least 256 bits), stored in a secrets manager — jjwt rejects keys shorter than the algorithm requires.

</details>
