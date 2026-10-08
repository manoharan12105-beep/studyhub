# Domain, DNS and HTTPS

**Module:** Server Deployment · **Interview priority:** Core

## What Is It?

The last step from "a server with an IP" to a real service: a **domain name** that points to the server through **DNS**, and **HTTPS** with a free, automatically renewed certificate from **Let's Encrypt**, terminated by Nginx.

```text
https://api.example.com
   │ 1. DNS: api.example.com → A record → 203.0.113.10
   ▼
Nginx :443  ── 2. TLS handshake with the Let's Encrypt certificate
   │ 3. decrypted request
   ▼
proxy_pass http://127.0.0.1:8080 → Spring Boot → PostgreSQL
```

`example.com` and `203.0.113.10` are reserved documentation names and addresses; use your own domain and server IP.

## Why It Matters

- Browsers mark HTTP sites as "Not secure"; passwords and JWTs sent over HTTP can be read by anyone on the path.
- Many platforms (mobile apps, payment and OAuth providers, modern browser features) require HTTPS.
- A domain lets you move to a new server by changing one DNS record.

## Domain Names and DNS

You buy a domain (`example.com`) from a **registrar**. Its DNS records are kept by a **DNS provider** (often the registrar, or a service such as Cloudflare). Resolvers worldwide ask that provider's authoritative name servers.

| Record | Maps | Example |
|--------|------|---------|
| `A` | Name → IPv4 address | `api.example.com → 203.0.113.10` |
| `AAAA` | Name → IPv6 address | `api.example.com → 2001:db8::10` |
| `CNAME` | Name → another name | `www.example.com → example.com` |
| `CAA` | Which CAs may issue certificates | `0 issue "letsencrypt.org"` |

For this subject you create one **A record**: host `api` (or `@` for the bare domain), value = the VPS IP. Add an `AAAA` record only if the server has IPv6 configured — a wrong AAAA breaks IPv6 clients and certificate validation. Deeper: [DNS Record Types](../../../computer-networks/dns/dns-record-types/content.md).

## DNS Propagation and TTL

Resolvers cache answers for the record's **TTL** (time to live, in seconds). "Propagation" is simply old cached answers expiring. A new record usually works within minutes; a changed record can take up to its old TTL. Lower the TTL (for example to 300) a day before a planned server move.

```bash
# Illustrative: from your laptop
dig +short api.example.com A          # should print your server's IP
dig api.example.com @1.1.1.1          # ask a specific public resolver
nslookup api.example.com              # also available on Windows
```

Deeper: [DNS Caching, TTL, Propagation and Failure Scenarios](../../../computer-networks/dns/dns-caching-ttl-and-failures/content.md).

## HTTP vs HTTPS

| | HTTP | HTTPS |
|---|---|---|
| Port | 80 | 443 |
| Encryption | None — readable and modifiable in transit | TLS: encrypted and integrity-protected |
| Server identity | Not verified | Verified by a certificate the browser trusts |
| Browser | "Not secure" | Padlock |

## TLS Basics

- A **certificate** binds a domain name to a public key and is signed by a **certificate authority (CA)** that browsers trust. Nginx sends the certificate plus intermediate certificates (`fullchain.pem`); it keeps the matching **private key** (`privkey.pem`) secret.
- During the **TLS handshake** the client checks the certificate (name matches, not expired, chains to a trusted root) and both sides agree on session keys; then HTTP flows encrypted.
- Use TLS 1.2 and 1.3 only.

Deeper: [The TLS Handshake and HTTP vs HTTPS](../../../computer-networks/https-and-tls/tls-handshake-and-https/content.md).

## Let's Encrypt and Certbot

**Let's Encrypt** is a free, automated CA. **Certbot** requests a certificate, proves you control the domain, installs it into Nginx and renews it.

Domain validation (the HTTP-01 challenge): Let's Encrypt asks for a token at `http://api.example.com/.well-known/acme-challenge/…`; Certbot serves it through Nginx. So before running Certbot:

1. the A record points to this server (`dig` shows the IP),
2. port **80** is open in ufw and the provider firewall,
3. Nginx has a `server` block with `server_name api.example.com` ([previous lesson](../nginx-reverse-proxy/content.md)).

