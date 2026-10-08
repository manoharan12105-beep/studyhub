# Domain, DNS and HTTPS — Interview Questions

## Beginner

### Q1. What is an A record?

**Style:** What

<details>
<summary>Answer</summary>

A DNS record that maps a host name to an IPv4 address, for example `api.example.com → 203.0.113.10`. `AAAA` does the same for IPv6.

</details>

### Q2. What is the difference between HTTP and HTTPS?

**Style:** Comparison

<details>
<summary>Answer</summary>

HTTPS is HTTP inside TLS. TLS encrypts the traffic, protects it from modification, and lets the client verify the server's identity with a certificate signed by a trusted CA. Plain HTTP (port 80) is readable and modifiable by anyone on the network path; HTTPS uses port 443.

</details>

### Q3. What is Let's Encrypt?

**Style:** What

<details>
<summary>Answer</summary>

A free, automated certificate authority. Clients such as Certbot prove control of a domain (for example by serving a token over HTTP on port 80), receive a short-lived certificate, and renew it automatically.

</details>

### Q4. What does "DNS propagation" mean?

**Style:** What

<details>
<summary>Answer</summary>

The time until resolvers worldwide return the new value of a record. Nothing is pushed; caches simply expire after the record's TTL. New records usually appear within minutes; changed ones can take up to the previous TTL.

</details>

## Intermediate

### Q5. Certbot fails the HTTP-01 challenge. What do you check?

**Style:** Troubleshooting

<details>
<summary>Answer</summary>

That the A (and any AAAA) record points to this server (`dig +short`); that port 80 is open in ufw and the provider firewall; that Nginx is running with a `server_name` for the domain and is not redirecting the challenge path somewhere unreachable; that no CAA record forbids Let's Encrypt; and that you have not hit rate limits (use `--dry-run`).

</details>

### Q6. How are Let's Encrypt certificates renewed, and how do you know renewal works?

**Style:** How

<details>
<summary>Answer</summary>

Certbot's systemd timer (or cron job) runs `certbot renew` regularly and renews certificates near expiry; the Nginx installer reloads Nginx. Check with `systemctl list-timers | grep certbot`, test with `sudo certbot renew --dry-run`, and monitor the certificate's expiry externally.

</details>

### Q7. What happens, step by step, when a browser opens `https://api.example.com/api/tasks`?

**Style:** Architecture

<details>
<summary>Answer</summary>

DNS resolves the name to the server IP; the browser opens a TCP connection to port 443; the TLS handshake runs — Nginx presents its certificate, the browser validates name, dates and chain, keys are agreed; the HTTP request travels encrypted; Nginx decrypts it, matches the server block, and proxies it over plain HTTP to `127.0.0.1:8080` with `X-Forwarded-*` headers; Spring Boot queries PostgreSQL over the Docker network and responds; Nginx encrypts the response back to the browser.

</details>

### Q8. Why do you configure `X-Forwarded-Proto` when TLS ends at Nginx?

**Style:** Why

<details>
<summary>Answer</summary>

The application receives plain HTTP from Nginx, so without the header it believes the request was HTTP and builds `http://` redirects and links. With `X-Forwarded-Proto: https` and `server.forward-headers-strategy` set, Spring Boot knows the client used HTTPS.

</details>

## Advanced

### Q9. What is HSTS and what is the risk of enabling it carelessly?

**Style:** Trade-off

<details>
<summary>Answer</summary>

`Strict-Transport-Security` tells browsers to use only HTTPS for the host for `max-age` seconds, preventing downgrade attacks. Once a browser has seen it, the site is unreachable over HTTP for that period — if HTTPS breaks (expired certificate) users cannot click through, and `includeSubDomains` breaks every subdomain without HTTPS. Enable it after HTTPS is stable, start with a short `max-age` if unsure.

</details>

### Q10. You are moving the API to a new server. How do you change DNS with minimal disruption?

**Style:** Scenario

<details>
<summary>Answer</summary>

A day ahead, lower the A record's TTL (for example to 300 seconds). Set up the new server fully, including a certificate (DNS-01 validation, or copy the certificate, since HTTP-01 needs DNS pointing to it), and migrate the database with a short write freeze. Switch the A record; keep the old server running until traffic stops arriving after the TTL; then raise the TTL again.

</details>
