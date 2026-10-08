# Block 5: VPS, Nginx and HTTPS

## VPS Setup Order

1. Update packages → create `deploy` (sudo) → key login works in a 2nd session → disable passwords + root login.
2. ufw: OpenSSH, 80, 443 → enable; provider firewall the same.
3. Docker Engine + Compose plugin from Docker's repository; `deploy` in `docker` group.
4. `/opt/taskapi`: `compose.yaml` + `.env` (600, created on the server).
5. Image: registry pull (normal) or `docker save | ssh … docker load`.
6. `docker compose up -d` → health → logs.

## Nginx

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host              $host;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

- `sudo nginx -t && sudo systemctl reload nginx`.
- App published on `127.0.0.1:8080` only.
- 502 = upstream refused/down · 504 = too slow · 413 = body too large.

## DNS and HTTPS

- A record `api` → server IP; TTL = cache time ("propagation").
- `certbot --nginx -d api.example.com`: needs DNS correct + port 80 open (HTTP-01).
- Auto-renewal timer; `certbot renew --dry-run`; certificates are short-lived.
- HTTP → `301` → HTTPS; HSTS + `nosniff` + `X-Frame-Options` headers; TLS 1.2/1.3.
- Spring behind Nginx: `server.forward-headers-strategy: native`.

## Self-Check

- Why can `PUBLIC_IP:8080` be reachable although ufw blocks 8080?
- The Certbot challenge fails — three things you check?
- Rollback by tag: what can still break?
