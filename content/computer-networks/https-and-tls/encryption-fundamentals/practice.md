# Encryption Fundamentals for HTTPS — Practice

### P1. Bulk data

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** symmetric encryption in TLS

Which algorithm encrypts the actual page data in an HTTPS connection?

- A) RSA
- B) AES-GCM
- C) SHA-256
- D) Base64

<details>
<summary>Answer</summary>

**Answer:** B) AES-GCM

**Explanation:** Symmetric ciphers encrypt bulk data. RSA (if used) is for signatures; SHA-256 is a hash; Base64 is encoding.

</details>

### P2. Which key?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** public/private key use

(a) To send Bob a secret only he can read, which key do you use? (b) To prove a message came from you, which key do you use? (c) Which key does Bob use to verify (b)?

<details>
<summary>Answer</summary>

(a) Bob's public key. (b) Your private key (sign). (c) Your public key.

</details>

### P3. Classify

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** encoding vs hashing vs encryption

Classify: Base64, SHA-256, AES-256, bcrypt, URL encoding, RSA.

<details>
<summary>Answer</summary>

Encoding: Base64, URL encoding. Hashing: SHA-256, bcrypt (slow password hash). Encryption: AES-256 (symmetric), RSA (asymmetric).

</details>

### P4. Leaked key

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** forward secrecy

An attacker recorded a year of encrypted traffic to a server that uses TLS 1.3, then stole the server's private key. Can they decrypt the recordings? What can they do?

<details>
<summary>Answer</summary>

No — TLS 1.3 uses ephemeral ECDHE, so each session's keys were never derivable from the private key (forward secrecy). With the stolen key they could impersonate the server in future connections until the certificate is revoked and replaced.

</details>
