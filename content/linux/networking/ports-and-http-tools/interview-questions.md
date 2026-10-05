# Ports, Sockets and HTTP Tools — Interview Questions

## Beginner

### Q1. How do you find which process is using port 8080?

<details>
<summary>Answer</summary>

`sudo ss -ltnp 'sport = :8080'` (or `sudo ss -tulpn | grep :8080`) shows the process name and PID. Alternatives: `sudo lsof -i :8080`, `sudo netstat -tlnp | grep 8080`, `sudo fuser 8080/tcp`. Then inspect it with `ps -o pid,user,etime,cmd -p <PID>`.

</details>

### Q2. How do you list all listening ports?

<details>
<summary>Answer</summary>

`sudo ss -tulpn` — TCP and UDP, listening, with processes, numeric. Legacy: `sudo netstat -tulpn`.

</details>

### Q3. What is the difference between curl and wget?

<details>
<summary>Answer</summary>

`curl` transfers data and prints it to stdout by default; it gives full control over methods, headers and bodies, so it is the tool for testing APIs. `wget` is a downloader: it saves to a file by default, can resume and download recursively, but has limited request customisation.

</details>

### Q4. How do you see only the HTTP response headers of a URL?

<details>
<summary>Answer</summary>

`curl -I https://example.com` (a HEAD request). `curl -i` includes headers along with the body of a normal GET; `curl -v` shows request and response headers plus connection details.

</details>

## Intermediate

### Q5. What is the difference between "connection refused" and "connection timed out"?

<details>
<summary>Answer</summary>

Refused: the target host answered with a TCP reset — nothing is listening on that port (or a firewall rejects actively). Timed out: no answer at all — the host is down or unreachable, the IP is wrong, or a firewall silently drops packets. Refused points to the service; timeout points to the network or firewall.

</details>

### Q6. A service is running but other machines cannot connect to it. What do you check?

<details>
<summary>Answer</summary>

`ss -ltn` to see the listening address — `127.0.0.1` means local only; it must be `0.0.0.0`, `[::]` or the external IP. Then the host firewall (`ufw status`, `iptables`/`nft`), cloud security groups, and test from the client with `nc -zv host port`.

</details>

### Q7. How do you check an API's HTTP status code in a script?

<details>
<summary>Answer</summary>

`code=$(curl -s -o /dev/null -w '%{http_code}' https://api.example.com/health)` and compare it, or use `curl -sf URL` and test the exit code (non-zero for HTTP errors ≥ 400 and connection failures). Add `--max-time` so the script cannot hang.

</details>

### Q8. Why does binding to port 80 fail for a normal user?

<details>
<summary>Answer</summary>

Ports below 1024 are privileged on Linux; binding requires root or the `CAP_NET_BIND_SERVICE` capability. Options: run on a high port behind a reverse proxy (nginx), grant the capability (`setcap cap_net_bind_service=+ep binary` or `AmbientCapabilities=` in systemd), or use a load balancer/port redirect.

</details>

### Q9. What do `TIME-WAIT` and `CLOSE-WAIT` mean in `ss` output?

<details>
<summary>Answer</summary>

`TIME-WAIT`: the local side closed the connection and keeps the port pair reserved for a while (twice the maximum segment lifetime) so late packets are not misinterpreted — normal on busy clients/servers. `CLOSE-WAIT`: the remote side closed, but the local application has not closed its socket — many of these indicate an application bug leaking connections.

</details>

## Advanced

### Q10. How do you test TCP connectivity to a database when neither nc nor telnet is installed?

<details>
<summary>Answer</summary>

Bash's `/dev/tcp` pseudo-device: `timeout 3 bash -c '</dev/tcp/db.internal/5432' && echo open || echo closed`. Alternatively `curl -v telnet://db.internal:5432` or, from Java/Python tooling already on the box, open a socket.

</details>

### Q11. `curl https://internal-api` fails with "SSL certificate problem: unable to get local issuer certificate". What does it mean and how do you fix it properly?

<details>
<summary>Answer</summary>

curl cannot build a trust chain from the server's certificate to a trusted root — typically an internal CA not installed on the client, or a server that does not send its intermediate certificate. Fix by installing the CA certificate into the system store (`/usr/local/share/ca-certificates/` + `update-ca-certificates`) or passing `--cacert ca.pem`, or by fixing the server's chain. Do not use `-k` except for a quick manual test.

</details>

### Q12. How do you measure where time is spent in an HTTP request?

<details>
<summary>Answer</summary>

`curl -s -o /dev/null -w 'dns:%{time_namelookup} connect:%{time_connect} tls:%{time_appconnect} ttfb:%{time_starttransfer} total:%{time_total}\n' URL`. A large DNS time points at resolution, connect at network latency, TLS at handshake/OCSP, and time-to-first-byte at the server or application.

</details>
