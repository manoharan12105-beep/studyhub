# The TLS Handshake and HTTP vs HTTPS — Interview Questions

## Beginner

### Q1. What is the difference between HTTP and HTTPS?

**Style:** Comparison

<details>
<summary>Answer</summary>

HTTPS is HTTP carried inside TLS, normally on port 443 instead of 80. TLS encrypts the traffic (confidentiality), detects tampering (integrity) and verifies the server's identity with a certificate (authentication). HTTP sends everything in clear text and cannot detect impersonation. HTTPS costs an extra handshake round trip, minimised by TLS 1.3, resumption and connection reuse.

</details>

### Q2. What is TLS and how does it relate to SSL?

<details>
<summary>Answer</summary>

Transport Layer Security is the protocol that secures connections (HTTPS, SMTPS, database connections) with encryption, integrity and authentication. SSL was its predecessor (SSL 2.0/3.0) and is insecure and disabled; "SSL certificate" is just an old name for a TLS certificate. Current versions are TLS 1.2 and 1.3.

</details>

## Intermediate

### Q3. Explain the TLS 1.3 handshake.

**Style:** What happens internally

<details>
<summary>Answer</summary>

The client sends ClientHello with supported versions and ciphers, a random value, its ECDHE key share, SNI and ALPN. The server replies with ServerHello (chosen cipher, its key share); both compute the shared secret and derive handshake keys, so the rest is encrypted. The server sends its certificate chain, a CertificateVerify signature with its private key, and Finished (a MAC over the transcript). The client verifies the chain, hostname and signature, sends Finished, and both switch to traffic keys for the HTTP data. It takes one round trip.

</details>

### Q4. How does HTTPS prevent a man-in-the-middle attack?

**Style:** Why

<details>
<summary>Answer</summary>

The attacker can intercept packets but cannot present a valid certificate for the domain signed by a trusted CA, and cannot produce the CertificateVerify signature without the real server's private key. If it substitutes its own certificate, the client's verification fails and the connection is aborted (browser warning). The Finished MACs also detect any tampering with the handshake negotiation.

</details>

### Q5. What does SNI do, and what does it reveal?

<details>
<summary>Answer</summary>

Server Name Indication puts the requested hostname in the ClientHello so a server hosting many sites on one IP can choose the right certificate. Because it is sent before encryption is set up (unless Encrypted Client Hello is used), observers can see which hostname you are connecting to, though not the path or content.

</details>

## Advanced

### Q6. Where should TLS be terminated for a Spring Boot application behind a load balancer?

**Style:** Scenario

<details>
<summary>Answer</summary>

Commonly at the load balancer/ingress: it holds and renews certificates centrally, offloads TLS CPU work, and can inspect HTTP for L7 routing. Traffic to the app then travels in a private network, either as plain HTTP or re-encrypted (TLS or mTLS) when internal traffic must also be protected (zero trust, compliance). The app must trust `X-Forwarded-Proto`/`X-Forwarded-For` only from the LB so it generates correct HTTPS redirects and logs real client IPs.

</details>

### Q7. Why is TLS 1.3 faster and more secure than TLS 1.2?

<details>
<summary>Answer</summary>

Faster: the client sends its key share in the first message, so the handshake needs 1 RTT instead of 2, and resumed sessions can send 0-RTT data. More secure: only ephemeral (EC)DHE key exchange (always forward secrecy), only AEAD ciphers, removal of RSA key transport, legacy algorithms and renegotiation, and encryption of the certificate and most of the handshake.

</details>
