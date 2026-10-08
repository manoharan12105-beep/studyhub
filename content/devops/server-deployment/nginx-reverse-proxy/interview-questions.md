# Nginx as a Reverse Proxy — Interview Questions

## Beginner

### Q1. What is a reverse proxy?

**Style:** What

<details>
<summary>Answer</summary>

A server that sits in front of backend applications, receives client requests and forwards them to the backends, returning their responses. Clients see only the proxy. It is used for TLS termination, routing by host or path, load balancing, caching, limits and hiding internal services.

</details>

### Q2. What is the difference between a forward proxy and a reverse proxy?

**Style:** Comparison

<details>
<summary>Answer</summary>

A forward proxy acts for **clients** (for example a company proxy that employees' browsers use to reach the internet); servers see the proxy instead of the clients. A reverse proxy acts for **servers**; clients see the proxy instead of the backend servers.

</details>

### Q3. Why put Nginx in front of Spring Boot instead of exposing port 8080?

**Style:** Why

<details>
<summary>Answer</summary>

Standard ports and clean URLs; HTTPS with automatically renewed certificates in one place; the app stays private on loopback; several apps or domains can share one server; Nginx adds security headers, request size limits, buffering, access logs and clear error pages when the app is down.

</details>

### Q4. What does `nginx -t` do and why run it before reloading?

**Style:** Why

<details>
<summary>Answer</summary>

It parses the configuration and checks referenced files (certificates, includes) without applying anything. Running it first avoids reloading a broken configuration; if a reload is attempted with an invalid file, Nginx keeps the old configuration, but a `restart` would fail and take the site down.

</details>

## Intermediate

### Q5. Users get `502 Bad Gateway`. What does that tell you and how do you debug it?

**Style:** Troubleshooting

<details>
<summary>Answer</summary>

Nginx is running but could not get a valid response from the upstream. Check Nginx's `error.log` (`connect() failed (111: Connection refused) while connecting to upstream`), then `docker compose ps` (is the app running or restarting?), `curl 127.0.0.1:8080/actuator/health` on the server, the port in `proxy_pass` vs the published port, and the app logs.

</details>

### Q6. What is the difference between 502 and 504 from Nginx?

**Style:** Comparison

<details>
<summary>Answer</summary>

502: Nginx could not connect to the upstream or got an invalid response (app down, wrong port). 504: it connected but the upstream did not respond within `proxy_read_timeout` (slow query, deadlock, overloaded app).

</details>

### Q7. Why does the application need `X-Forwarded-*` headers?

**Style:** Why

<details>
<summary>Answer</summary>

Behind the proxy, every request comes from `127.0.0.1` over HTTP. `X-Forwarded-For`/`X-Real-IP` carry the real client IP (for logs, rate limiting), `X-Forwarded-Proto` the original scheme (so redirects and links use https), and `Host` the original host name. Spring Boot uses them with `server.forward-headers-strategy`.

</details>

### Q8. Nginx runs in a Docker container next to the app. Why does `proxy_pass http://localhost:8080` fail?

**Style:** Trap

<details>
<summary>Answer</summary>

Inside the Nginx container `localhost` is the Nginx container. Put both on the same Docker network and use the app's service name: `proxy_pass http://app:8080;`.

</details>

## Advanced

### Q9. How would you serve a single-page front end and the Spring Boot API from one domain?

**Style:** Architecture

<details>
<summary>Answer</summary>

One `server` block: `root` points to the built front-end files; `location /api/` proxies to `127.0.0.1:8080`; `location /` uses `try_files $uri $uri/ /index.html` so client-side routes load the app. Same origin for page and API means no CORS configuration is needed, and Nginx serves static files without touching the JVM.

</details>

### Q10. What changes in the Nginx configuration for WebSockets, and why?

**Style:** How

<details>
<summary>Answer</summary>

Use HTTP/1.1 to the upstream and pass the hop-by-hop upgrade headers: `proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade";` and a long `proxy_read_timeout`. Without them Nginx drops the `Upgrade` header, the handshake fails, and long-lived connections are cut after the default 60-second read timeout.

</details>
