# Certificates and Certificate Authorities

**Module:** HTTPS and TLS · **Interview priority:** Core

## What Is It?

A **TLS certificate** (X.509 certificate) is a signed document that binds a **domain name** to a **public key**: "the holder of the private key matching this public key is `example.com`". It is signed by a **Certificate Authority (CA)** — an organisation that browsers and operating systems trust to check that the requester really controls the domain.

## Why It Exists

Encryption alone does not help if you encrypt to the wrong party. A man-in-the-middle could hand you **its own** public key and decrypt everything. The certificate lets your browser confirm that the public key it received really belongs to the site in the address bar — without having met the site before.

## How It Works

### What is inside a certificate

| Field | Example |
|-------|---------|
| Subject / **Subject Alternative Names (SAN)** | `CN=example.com`; SAN: `example.com`, `www.example.com` (browsers check SAN) |
| **Public key** | EC P-256 or RSA 2048 key of the server |
| **Issuer** | The CA that signed it: `Cloudflare TLS Issuing ECC CA 3` |
| **Validity** | `notBefore` / `notAfter` (public certificates are short-lived — at most about a year, and shrinking) |
| Serial number, key usage | Identification, allowed uses |
| **Signature** | The issuer's digital signature over all of the above |

The real `curl -v https://example.com` capture shows these fields:

```text
* Server certificate:
*   subject: CN=example.com
*   start date: Sep 26 22:49:11 2026 GMT
*   expire date: Dec 25 22:56:35 2026 GMT
*   issuer: C=US; O=SSL Corporation; CN=Cloudflare TLS Issuing ECC CA 3
*   Certificate level 0: Public key type EC/prime256v1 (256/128 Bits/secBits), signed using ecdsa-with-SHA256
*   Certificate level 1: Public key type EC/prime256v1 (256/128 Bits/secBits), signed using ecdsa-with-SHA384
*   Certificate level 2: Public key type EC/secp384r1 (384/192 Bits/secBits), signed using ecdsa-with-SHA384
```

Levels 0, 1, 2 are the **chain**: the server's certificate, an intermediate CA, and a CA closer to the root.

### The chain of trust

```text
Root CA            (self-signed; pre-installed in the OS/browser "trust store")
   │ signs
Intermediate CA    (online issuing CA; root keys stay offline)
   │ signs
example.com        (leaf / server certificate)
```

The server sends its leaf certificate **plus the intermediates**. The client builds the chain up to a root it already trusts.

### How the client verifies a certificate

1. **Signature chain:** each certificate's signature verifies with the public key of the certificate above it, ending at a trusted root in the local trust store.
2. **Name:** the hostname the client connected to matches a SAN entry (wildcards like `*.example.com` cover one label).
3. **Validity period:** the current time is between `notBefore` and `notAfter`.
4. **Key usage / purpose:** allowed for server authentication.
5. **Revocation** (best effort): not revoked — via OCSP (often stapled by the server) or CRLs.
6. **Proof of possession:** during the handshake the server **signs** handshake data with the private key matching the certificate's public key — so a copied certificate alone is useless.

If any check fails, the browser shows a warning (`NET::ERR_CERT_DATE_INVALID`, `ERR_CERT_COMMON_NAME_INVALID`, "self-signed certificate", "unable to get local issuer certificate").

### How a site gets a certificate

1. Generate a key pair; create a **CSR** (certificate signing request) with the public key and domain.
2. Prove control of the domain to the CA — **DV** (domain validation: a DNS TXT record or an HTTP file, as in Let's Encrypt's ACME protocol). OV/EV add organisation checks.
3. The CA signs and returns the certificate; it is installed on the server, load balancer or CDN together with the private key.

## Real World

- **Let's Encrypt** issues free 90-day DV certificates automatically; cloud load balancers and CDNs manage certificates for you.
- **Expired certificates** are a common outage cause — automate renewal and monitor expiry.
- **Java and certificates:** the JVM has its own trust store (`cacerts`). Calling a service whose certificate is signed by a private company CA fails with `PKIX path building failed … unable to find valid certification path to requested target` until that CA is added to a trust store. Never "fix" it by disabling certificate validation.
- **Self-signed certificates** are fine for local development and internal testing only.
- **mTLS** (mutual TLS): the client also presents a certificate — common between microservices and in service meshes.

## Common Traps

- **"HTTPS (the padlock) means the site is trustworthy."** It means the connection is encrypted to whoever controls that domain — phishing sites have valid certificates too.
- **"The certificate contains the private key."** It contains the **public** key; the private key stays on the server.
- **"The browser contacts the CA on every visit."** Trust is checked locally against pre-installed roots; only revocation checks may contact the CA (and are often stapled).
- **"Self-signed is as secure as CA-signed."** The encryption is the same, but nobody vouched for the identity, so a MITM cannot be detected.

## Interview Follow-up

- *"What does a CA actually do?"* Verifies domain control and signs certificates that clients trust through the root store.
- *"How does certificate pinning differ?"* An app accepts only specific keys/certificates for a host, ignoring other CAs — stronger, but risky to rotate.

## Key Takeaways

- A certificate binds a domain name to a public key and is signed by a CA.
- Chain of trust: leaf → intermediate(s) → root in the client's trust store.
- Clients check signatures, hostname (SAN), validity dates, purpose, revocation — and the server proves it holds the private key.
- Padlock = encrypted and the domain is verified, not "the site is honest".
