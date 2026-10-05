# Network Diagnostic Commands — Interview Questions

## Beginner

### Q1. Which commands would you use to check a machine's IP configuration on Windows and Linux?

<details>
<summary>Answer</summary>

Windows: `ipconfig /all` (IP, mask, gateway, DNS servers, DHCP lease, MAC). Linux: `ip addr` (addresses), `ip route` (default gateway and routes), and `resolvectl status` or `/etc/resolv.conf` for DNS. `ifconfig` is the legacy Linux tool.

</details>

### Q2. What is the difference between ping and traceroute?

**Style:** Comparison

<details>
<summary>Answer</summary>

Ping sends ICMP Echo Requests to one destination and reports whether replies come back, their round-trip time and loss — reachability. Traceroute sends probes with increasing TTL so each router on the path reveals itself with ICMP Time Exceeded — it shows the path and where packets stop or latency jumps.

</details>

## Intermediate

### Q3. How do you check whether a remote port is open?

<details>
<summary>Answer</summary>

Linux/macOS: `nc -zv host port` (or `curl -v telnet://host:port`, or `curl -v` for HTTP services). Windows PowerShell: `Test-NetConnection host -Port 443`. A completed handshake means open; "connection refused" means the host answered but nothing listens; a timeout means packets are dropped (firewall) or the host is unreachable. Ping cannot test ports.

</details>

### Q4. How do you find which process is listening on port 8080?

<details>
<summary>Answer</summary>

Linux: `sudo ss -ltnp 'sport = :8080'` (or `sudo lsof -i :8080`). Windows: `netstat -ano | findstr :8080` to get the PID, then `tasklist /FI "PID eq <pid>"`. Also check the listening address: `127.0.0.1:8080` accepts only local connections, `0.0.0.0:8080` all interfaces.

</details>

### Q5. Why can `nslookup` show the right IP while the browser goes to a different one?

**Style:** Debugging

<details>
<summary>Answer</summary>

`nslookup` (and `dig`) query DNS servers directly, bypassing the OS resolver's hosts file and cache, and the browser has its own DNS cache. A hosts-file entry or stale cache affects the browser but not nslookup. Use `getent hosts name` (Linux) or `Resolve-DnsName` / check the hosts file and `ipconfig /flushdns` on Windows.

</details>

## Advanced

### Q6. How would you use curl to find where the time in a slow HTTPS request goes?

**Style:** How

<details>
<summary>Answer</summary>

`curl -o /dev/null -s -w 'dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\n' https://host/path`. A large DNS time points to resolution; connect minus DNS ≈ one RTT (network distance or SYN retries); TLS minus connect = handshake; TTFB minus TLS = server processing; total minus TTFB = download (bandwidth/size). Compare runs from different locations.

</details>
