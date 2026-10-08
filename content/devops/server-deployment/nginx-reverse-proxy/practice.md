# Nginx as a Reverse Proxy — Practice

### P1. Which status?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** 502

The Spring Boot container is stopped; Nginx is running. What does a client receive?

- A) `404 Not Found`
- B) `502 Bad Gateway`
- C) `504 Gateway Timeout`
- D) Connection refused

<details>
<summary>Answer</summary>

**Answer:** B) `502 Bad Gateway`

</details>

### P2. Apply safely

**Difficulty:** Easy · **Type:** Command · **Concepts:** nginx -t, reload

You edited the site configuration. Write the command line that checks it and applies it without dropping connections, only if the check passes.

<details>
<summary>Answer</summary>

```bash
# Illustrative
sudo nginx -t && sudo systemctl reload nginx
```

</details>

### P3. Enable the site

**Difficulty:** Easy · **Type:** Command · **Concepts:** sites-enabled

Enable `/etc/nginx/sites-available/taskapi` on Ubuntu.

<details>
<summary>Answer</summary>

```bash
# Illustrative
sudo ln -s /etc/nginx/sites-available/taskapi /etc/nginx/sites-enabled/
```

</details>

### P4. Write the location

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** proxy_pass, headers

Write a `location /` block that forwards to the app on `127.0.0.1:8080` and passes the host, client IP and scheme.

<details>
<summary>Answer</summary>

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

</details>

### P5. Uploads fail

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** client_max_body_size

Uploading a 5 MB file returns `413 Request Entity Too Large` from Nginx; the Spring Boot limit is 10 MB. Fix it.

<details>
<summary>Answer</summary>

Add `client_max_body_size 10m;` to the `server` (or `location`) block — Nginx's default is 1 MB — then `nginx -t` and reload.

</details>

### P6. Read the error log

**Difficulty:** Medium · **Type:** Output · **Concepts:** upstream errors

`error.log` shows `upstream timed out (110: Connection timed out) while reading response header from upstream`. Which status did the client get, and where do you look next?

<details>
<summary>Answer</summary>

`504 Gateway Timeout`. The app accepted the connection but answered too slowly: check the app's logs and slow requests (database queries, external calls), and only then consider raising `proxy_read_timeout`.

</details>

### P7. Wrong port

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** 502 causes

Compose publishes `"127.0.0.1:9090:8080"`, and Nginx has `proxy_pass http://127.0.0.1:8080;`. What do users see, and what is the fix?

<details>
<summary>Answer</summary>

`502` — nothing listens on host port 8080. Point `proxy_pass` to `http://127.0.0.1:9090` (the **host** port), or change the mapping to `127.0.0.1:8080:8080`.

</details>

### P8. Containerised Nginx

**Difficulty:** Hard · **Type:** Compose · **Concepts:** service names

Nginx runs as Compose service `proxy` with `app` on the same project network. Write the `proxy_pass` line, and say whether `app` needs a `ports:` entry.

<details>
<summary>Answer</summary>

`proxy_pass http://app:8080;` — the service name and the container port. `app` needs no `ports:`; only `proxy` publishes 80/443.

</details>

### P9. Front end and API

**Difficulty:** Hard · **Type:** Configuration · **Concepts:** static + proxy

Write a `server` block for `www.example.com` serving a single-page app from `/var/www/frontend` and proxying `/api/` to the app.

<details>
<summary>Answer</summary>

```nginx
server {
    listen 80;
    server_name www.example.com;
    root /var/www/frontend;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

</details>
