# Domain, DNS and HTTPS — Practice

### P1. Which record?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** DNS records

Which record points `api.example.com` to the IPv4 address `203.0.113.10`?

- A) `CNAME`
- B) `MX`
- C) `A`
- D) `TXT`

<details>
<summary>Answer</summary>

**Answer:** C) `A`

</details>

### P2. Check DNS

**Difficulty:** Easy · **Type:** Command · **Concepts:** dig

Print only the IPv4 address that `api.example.com` resolves to.

<details>
<summary>Answer</summary>

```bash
# Illustrative
dig +short api.example.com A
```

</details>

### P3. Before Certbot

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** HTTP-01 prerequisites

Which is **not** required before `sudo certbot --nginx -d api.example.com`?

- A) The A record points to this server
- B) Port 80 is reachable
- C) Port 443 already has a certificate
- D) Nginx has a server block for the name

<details>
<summary>Answer</summary>

**Answer:** C) Port 443 already has a certificate

</details>

### P4. Test renewal

**Difficulty:** Easy · **Type:** Command · **Concepts:** certbot renew

Test that renewal will work without issuing a real certificate.

<details>
<summary>Answer</summary>

```bash
# Illustrative
sudo certbot renew --dry-run
```

</details>

### P5. Write the redirect

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** HTTP → HTTPS

Write the port-80 server block for `api.example.com` that sends every request to HTTPS with the same path and query.

<details>
<summary>Answer</summary>

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.example.com;
    return 301 https://$host$request_uri;
}
```

</details>

### P6. Propagation

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** TTL

The A record had TTL 86400 and you changed it to a new IP an hour ago. Some users still reach the old server. Why, and how long can it last?

<details>
<summary>Answer</summary>

Resolvers cached the old answer for up to 86 400 seconds (24 hours). Some users can see the old IP until their resolver's cached copy expires — up to a day after the change. Lowering the TTL in advance avoids this.

</details>

### P7. Redirect loop

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** forwarded proto

After enabling HTTPS, the browser shows "too many redirects" on a page where the Spring app redirects HTTP to HTTPS itself. What is missing?

<details>
<summary>Answer</summary>

The app does not know the client used HTTPS, so it keeps redirecting: Nginx must send `proxy_set_header X-Forwarded-Proto $scheme;` and Spring Boot needs `server.forward-headers-strategy: native`.

</details>

### P8. Certificate details

**Difficulty:** Hard · **Type:** Command · **Concepts:** openssl

Print the issuer and expiry date of the certificate served by `api.example.com:443`.

<details>
<summary>Answer</summary>

```bash
# Illustrative
echo | openssl s_client -connect api.example.com:443 -servername api.example.com 2>/dev/null | openssl x509 -noout -issuer -enddate
```

</details>

### P9. Validation fails over IPv6

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** AAAA records

`dig +short api.example.com A` is correct, but Certbot reports a connection failure to an IPv6 address. The VPS has no IPv6 configured. Fix it.

<details>
<summary>Answer</summary>

Remove the stale or wrong `AAAA` record (or configure IPv6 on the server and Nginx correctly). Let's Encrypt tries IPv6 when an AAAA record exists.

</details>
