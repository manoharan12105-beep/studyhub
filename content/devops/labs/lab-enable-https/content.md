# Lab 14 — Enable HTTPS with Let's Encrypt

**Lab:** 14 · **Module:** Domain, DNS and HTTPS · **Verification:** Partly tested

> [!NOTE]
> Run on your VPS. **Partly tested:** the final Nginx configuration passed `nginx -t` (Nginx 1.30.5) and was run with a self-signed certificate on a development machine: HTTP was redirected with `301`, HTTPS reached the Task API, and the security headers were present. Certbot and Let's Encrypt were not run (no public domain was used).

## Objective

Obtain a free certificate with Certbot, serve the API over HTTPS, redirect HTTP to HTTPS, add security headers and confirm automatic renewal.

## Prerequisites

- [Lab 13](../lab-connect-domain/content.md): `api.example.com` resolves to the server; port 80 and 443 allowed in ufw and the provider firewall.
- Lesson: [Domain, DNS and HTTPS](../../server-deployment/domain-dns-and-https/content.md).

## Scenario

The API will soon carry logins; it must never travel unencrypted.

## Steps

### Step 1: Install Certbot

```bash
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### Step 2: Rehearse, then obtain the certificate

```bash
sudo certbot certonly --nginx --dry-run -d api.example.com
sudo certbot --nginx -d api.example.com
```

**Expected result:** the dry run reports success against the staging CA. The real run asks for an email and the terms, then reports `Successfully received certificate`, the certificate path under `/etc/letsencrypt/live/api.example.com/`, and that it deployed the certificate to your Nginx site.

### Step 3: Review the final configuration

Compare `/etc/nginx/sites-available/taskapi` with the configuration in the [HTTPS lesson](../../server-deployment/domain-dns-and-https/content.md) (section *HTTP to HTTPS Redirect*): a port-80 block that returns `301 https://$host$request_uri`, and a 443 block with the certificate, `http2 on;`, TLS 1.2/1.3, the four security headers and the `proxy_pass` location. Certbot's version includes `options-ssl-nginx.conf`; replacing it with the lesson's explicit block is fine. Then:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Step 4: Verify

```bash
curl -sI http://api.example.com/api/info | grep -iE "^HTTP|^location"
curl -s https://api.example.com/api/info
curl -sI https://api.example.com/api/info | grep -iE "strict-transport|x-content-type|x-frame"
```

**Expected result:** `301` with `Location: https://api.example.com/api/info`; the JSON over HTTPS; the HSTS, `nosniff` and `DENY` headers. In the local verification run the redirect and all four headers appeared exactly like this.

### Step 5: Confirm renewal

```bash
systemctl list-timers | grep certbot
sudo certbot renew --dry-run
sudo certbot certificates
```

**Expected result:** a scheduled certbot timer; the dry-run renewal succeeds; the certificate's expiry is about 90 days away.

## Verification Checklist

- ☐ Padlock in the browser for `https://api.example.com/api/info`.
- ☐ HTTP redirects to HTTPS.
- ☐ Security headers present.
- ☐ `certbot renew --dry-run` succeeds.

## Common Mistakes

- Running Certbot before DNS resolves to the server or with port 80 closed.
- Repeated real attempts while debugging (rate limits) — use `--dry-run`.
- Adding HSTS with `includeSubDomains` while other subdomains have no HTTPS.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Challenge fails: connection or timeout | Port 80 blocked; DNS wrong; stray AAAA record |
| `too many redirects` in the browser | Spring redirects based on scheme: ensure `X-Forwarded-Proto` and `server.forward-headers-strategy` |
| Certificate name mismatch | `server_name` / `-d` name differs from the URL you open |
