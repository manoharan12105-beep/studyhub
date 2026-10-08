# Lab 12 — Interview Questions

## Beginner

### Q1. Why bind the application to `127.0.0.1:8080` once Nginx is in place?

**Style:** Why

<details>
<summary>Answer</summary>

So the only way in is through Nginx (HTTPS, headers, limits, logs). A port published on all interfaces would stay reachable from the internet — and Docker's iptables rules would bypass ufw.

</details>

## Intermediate

### Q2. How did you confirm that Nginx, not the application, answered the client?

**Style:** How

<details>
<summary>Answer</summary>

The response header `Server: nginx`, the request appearing in `/var/log/nginx/access.log`, and the direct `:8080` request failing from outside while `127.0.0.1:8080` works on the server.

</details>

### Q3. Users see 502 right after each deployment for a few seconds. Explain.

**Style:** Production failure

<details>
<summary>Answer</summary>

During `docker compose up -d app` the old container stops and the new JVM starts; until it listens on 8080, Nginx's connections are refused and it returns 502. Graceful shutdown limits errors for in-flight requests, but avoiding the gap needs a second instance or a blue/green switch.

</details>
