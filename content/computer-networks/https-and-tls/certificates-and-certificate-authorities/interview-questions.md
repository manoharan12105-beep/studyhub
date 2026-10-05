# Certificates and Certificate Authorities — Interview Questions

## Beginner

### Q1. What is a TLS certificate?

<details>
<summary>Answer</summary>

An X.509 document that binds a domain name (in the Subject Alternative Names) to a public key, with a validity period and the issuer's details, digitally signed by a Certificate Authority. It lets clients verify that the public key they receive really belongs to the server they intended to reach.

</details>

### Q2. What is a Certificate Authority?

<details>
<summary>Answer</summary>

A trusted organisation that verifies a requester controls a domain (and, for OV/EV, the organisation's identity) and signs certificates. Root CA certificates are pre-installed in operating systems and browsers; intermediates issued by them sign server certificates.

</details>

## Intermediate

### Q3. How does a browser verify a server's certificate?

**Style:** What happens internally

<details>
<summary>Answer</summary>

It builds the chain from the server's certificate through the intermediates the server sent up to a root in its trust store, verifying each signature. It checks that the hostname matches a SAN entry, that the current date is within the validity period, that the certificate is meant for server authentication, and (best effort) that it is not revoked (OCSP/CRL, often stapled). During the handshake the server must also sign handshake data with the matching private key.

</details>

### Q4. Why can't an attacker simply copy a website's certificate and use it?

**Style:** Why

<details>
<summary>Answer</summary>

The certificate is public and contains only the public key. In the TLS handshake the server must prove possession of the corresponding private key by signing the handshake transcript (CertificateVerify in TLS 1.3). Without the private key the attacker cannot produce a valid signature, so the handshake fails.

</details>

## Advanced

### Q5. Your Spring Boot service calling an internal HTTPS API fails with `PKIX path building failed`. What is wrong and how do you fix it properly?

**Style:** Debugging

<details>
<summary>Answer</summary>

The JVM could not build a chain from the API's certificate to a CA in its trust store — usually because the API uses a private company CA or a self-signed certificate, or the server does not send its intermediate certificate. Fix: make the server send the full chain; import the company root CA into a trust store the application uses (e.g. an SSL bundle configured via `spring.ssl.bundle.*` or the JVM `cacerts`). Do not disable certificate or hostname verification — that removes protection against man-in-the-middle attacks.

</details>

### Q6. What is mutual TLS?

<details>
<summary>Answer</summary>

TLS in which the client also presents a certificate and proves possession of its private key, so both sides authenticate each other. It is used for service-to-service authentication in microservices and service meshes, B2B APIs and zero-trust networks.

</details>
