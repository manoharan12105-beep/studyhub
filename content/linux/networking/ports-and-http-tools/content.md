# Ports, Sockets and HTTP Tools: ss, netstat, nc, curl and wget

**Module:** Networking Basics · **Interview priority:** Core

## What Is It?

A network service listens on an **IP address and port** — PostgreSQL on 5432, a Spring Boot app on 8080, SSH on 22. These tools show and test those endpoints:

| Tool | Answers |
|------|---------|
| `ss` | Which ports are listening? Which process owns them? Which connections are open? |
| `netstat` | The same, older tool (net-tools package) |
| `lsof -i` | Which process has a given port or connection open? |
| `nc` (netcat) | Can I open a TCP connection to host:port? |
| `curl` | Send an HTTP(S) request and show the response — headers, status, timing |
| `wget` | Download files over HTTP/HTTPS/FTP, recursively if needed |

## Why It Matters

- "Port 8080 is already in use", "connection refused", "is the database port reachable from the app server?" — answered with `ss` and `nc`.
- `curl` is how backend developers test APIs and health endpoints from servers, scripts and CI.
- Interview questions: "which process is using port 8080?", "how do you list listening ports?", "curl vs wget", "connection refused vs timeout".

## Core Concept

### Sockets, listening and connections

- A **socket** is one end of a network connection, identified by protocol, local address:port and (for connections) remote address:port.
- A server **listens** on a local address and port. The address decides who can connect:

| Listening address | Reachable from |
|-------------------|----------------|
| `127.0.0.1:8080` | This machine only (loopback) |
| `0.0.0.0:8080` / `*:8080` | All IPv4 interfaces |
| `[::]:8080` | All IPv6 (and usually IPv4) interfaces |
| `10.0.0.5:8080` | Only via that interface's address |

- Ports below 1024 are **privileged**: binding them needs root or the `CAP_NET_BIND_SERVICE` capability.
- Only one socket can listen on a given address:port (and protocol) — a second program gets **"Address already in use"**.

### Connection refused vs timeout

| Symptom | Meaning |
|---------|---------|
| **Connection refused** (immediately) | The host answered, but nothing listens on that port (or a firewall actively rejects) |
| **Connection timed out** (after waiting) | No answer: host down, wrong IP, or a firewall silently **drops** the packets |
| **No route to host** | Routing or firewall reject at the network level |

### TCP connection states (seen in `ss`)

`LISTEN` (server waiting), `ESTAB` (established, data can flow), `TIME-WAIT` (closed recently, waiting before the port pair can be reused), `CLOSE-WAIT` (the peer closed but the local application has not — many of these mean an application is leaking connections), `SYN-SENT` (trying to connect).

## Commands

The outputs below come from a test machine running a small web server on `127.0.0.1:8080` (`python3 -m http.server 8080 --bind 127.0.0.1`); yours will show your own services.

### ss: sockets

