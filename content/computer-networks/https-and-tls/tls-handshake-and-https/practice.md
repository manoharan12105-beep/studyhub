# The TLS Handshake and HTTP vs HTTPS — Practice

### P1. Default port

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** HTTPS port

Which port does HTTPS use by default?

- A) 80
- B) 8080
- C) 443
- D) 22

<details>
<summary>Answer</summary>

**Answer:** C) 443

</details>

### P2. What can an observer see?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** HTTPS privacy

You open `https://bank.example.com/accounts?id=42` on café Wi-Fi. Which of these can the café see: server IP, hostname, path `/accounts`, query `id=42`, cookies, response body?

<details>
<summary>Answer</summary>

Server IP and (via DNS/SNI, usually) the hostname. Not the path, query, cookies or body — they are inside the encrypted TLS records.

</details>

### P3. Order the handshake

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** TLS 1.3 sequence

Order: (a) server Certificate, (b) ClientHello, (c) client Finished, (d) ServerHello, (e) CertificateVerify, (f) encrypted HTTP request, (g) TCP handshake.

<details>
<summary>Answer</summary>

(g) → (b) → (d) → (a) → (e) → (server Finished) → (c) → (f).

</details>

### P4. Which mechanism?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** TLS components

Which TLS mechanism: (a) chooses HTTP/2, (b) lets one IP host certificates for 50 domains, (c) proves the server has the private key, (d) makes recorded traffic safe even if the key leaks later.

<details>
<summary>Answer</summary>

(a) ALPN, (b) SNI, (c) CertificateVerify signature, (d) ephemeral ECDHE (forward secrecy).

</details>

### P5. Mixed signals

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** TLS termination, forwarded headers

Behind a TLS-terminating load balancer, a Spring Boot app's login redirects users to `http://…` instead of `https://…`. Why, and how is it fixed?

<details>
<summary>Answer</summary>

The app receives plain HTTP from the load balancer, so it thinks the request scheme is `http` and builds `http` redirect URLs. The load balancer sends `X-Forwarded-Proto: https`; configure Spring Boot to honour forwarded headers (`server.forward-headers-strategy=native` or `framework`), trusting them only from the load balancer.

</details>
