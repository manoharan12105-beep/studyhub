# Lab 12 — Configure Nginx as a Reverse Proxy

**Lab:** 12 · **Module:** Nginx as a Reverse Proxy · **Verification:** Partly tested

> [!NOTE]
> Run on your VPS. **Partly tested:** this configuration was syntax-checked with `nginx -t` and run with Nginx 1.30.5 in front of the Task API on a development machine (on high ports): requests were proxied, and with the app stopped Nginx returned `502 Bad Gateway`. Installing and running Nginx on a VPS was not executed.

## Objective

Put Nginx on port 80 in front of the Task API, make the application private on `127.0.0.1:8080`, and recognise a 502.

## Prerequisites

- [Lab 11](../lab-deploy-to-vps/content.md) — the stack runs on the VPS.
- Lesson: [Nginx as a Reverse Proxy](../../server-deployment/nginx-reverse-proxy/content.md).

## Scenario

Users should not type `:8080`, and the application server should not face the internet directly.

## Steps

### Step 1: Install Nginx

```bash
sudo apt install -y nginx
curl -sI http://localhost | head -n 1
```

**Expected result:** `HTTP/1.1 200 OK` (the default welcome page).

### Step 2: Create the site

`/etc/nginx/sites-available/taskapi` (use your server IP as `server_name` until Lab 13 gives you a domain):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name 203.0.113.10;

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

```bash
sudo ln -s /etc/nginx/sites-available/taskapi /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

**Expected result:** `nginx -t` reports `syntax is ok` and `test is successful`.

### Step 3: Make the app private again

In `/opt/taskapi/compose.yaml` set the port line back to `"127.0.0.1:8080:8080"`, then:

```bash
cd /opt/taskapi && docker compose up -d
sudo ss -ltnp | grep 8080
```

**Expected result:** the socket is `127.0.0.1:8080`. Remove 8080 from the provider firewall.

### Step 4: Test through Nginx

```bash
# On your laptop
curl -s -i http://203.0.113.10/api/info | sed -n '1,3p'
curl -s --max-time 5 http://203.0.113.10:8080/api/info || echo "8080 closed"
```

**Expected result:** `HTTP/1.1 200 OK` with `Server: nginx`, then the JSON; the direct `:8080` request fails (`8080 closed`).

### Step 5: Produce a 502 and read the log

```bash
docker compose stop app
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1/api/info
sudo tail -n 1 /var/log/nginx/error.log
docker compose start app
```

**Expected result:** `502`; the error log line contains `connect() failed (111: Connection refused) while connecting to upstream` and `upstream: "http://127.0.0.1:8080/api/info"`.

In the verification run the client saw `HTTP/1.1 502 Bad Gateway` with Nginx's page `<title>502 Bad Gateway</title>`.

## Verification Checklist

- ☐ `http://SERVER_IP/api/info` works through Nginx.
- ☐ The app listens on `127.0.0.1:8080` only; `:8080` is unreachable from outside.
- ☐ You produced a 502 and found its cause in `error.log`.

## Common Mistakes

- Leaving `"8080:8080"` in Compose — Nginx works, but the app is still public.
- `sudo systemctl restart nginx` without `nginx -t`.
- Deleting `sites-available/default` instead of the `sites-enabled` symlink (harmless, but the package expects the file).

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Nginx welcome page instead of the API | Default site still enabled, or `server_name` does not match — check `sites-enabled` |
| `502` with the app running | Compare `proxy_pass` with `docker compose ps` ports |
| `nginx -t` fails | Read the line number it reports; a missing `;` is the usual cause |
