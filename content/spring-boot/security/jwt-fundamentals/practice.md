# JWT Structure: Header, Payload and Signature — Practice

### P1. What protects the token?

**Difficulty:** Easy · **Type:** MCQ

Which part of a JWT prevents tampering with the claims?

- A) Header
- B) Payload
- C) Signature
- D) Base64url encoding

<details>
<summary>Answer</summary>

**Answer:** C) Signature

</details>

### P2. Decode it

**Difficulty:** Easy · **Type:** Behavior

What does the header `eyJhbGciOiJIUzI1NiJ9` decode to?

<details>
<summary>Answer</summary>

`{"alg":"HS256"}` — the header jjwt 0.12 writes for HS256 tokens. Decoding needs no key.

</details>

### P3. Payload review

**Difficulty:** Medium · **Type:** Code analysis

A team's access token payload is `{"sub":"42","email":"a@x.com","password":"$2a$10$…","aadhaar":"1234…","roles":[…],"exp":…}`. What would you change?

<details>
<summary>Answer</summary>

Remove the password hash and personal identifiers — the payload is readable by anyone holding the token (browser storage, logs, proxies). Keep only what authorization needs (`sub`, roles/scopes, `exp`, `iat`, `iss`, `aud`, perhaps `jti`) and load other data server-side when necessary.

</details>
