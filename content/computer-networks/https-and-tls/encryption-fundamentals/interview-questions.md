# Encryption Fundamentals for HTTPS — Interview Questions

## Beginner

### Q1. What is the difference between symmetric and asymmetric encryption?

**Style:** Comparison

<details>
<summary>Answer</summary>

Symmetric encryption uses one shared secret key for encryption and decryption (AES, ChaCha20) — fast, but the key must be shared securely. Asymmetric encryption uses a key pair: a public key that anyone can have and a private key kept secret (RSA, ECC) — slow, but it solves key distribution and enables digital signatures. TLS combines them: asymmetric for authentication and key agreement, symmetric for the data.

</details>

### Q2. What is the difference between encoding, hashing and encryption?

**Style:** Comparison

<details>
<summary>Answer</summary>

Encoding (Base64) changes the representation and is reversible by anyone — no security. Hashing (SHA-256) produces a fixed-size, irreversible fingerprint used for integrity and (with salted slow hashes like bcrypt) password storage. Encryption (AES, RSA) is reversible only with the right key and provides confidentiality.

</details>

## Intermediate

### Q3. Why does TLS not encrypt all data with RSA?

**Style:** Why

<details>
<summary>Answer</summary>

Asymmetric operations are far slower than symmetric ones and have size limits, so encrypting bulk data with them would be impractical. TLS uses asymmetric cryptography only to authenticate the server (certificate signature) and to agree on a shared secret (ECDHE); the actual traffic is encrypted with fast symmetric ciphers (AES-GCM, ChaCha20-Poly1305) using session keys derived from that secret.

</details>

### Q4. What is a digital signature?

<details>
<summary>Answer</summary>

The signer computes a hash of the data and signs it with its private key; anyone with the public key can verify that the signature matches the data. It proves who signed (authentication), that the data was not changed (integrity) and that the signer cannot deny it (non-repudiation). Certificates are signed by CAs this way, and servers sign the TLS handshake.

</details>

## Advanced

### Q5. What is forward secrecy and how does TLS achieve it?

<details>
<summary>Answer</summary>

Forward secrecy means that compromising a server's long-term private key later does not let an attacker decrypt previously recorded sessions. TLS achieves it with ephemeral Diffie-Hellman (ECDHE): each connection generates fresh key-exchange keys that are discarded afterwards, so session keys cannot be recomputed from the long-term key. TLS 1.3 requires ephemeral key exchange; old TLS RSA key transport did not have forward secrecy.

</details>
