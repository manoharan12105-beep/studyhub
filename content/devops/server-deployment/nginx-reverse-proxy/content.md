# Nginx as a Reverse Proxy

**Module:** Server Deployment · **Interview priority:** Core

## What Is It?

A **reverse proxy** is a server that receives client requests and forwards them to one or more backend applications, then returns their responses. Clients only ever talk to the proxy. **Nginx** is the most common reverse proxy (and web server) in front of Spring Boot applications.

```text
Internet
   │  :80 / :443
   ▼
Nginx (on the VPS host)           ← the only public entry point
   │  proxy_pass http://127.0.0.1:8080
   ▼
Spring Boot container (127.0.0.1:8080 only)
   │  db:5432 over the Docker network
   ▼
PostgreSQL container (no published port)
```

## Why Nginx?

| Without Nginx (`IP:8080` public) | With Nginx |
|----------------------------------|------------|
| Users type a port number | Standard ports 80/443, clean URLs |
| Java handles TLS certificates | Nginx terminates HTTPS with Let's Encrypt certificates |
| The app is directly exposed | Only Nginx is exposed; the app listens on loopback |
| One app per port | Many apps and domains on one server (`server_name`) |
| No buffering of slow clients | Nginx buffers requests/responses, limits body sizes, adds headers |
| App down = connection refused | Nginx returns a clear `502`/`503` and logs the reason |

Nginx is event-driven and handles many thousands of connections with little memory, which is why it fronts so many services.

## How It Works

1. A client connects to the server's port 80 (or 443).
2. Nginx picks the `server` block whose `listen` port and `server_name` match the request's `Host` header.
3. Inside it, the best-matching `location` decides what to do: serve files (`root`) or forward (`proxy_pass`).
4. Nginx opens a connection to the **upstream** (`127.0.0.1:8080`), sends the request with the headers you configure, and streams the response back.

| Port | Protocol | Who listens |
|------|----------|-------------|
| 80 | HTTP | Nginx (redirects to HTTPS after the next lesson) |
| 443 | HTTPS | Nginx (TLS terminated here) |
| 8080 | HTTP | Spring Boot, on `127.0.0.1` only |

## Installing Nginx

```bash
# Illustrative: on the VPS, needs root
sudo apt install -y nginx
systemctl status nginx --no-pager
curl -sI http://localhost | head -n 1
```

**Expected result:** the service is `active (running)` and `curl` prints `HTTP/1.1 200 OK` for the default welcome page. On Ubuntu, sites live in `/etc/nginx/sites-available/` and are enabled by a symlink in `/etc/nginx/sites-enabled/`.

## Basic Reverse-Proxy Configuration

`/etc/nginx/sites-available/taskapi`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.example.com;

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

| Directive | Meaning |
|-----------|---------|
| `listen 80` / `[::]:80` | Accept HTTP on IPv4 and IPv6 |
| `server_name` | Which host name this block serves (use your domain; before you have one, the server IP or `_`) |
| `proxy_pass http://127.0.0.1:8080` | Forward to the app container's loopback port |
| `Host $host` | Keep the original host name |
| `X-Forwarded-For`, `X-Real-IP` | The real client IP (otherwise Spring sees `127.0.0.1`) |
| `X-Forwarded-Proto $scheme` | Whether the client used http or https |
| `client_max_body_size` | Largest request body (default 1 MB — uploads above it get `413`) |
| `proxy_read_timeout` | How long to wait for the app's response before `504` |

Enable it, test, reload:

```bash
# Illustrative
sudo ln -s /etc/nginx/sites-available/taskapi /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default        # the default welcome site (only the symlink)
sudo nginx -t
sudo systemctl reload nginx
```

`nginx -t` checks syntax and files before anything changes; `reload` applies the new configuration without dropping connections. If `nginx -t` fails, the running configuration is untouched.