```bash
# Illustrative: on the VPS (the snap package is Certbot's recommended install)
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d api.example.com
```

**Expected result:** Certbot asks for an email address and agreement to the terms, performs the challenge, reports `Successfully received certificate` with the paths under `/etc/letsencrypt/live/api.example.com/`, and edits your Nginx site to listen on 443 with that certificate (and to redirect HTTP to HTTPS). `https://api.example.com/api/info` now works with a padlock.

## Certificate Renewal

Let's Encrypt certificates are short-lived — 90 days, and Let's Encrypt has announced shorter lifetimes — so renewal must be automatic. The snap package installs a systemd timer that runs `certbot renew` twice a day and renews certificates close to expiry; the Nginx plugin reloads Nginx afterwards.

```bash
# Illustrative
systemctl list-timers | grep certbot     # the scheduled renewal
sudo certbot renew --dry-run             # test renewal against the staging CA
sudo certbot certificates                # domains, expiry dates, paths
```

Add an external check of the certificate's expiry date (most uptime monitors do this), so a broken renewal is noticed weeks before it expires.

## HTTP to HTTPS Redirect

The final site configuration — the same structure Certbot produces, written out so you can read every line. This file passed `nginx -t` with Nginx 1.30.5 and was exercised locally with a self-signed certificate (high ports instead of 80/443): HTTP requests got `301 Moved Permanently` with a `Location: https://…` header, HTTPS requests reached the Task API, and the four security headers were present.

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.example.com;

    # Every plain-HTTP request is redirected to HTTPS.
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name api.example.com;

    ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

The HTTP-01 challenge keeps working with the redirect because Let's Encrypt follows redirects to HTTPS. `http2 on;` is the current syntax (older guides write `listen 443 ssl http2;`, which recent Nginx versions warn about).

> [!WARNING]
> **Common trap:** `Strict-Transport-Security` (HSTS) tells browsers to use only HTTPS for this host for a year. Add it once HTTPS works reliably; do not add `includeSubDomains` unless every subdomain has HTTPS.

## Verification

```bash
# Illustrative: from your laptop
curl -I http://api.example.com/api/info          # 301, Location: https://api.example.com/api/info
curl -s https://api.example.com/api/info         # the app's JSON
curl -sI https://api.example.com | grep -i strict-transport
echo | openssl s_client -connect api.example.com:443 -servername api.example.com 2>/dev/null | openssl x509 -noout -issuer -enddate
```

**Expected result:** the redirect, the JSON, the HSTS header, and an issuer from Let's Encrypt with an expiry date about 90 days ahead.

## Production Relevance

- HTTPS everywhere is the baseline; with Certbot it costs nothing and renews itself.
- Spring Boot must know the original scheme (`X-Forwarded-Proto` + `server.forward-headers-strategy: native`), or it generates `http://` redirects behind an HTTPS proxy.

## Common Mistakes

- Running Certbot before DNS points to the server, or with port 80 closed — the challenge fails.
- A stale or wrong `AAAA` record: Let's Encrypt tries IPv6 when an AAAA record exists, so validation can reach the wrong host or fail.
- Testing repeatedly against production and hitting Let's Encrypt rate limits (use `--dry-run` or `--staging`).
- Never checking renewal; certificates expire silently.
- Mixed content: an HTTPS page loading `http://` API URLs is blocked by browsers.

## Interview Angle

- Explain what happens when a user types `https://api.example.com`: DNS lookup, TCP, TLS handshake and certificate validation, request through Nginx to the app.
- Explain how Let's Encrypt validates domain ownership and why port 80 and DNS must be ready.
- Explain TTL and "DNS propagation".

## Key Takeaways

- An A record maps the domain to the VPS IP; TTL controls how long old answers are cached.
- HTTPS = TLS: encryption, integrity and server identity via a CA-signed certificate.
- Certbot + Nginx: `certbot --nginx -d api.example.com`, automatic renewal by a systemd timer, `certbot renew --dry-run` to test.
- Redirect HTTP to HTTPS, add security headers, keep only TLS 1.2/1.3.
