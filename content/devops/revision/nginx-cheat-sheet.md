# Nginx

## Commands

| Command | Does |
|---------|------|
| `sudo nginx -t` | Test configuration |
| `sudo systemctl reload nginx` | Apply without dropping connections |
| `sudo ln -s /etc/nginx/sites-available/app /etc/nginx/sites-enabled/` | Enable a site (Ubuntu) |
| `sudo tail -f /var/log/nginx/error.log` | Upstream and config errors |
| `sudo certbot --nginx -d api.example.com` | Certificate + HTTPS config |
| `sudo certbot renew --dry-run` | Test renewal |

## Reverse Proxy + HTTPS

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.example.com;
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

## WebSockets

```nginx
location /ws {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;
}
```

## Statuses

| Status | Cause |
|--------|-------|
| 301 | HTTP → HTTPS redirect |
| 404 (Nginx page) | No matching `server_name`/`location` |
| 413 | Body > `client_max_body_size` (default 1 MB) |
| 502 | Upstream refused / down / wrong port |
| 504 | Upstream slower than `proxy_read_timeout` |

## Gotchas

- `proxy_pass http://127.0.0.1:8080/;` (trailing slash = URI) strips the matched location prefix.
- Nginx in a container: `proxy_pass http://app:8080;` — never `localhost`.
- `server_tokens off;` in `http {}` hides the version.
- Spring Boot behind Nginx: `server.forward-headers-strategy: native`.