Now close the app to the internet: in `/opt/taskapi/compose.yaml` set the port back to `"127.0.0.1:8080:8080"`, run `docker compose up -d`, and remove 8080 from the provider firewall. `http://SERVER_IP:8080` stops working; `http://api.example.com` (or `http://SERVER_IP`) works through Nginx.

## What Was Tested

This lesson's configuration (with the HTTPS additions of the next lesson) was run with Nginx 1.30.5 in front of the Task API JAR on a development machine, on high ports instead of 80/443. Observed behaviour:

- A `POST /api/tasks` through Nginx returned `201` with the app's JSON; the response header `Server: nginx` shows who answered the client.
- With the application stopped, Nginx answered `HTTP/1.1 502 Bad Gateway` and its own small HTML page, and the error log recorded `connect() failed … while connecting to upstream`. (On Linux the reason in parentheses reads `(111: Connection refused)`.)

## Static Files vs Reverse Proxy

```nginx
server {
    listen 80;
    server_name www.example.com;
    root /var/www/frontend;                 # files: a built React/Angular app
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8080;   # API requests go to Spring Boot
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;   # single-page app routing
    }
}
```

Nginx serves static files directly and very efficiently; only `/api/` reaches Java. Serving the front end and API from one origin also removes the need for CORS.

## Basic Security Headers

Added in the HTTPS server block (next lesson), `always` so they also appear on error responses:

```nginx
add_header Strict-Transport-Security "max-age=31536000" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

And in the `http` block of `/etc/nginx/nginx.conf`, `server_tokens off;` hides the Nginx version in headers and error pages.

## WebSocket Proxy Basics

Only needed if your app uses WebSockets (for example STOMP over `/ws`):

```nginx
location /ws {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;
}
```

The `Upgrade`/`Connection` headers are hop-by-hop, so Nginx drops them unless you pass them explicitly.

## Logs

| File | Contains |
|------|----------|
| `/var/log/nginx/access.log` | One line per request: client IP, time, request line, status, bytes, user agent |
| `/var/log/nginx/error.log` | Configuration problems, upstream failures (`connect() failed`, `upstream timed out`) |

```bash
# Illustrative
sudo tail -f /var/log/nginx/access.log
sudo grep upstream /var/log/nginx/error.log | tail -n 5
```

## Common Status Codes from Nginx

| Status | Typical cause |
|--------|---------------|
| `502 Bad Gateway` | App not running, wrong `proxy_pass` port, app listening on another address, container restarting |
| `504 Gateway Timeout` | App too slow (longer than `proxy_read_timeout`) |
| `413 Request Entity Too Large` | Body larger than `client_max_body_size` |
| `404` from Nginx (Nginx HTML page) | No `location` matched / request went to the default site — wrong `server_name` |

## Production Relevance

- Nginx makes the application server private, terminates TLS, and gives you one place for headers, limits and access logs.
- A `502` means "Nginx is fine, the upstream is not" — start at the application.

## Common Mistakes

- `proxy_pass http://localhost:8080` when Nginx runs **in a container** (there `localhost` is the Nginx container — use the service name).
- Forgetting `X-Forwarded-Proto`, so the app builds `http://` redirect URLs.
- Editing config and running `restart` without `nginx -t`.
- Leaving the app also published on `0.0.0.0:8080`, bypassing Nginx.
- A trailing-slash mismatch: `proxy_pass http://127.0.0.1:8080/;` (with a URI) strips the matched location prefix; without it, the path is passed unchanged.

## Interview Angle

- Define a reverse proxy vs a forward proxy (one represents servers, the other clients).
- Explain the request path Internet → Nginx → Spring Boot → PostgreSQL and which ports are public.
- Explain 502 vs 504 and how you debug each.

## Key Takeaways

- Nginx is the single public entry point; the app listens on `127.0.0.1:8080`.
- `server_name` picks the site, `location` + `proxy_pass` forwards, `proxy_set_header` passes the client's host, IP and scheme.
- Always `nginx -t` before `systemctl reload nginx`.
- `502` = upstream unreachable, `504` = upstream too slow, `413` = body too large.
