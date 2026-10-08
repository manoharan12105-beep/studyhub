# Important Ports and Protocols

## Ports in This Subject

| Port | Protocol | Service | Public on the VPS? |
|------|----------|---------|--------------------|
| 22 | TCP (SSH) | Remote shell, `scp`, deployments from CI | Yes (keys only) |
| 80 | TCP (HTTP) | Nginx: redirect to HTTPS, Let's Encrypt HTTP-01 challenge | Yes |
| 443 | TCP (HTTPS = HTTP over TLS) | Nginx: the API | Yes |
| 8080 | TCP (HTTP) | Spring Boot (Tomcat) | No — `127.0.0.1:8080` |
| 5432 | TCP | PostgreSQL | No — not published |
| 53 | UDP/TCP (DNS) | Name resolution (outbound) | — |
| 127.0.0.11:53 | DNS | Docker's embedded DNS inside containers | — |

## Address Notation

| Notation | Meaning |
|----------|---------|
| `0.0.0.0:8080` / `*:8080` | Listening on every interface — reachable from outside unless blocked |
| `127.0.0.1:8080` | Loopback only — this machine |
| `-p 8080:8080` | Host port 8080 (all interfaces) → container port 8080 |
| `-p 127.0.0.1:8080:8080` | Host loopback 8080 → container 8080 |
| `db:5432` | Container/service name and **container** port on a Docker network |

## Protocols in One Line Each

| Protocol | Role here |
|----------|-----------|
| SSH | Encrypted remote login and file copy; key-based authentication |
| HTTP | Requests between client, Nginx and Spring Boot |
| TLS | Encryption, integrity and server identity for HTTPS (TLS 1.2/1.3) |
| DNS | Name → IP: A (IPv4), AAAA (IPv6), CNAME (alias), CAA (allowed CAs) |
| ACME | How Certbot obtains certificates from Let's Encrypt |
| JDBC / PostgreSQL wire protocol | App ↔ database |

## HTTP Status Codes You Will Debug

| Code | Who / meaning |
|------|---------------|
| 200 / 201 | OK / created |
| 301 | Nginx redirecting HTTP → HTTPS |
| 400 | Validation error from Spring (e.g. blank title) |
| 403 | Forbidden — e.g. a CORS preflight from a disallowed origin |
| 404 | No route (Spring) or no matching site/location (Nginx) |
| 413 | Body too large (Nginx `client_max_body_size`) |
| 502 | Nginx could not reach the upstream |
| 503 | Health `DOWN` (Actuator) or service unavailable |
| 504 | Upstream too slow |