| Option | Meaning |
|--------|---------|
| `-t` / `-u` | TCP / UDP |
| `-l` | Listening sockets only |
| `-n` | Numeric (no service-name lookup: `:8080` not `:http-alt`) |
| `-p` | Show the owning process (root needed to see other users' processes) |
| `-a` | All sockets (listening and connected) |
| `-s` | Summary counts |
| filter | `"sport = :8080"`, `"dport = :5432"`, `state established` |

Listening TCP ports:

```bash
# Illustrative: output depends on running services
ss -ltn
```

**Output (varies):**

```text
State  Recv-Q Send-Q  Local Address:Port Peer Address:Port
LISTEN 0      4096    127.0.0.53%lo:53        0.0.0.0:*
LISTEN 0      1000   10.255.255.254:53        0.0.0.0:*
LISTEN 0      4096       127.0.0.54:53        0.0.0.0:*
LISTEN 0      5           127.0.0.1:8080      0.0.0.0:*
```

Which process owns port 8080:

```bash
# Illustrative
ss -ltnp 'sport = :8080'
```

**Output (varies):**

```text
State  Recv-Q Send-Q Local Address:Port Peer Address:PortProcess
LISTEN 0      5          127.0.0.1:8080      0.0.0.0:*    users:(("python3",pid=462,fd=3))
```

The process is `python3` with PID 462. The classic memorable form is `sudo ss -tulpn` (TCP, UDP, listening, process, numeric).

### netstat (legacy)

```bash
# Illustrative: needs the net-tools package
sudo netstat -tlnp
```

**Output (varies):**

```text
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
tcp        0      0 127.0.0.53:53           0.0.0.0:*               LISTEN      -
tcp        0      0 127.0.0.1:8080          0.0.0.0:*               LISTEN      419/python3
```

Without root, `PID/Program name` shows `-` for other users' processes.

### lsof -i

```bash
# Illustrative
sudo lsof -i :8080
```

**Output (varies):**

```text
COMMAND PID    USER FD   TYPE DEVICE SIZE/OFF NODE NAME
python3 419 student 3u  IPv4  11119      0t0  TCP localhost:http-alt (LISTEN)
```

`lsof -i` lists open network files; `lsof -i -P -n` shows numeric ports and addresses.

### nc: is the port open?

```bash
# Illustrative
nc -zv 127.0.0.1 8080
nc -zv 127.0.0.1 9999
```

**Output (varies):**

```text
Connection to 127.0.0.1 8080 port [tcp/http-alt] succeeded!
nc: connect to 127.0.0.1 port 9999 (tcp) failed: Connection refused
```

`-z` only tests the connection, `-v` reports the result, `-w 3` sets a timeout. Without `nc`, bash itself can test: `timeout 3 bash -c '</dev/tcp/10.0.0.20/5432' && echo open`.

### curl: HTTP from the command line

| Option | Meaning |
|--------|---------|
| `-s` | Silent (no progress bar) |
| `-I` | Fetch headers only (HEAD request) |
| `-i` | Include response headers in the output |
| `-v` | Verbose: show the connection, request and response headers |
| `-o file` / `-O` | Save to a file / save with the remote name |
| `-L` | Follow redirects |
| `-f` | Fail (exit code 22) on HTTP errors ≥ 400 instead of printing the error body |
| `-X POST` | Method |
| `-H 'Name: value'` | Add a request header |
| `-d 'data'` | Send a request body (implies POST) |
| `-u user` | Basic authentication (prompts for the password) |
| `-w '%{http_code}'` | Print chosen details after the transfer |
| `-k` | Skip TLS certificate verification (testing only — never in production scripts) |

The body:

```bash
# Illustrative
curl -s http://127.0.0.1:8080/
```

**Output (varies):**

```text
<h1>Inventory OK</h1>
```

Only the headers:

```bash
# Illustrative
curl -I http://127.0.0.1:8080/
```

**Output (varies):**

```text
HTTP/1.0 200 OK
Server: SimpleHTTP/0.6 Python/3.14.4
Date: Thu, 15 Jan 2026 09:30:45 GMT
Content-type: text/html
Content-Length: 22
Last-Modified: Thu, 15 Jan 2026 09:30:44 GMT
```

Everything about the exchange — the first tool for "why does this request fail?":

```bash
# Illustrative
curl -sv http://127.0.0.1:8080/ -o /dev/null
```

**Output (varies):**

```text
*   Trying 127.0.0.1:8080...
* Established connection to 127.0.0.1 (127.0.0.1 port 8080) from 127.0.0.1 port 50356
* using HTTP/1.x
> GET / HTTP/1.1
> Host: 127.0.0.1:8080
> User-Agent: curl/8.18.0
> Accept: */*
>
* Request completely sent off
* HTTP 1.0, assume close after body
< HTTP/1.0 200 OK
< Server: SimpleHTTP/0.6 Python/3.14.4
< Content-type: text/html
< Content-Length: 22
<
{ [22 bytes data]
* shutting down connection #0
```

`*` lines are connection details, `>` the request, `<` the response.

Status code and timing for scripts and health checks:

```bash
# Illustrative
curl -s -o /dev/null -w '%{http_code} %{time_total}s\n' http://127.0.0.1:8080/missing
curl -sf http://127.0.0.1:8080/missing; echo "exit: $?"
curl -s http://127.0.0.1:9999/; echo "exit: $?"
```

**Output (varies):**

```text
404 0.001860s
exit: 22
exit: 7
```

Exit code 22 = HTTP error with `-f`; 7 = could not connect; 6 = could not resolve host; 28 = timeout.

A JSON API call:

```bash
# Illustrative
curl -s -X POST http://localhost:8080/api/orders \
     -H 'Content-Type: application/json' \
     -d '{"productId": 7, "quantity": 2}'
```

### wget: downloads

```bash
# Illustrative
wget -q -O page.html http://127.0.0.1:8080/ && cat page.html
wget http://127.0.0.1:8080/nothing
```

**Output (varies):**

```text
<h1>Inventory OK</h1>
HTTP request sent, awaiting response... 404 File not found
2026-01-15 09:30:45 ERROR 404: File not found.
```

| Option | Meaning |
|--------|---------|
| `-O file` | Save as `file` (`-O -` = stdout) |
| `-q` | Quiet |
| `-c` | Continue a partially downloaded file |
| `-r -np` | Recursive download without ascending to the parent |
| `--tries=N`, `--timeout=S` | Retries and timeouts |

## Examples

### "Port 8080 is already in use"

```bash
# Illustrative
sudo ss -ltnp 'sport = :8080'                 # who owns it? → users:(("java",pid=2290,...))
ps -o pid,ppid,user,etime,cmd -p 2290         # what is it, who started it, since when?
kill 2290                                     # graceful stop (SIGTERM) if it is yours and stale
# if it is a service: sudo systemctl stop <name>; otherwise choose another port
```

### Can the app server reach the database?

```bash
# Illustrative: run on the app server
getent hosts db.internal
nc -zv -w 3 db.internal 5432
```

`succeeded` → network path and port are fine (check credentials next); `refused` → PostgreSQL not listening on that address (check `listen_addresses`); timeout → firewall or security group.

### A health check loop for a deployment

```bash
# Illustrative
for i in $(seq 1 30); do
    if curl -sf http://localhost:8080/actuator/health > /dev/null; then echo "healthy"; break; fi
    sleep 2
done
```

## Comparison

### ss vs netstat vs lsof

| | `ss` | `netstat` | `lsof -i` |
|---|---|---|---|
| Package | iproute2 (default) | net-tools (often absent) | lsof |
| Speed | Fast (netlink) | Slower (reads `/proc`) | Slower |
| Shows process | `-p` | `-p` | Always |
| Filters | Rich (`sport`, `dport`, `state`) | Limited | By port, host, protocol |

### curl vs wget

| | `curl` | `wget` |
|---|---|---|
| Focus | Transferring data, testing APIs | Downloading files |
| Default output | stdout | Saves to a file |
| Methods, headers, bodies | Full control (`-X`, `-H`, `-d`) | Basic |
| Recursive download / mirroring | No | Yes (`-r`, `-m`) |
| Resume | `-C -` | `-c` |
| Protocols | Many (HTTP, HTTPS, FTP, SMTP, …) | HTTP, HTTPS, FTP |
| Typical use | `curl -sf .../health`, REST calls | `wget https://…/release.tar.gz` |

## Common Mistakes

- Running `ss -p` / `netstat -p` without `sudo` and seeing no process for root-owned services.
- Forgetting `-n`, so ports appear as names (`http-alt`) and lookups slow the command down.
- Treating "connection refused" and "timeout" as the same problem — refused means nothing listens (or an active reject); timeout usually means a firewall drop or wrong host.
- Using `curl -k` in scripts and silently accepting invalid certificates.
- Scripts that check `curl`'s exit code without `-f` — a 500 response still exits 0.
- Killing whatever owns a port without checking what it is (`ps -p PID`).

## Key Takeaways

- `ss -ltnp` lists listening TCP ports with processes (`sudo` for all); filter with `'sport = :8080'`.
- `127.0.0.1` = local only, `0.0.0.0`/`[::]` = all interfaces; one listener per address:port.
- Refused = nothing listening; timeout = dropped/unreachable.
- `nc -zv host port` tests a port; `curl -v`, `-I`, `-sf`, `-w '%{http_code}'` test HTTP; `wget` downloads.
- Port in use → `ss -ltnp` → PID → `ps` → stop gracefully or change port.
