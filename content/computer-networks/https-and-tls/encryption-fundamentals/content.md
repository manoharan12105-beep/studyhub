# Encryption Fundamentals for HTTPS

**Module:** HTTPS and TLS · **Interview priority:** Core

> [!NOTE]
> This is not a cryptography course. It covers exactly what you need to explain HTTPS, TLS and SSH in an interview.

## What Is It?

Secure communication needs four properties:

| Goal | Question | Provided by |
|------|----------|-------------|
| **Confidentiality** | Can anyone else read it? | Encryption |
| **Integrity** | Was it changed on the way? | MACs / authenticated encryption, hashes |
| **Authentication** | Am I talking to the real server? | Certificates + digital signatures |
| **Forward secrecy** | If a key leaks later, are past sessions safe? | Ephemeral key exchange |

Two families of encryption make this possible: **symmetric** (one shared key) and **asymmetric** (a public/private key pair). TLS uses both.

## Why It Exists

Data crosses Wi-Fi networks, ISPs and routers you do not control. Without encryption anyone on the path can read passwords and tokens (packet sniffing) or change content (man-in-the-middle). Encryption hides the content; authentication makes sure you are encrypting *to the right party*.

## How It Works

### Symmetric encryption

One **shared secret key** encrypts and decrypts.

```text
plaintext ──[ encrypt with key K ]──► ciphertext ──[ decrypt with key K ]──► plaintext
```

- Examples: **AES** (AES-128/256-GCM), **ChaCha20-Poly1305**.
- **Fast** — hardware-accelerated; used for all bulk data in TLS, SSH, VPNs, disk encryption.
- **Problem: key distribution.** How do two parties who have never met agree on K over a network that attackers can watch?

### Asymmetric (public-key) encryption

A **key pair**: a **public key** anyone may know, and a **private key** only the owner has. What one key does, only the other can undo.

| Use | Who uses which key | Result |
|-----|--------------------|--------|
| **Encryption** | Sender encrypts with the recipient's **public** key | Only the private-key holder can decrypt |
| **Digital signature** | Owner signs with its **private** key | Anyone can verify with the **public** key that the owner signed and nothing changed |

- Examples: **RSA**, **ECDSA**/Ed25519 (signatures), **(EC)DH** — Diffie-Hellman key agreement.
- **Slow** (hundreds to thousands of times slower than AES) — used only for small things: agreeing on keys and signing.

### Key exchange: Diffie-Hellman

Two parties each pick a secret number, exchange **public values**, and each combines the other's public value with its own secret to compute the **same shared secret** — which never crossed the network. An eavesdropper sees only the public values and cannot compute the secret (a hard mathematical problem). Modern TLS uses **ephemeral elliptic-curve DH (ECDHE)**, e.g. X25519 — new keys per connection, which gives **forward secrecy**.

### Hashes and MACs

- A **hash** (SHA-256) maps any data to a fixed-size fingerprint; changing one bit changes the fingerprint completely, and it cannot be reversed. Used inside signatures and certificates.
- A **MAC** (or the tag of authenticated encryption like AES-GCM) is a keyed fingerprint: the receiver detects any modification.

### Putting it together (the hybrid approach)

```text
1. Asymmetric: the server proves its identity with a certificate + signature
2. Asymmetric: (EC)DHE key agreement → both sides compute the same secret
3. Symmetric:  that secret → session keys → AES-GCM / ChaCha20 encrypts all data (fast)
```

This is the structure of the [TLS handshake](../tls-handshake-and-https/content.md) and of [SSH](../../application-layer/ssh-protocol/content.md).

## Comparison

| | Symmetric | Asymmetric |
|---|-----------|------------|
| Keys | One shared secret | Public + private pair |
| Speed | Very fast | Slow |
| Key distribution | Hard (must share secretly) | Easy (publish the public key) |
| Used in TLS for | Encrypting application data | Authentication (signatures), key exchange |
| Examples | AES, ChaCha20 | RSA, ECDSA, Ed25519, ECDH |

### Encoding vs hashing vs encryption

| | Reversible? | Needs a key? | Purpose | Example |
|---|-------------|--------------|---------|---------|
| Encoding | Yes, by anyone | No | Format conversion | Base64, URL encoding |
| Hashing | No | No (or yes, for MACs) | Integrity, fingerprints, password storage (with salt, slow hashes like bcrypt) | SHA-256 |
| Encryption | Yes, with the key | Yes | Confidentiality | AES, RSA |

## Real World

- `curl -v https://example.com` printed `SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384 / X25519MLKEM768 / id-ecPublicKey`: **AES-256-GCM** for data (symmetric), **SHA-384** in key derivation, an **X25519 + ML-KEM** hybrid key exchange (ML-KEM adds protection against future quantum computers), and an **EC** public key in the server certificate.
- Spring Security stores passwords with **bcrypt** — a deliberately slow, salted hash, not encryption.

## Common Traps

- **"HTTPS encrypts everything with the server's public key."** Public-key operations only authenticate and agree on keys; data is encrypted with symmetric session keys.
- **"Base64 is encryption."** It is encoding — anyone can decode it.
- **"Signing = encrypting with the private key."** Conceptually close for RSA, but signatures are about proving origin and integrity, not secrecy.
- **"Hashing passwords with SHA-256 is enough."** Fast hashes are brute-forced easily; use bcrypt/scrypt/Argon2 with salt.

## Interview Follow-up

- *"Why not use only asymmetric encryption?"* Too slow for bulk data; symmetric is orders of magnitude faster.
- *"Why not only symmetric?"* No safe way to share the key with a stranger over an insecure network, and no way to prove identity.

## Key Takeaways

- Symmetric: one shared key, fast — encrypts the data.
- Asymmetric: public/private pair, slow — signatures (identity) and key exchange.
- Diffie-Hellman agrees on a shared secret without sending it; ephemeral DH gives forward secrecy.
- TLS and SSH = asymmetric to authenticate and agree + symmetric to encrypt.
- Encoding ≠ hashing ≠ encryption.
