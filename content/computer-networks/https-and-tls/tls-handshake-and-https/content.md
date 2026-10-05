# The TLS Handshake and HTTP vs HTTPS

**Module:** HTTPS and TLS · **Interview priority:** Core

## What Is It?

**HTTPS** is HTTP sent inside a **TLS** (Transport Layer Security) connection, normally on TCP port **443**. TLS gives the HTTP conversation confidentiality (encryption), integrity (tamper detection) and server authentication (certificates). **SSL** is TLS's obsolete predecessor; the name survives in phrases like "SSL certificate". Current versions: **TLS 1.3** (2018, preferred) and TLS 1.2.

## Why It Exists

Plain HTTP crosses networks you do not control in clear text: on café Wi-Fi anyone can read passwords, cookies and JWTs (sniffing), ISPs or attackers can inject content, and a fake server can impersonate a real one. TLS fixes all three before any HTTP byte is sent.

## HTTP vs HTTPS

| | HTTP | HTTPS |
|---|------|-------|
| Port | 80 | 443 |
| Encryption | None — readable by anyone on the path | TLS encrypts everything after the handshake |
| Integrity | Content can be modified in transit | Modification is detected |
| Server identity | Not verified | Verified with a certificate |
| Visible to observers | Everything | Server IP, port, and usually the hostname (SNI); not the path, headers or body |
| Setup cost | TCP handshake | TCP + TLS handshake (+1 RTT with TLS 1.3) |
| Browser treatment | "Not secure" | Padlock; required for HTTP/2, many browser APIs, cookies with `Secure` |

## How It Works: the TLS 1.3 Handshake (simplified)

```text
Client                                                      Server
  │── TCP handshake (SYN, SYN-ACK, ACK) ─────────────────────►│
  │                                                           │
  │── ClientHello ───────────────────────────────────────────►│
  │   TLS versions, cipher suites, random,                    │
  │   key share (client's ECDHE public value),                │
  │   SNI = "api.example.com", ALPN = [h2, http/1.1]          │
  │                                                           │
  │◄── ServerHello: chosen cipher + server's key share ───────│  ← both now compute the same
  │    ── from here everything is encrypted ──                │    shared secret (ECDHE) and
  │◄── EncryptedExtensions (ALPN = h2)                        │    derive handshake keys
  │◄── Certificate (server cert + intermediates)              │
  │◄── CertificateVerify (signature with server private key)  │
  │◄── Finished (MAC over the whole handshake)                │
  │                                                           │
  │  client verifies certificate chain, hostname, signature   │
  │── Finished ──────────────────────────────────────────────►│
  │══ HTTP request encrypted with session (traffic) keys ═════►│
```

### What each step achieves

| Step | Purpose |
|------|---------|
| **ClientHello / ServerHello** | Agree on TLS version and **cipher suite** (e.g. `TLS_AES_256_GCM_SHA384`); exchange random values and ECDHE key shares |
| **Key exchange (ECDHE)** | Both sides compute the same secret without sending it → **session keys**; ephemeral → forward secrecy |
| **Certificate** | Server presents its identity (domain ↔ public key, signed by a CA) |
| **CertificateVerify** | Server signs the handshake with its **private key** → proves it owns the certificate |
| **Finished** | Each side MACs the whole handshake → detects any tampering with the negotiation |
| **SNI** (Server Name Indication) | Tells the server which hostname the client wants, so it can pick the right certificate on a shared IP |
| **ALPN** | Negotiates the application protocol (`h2` or `http/1.1`) inside the handshake |

### TLS 1.2 vs 1.3

| | TLS 1.2 | TLS 1.3 |
|---|---------|---------|
| Handshake round trips | 2 RTT | **1 RTT** (0-RTT on resumption, with replay caveats) |
| Key exchange | RSA key transport or (EC)DHE | **Only ephemeral (EC)DHE** → always forward secrecy |
| Ciphers | Many, including weak ones | Few, all AEAD (AES-GCM, ChaCha20-Poly1305) |
| Certificate encrypted? | No | Yes |

### The real thing

The `curl -v https://example.com` capture shows the same messages:

```text
* ALPN: curl offers h2,http/1.1
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
* TLSv1.3 (IN), TLS handshake, Server hello (2):
* TLSv1.3 (IN), TLS handshake, Encrypted Extensions (8):
* TLSv1.3 (IN), TLS handshake, Certificate (11):
* TLSv1.3 (IN), TLS handshake, CERT verify (15):
* TLSv1.3 (IN), TLS handshake, Finished (20):
* TLSv1.3 (OUT), TLS handshake, Finished (20):
* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384 / X25519MLKEM768 / id-ecPublicKey
* ALPN: server accepted h2
```

(Some "change cipher spec" lines were removed; TLS 1.3 sends them only for compatibility with old middleboxes.)

### The complete HTTPS request flow

1. DNS: resolve `api.example.com` → IP.
2. TCP three-way handshake to port 443 (1 RTT).
3. TLS handshake (1 RTT in TLS 1.3): agree keys, verify certificate.
4. Encrypted HTTP request → encrypted response.
5. The connection is kept alive for later requests; TLS **session resumption** (tickets/PSK) makes later new connections cheaper.

## Real World

- **TLS termination:** usually at the load balancer, CDN or ingress — it holds the certificate, decrypts, and forwards to Spring Boot (plain HTTP inside a private network, or re-encrypted). The app learns the original scheme from `X-Forwarded-Proto`.
- Spring Boot can also serve HTTPS directly (`server.ssl.*` / SSL bundles), e.g. for mTLS between services.
- **HSTS** (`Strict-Transport-Security`) tells browsers to always use HTTPS for a domain, blocking downgrade attacks.
- HTTPS hides the path and data but not *which site* you visit: DNS queries and SNI usually reveal it (Encrypted Client Hello and DNS over HTTPS address this).

## Common Traps

- **"HTTPS encrypts the URL's hostname too."** The path and query are encrypted; the hostname is usually visible via DNS and SNI.
- **"TLS encrypts with the certificate's public key."** It authenticates with the certificate; data is encrypted with symmetric session keys from ECDHE.
- **"SSL and TLS are different things you choose between."** SSL is the deprecated ancestor; all SSL versions are insecure.
- **"HTTPS makes the website safe."** It protects the connection, not against bugs, XSS or a malicious site.

## Interview Follow-up

- *"Walk me through what happens in the TLS handshake."* See the table above: hello + key shares → shared secret → certificate + signature → Finished → encrypted HTTP.
- *"Why is HTTPS slower than HTTP, and how is that minimised?"* One extra RTT and some CPU; minimised by TLS 1.3, session resumption, keep-alive, HTTP/2–3 and terminating TLS close to users (CDN).

## Key Takeaways

- HTTPS = HTTP over TLS on port 443: confidentiality, integrity, authentication.
- TLS 1.3 handshake: ClientHello/ServerHello with ECDHE key shares → session keys → Certificate + CertificateVerify → Finished. 1 RTT.
- Asymmetric crypto authenticates and agrees keys; symmetric crypto encrypts the HTTP data.
- SNI picks the certificate; ALPN picks HTTP/2 or 1.1. TLS is often terminated at the load balancer.
