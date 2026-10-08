# Lab 14 — Interview Questions

## Beginner

### Q1. How does Let's Encrypt verify that you control the domain?

**Style:** How

<details>
<summary>Answer</summary>

With the HTTP-01 challenge used here: Certbot places a token, Let's Encrypt requests `http://<domain>/.well-known/acme-challenge/<token>` from several locations, and issues the certificate if the right content comes back. That requires DNS pointing to the server and port 80 reachable. (DNS-01, a TXT record, is the alternative for wildcards or servers without port 80.)

</details>

## Intermediate

### Q2. Why use `--dry-run` while setting up Certbot?

**Style:** Why

<details>
<summary>Answer</summary>

It runs the whole process against Let's Encrypt's staging environment without issuing a real certificate, so failed attempts do not count towards production rate limits and nothing on the server changes.

</details>

### Q3. Where does TLS end in your deployment, and is the traffic after that encrypted?

**Style:** Architecture

<details>
<summary>Answer</summary>

TLS terminates at Nginx on the VPS. From Nginx to Spring Boot the traffic is plain HTTP over the server's loopback interface (`127.0.0.1:8080`), which never leaves the machine — acceptable for a single server. Across machines you would encrypt that hop too.

</details>
