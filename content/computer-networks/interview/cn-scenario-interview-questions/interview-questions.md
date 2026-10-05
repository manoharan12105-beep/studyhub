# Scenarios, Debugging and "What Happens Internally" — Interview Questions

## Intermediate

### Q1. What happens when you type a URL into the browser and press Enter?

**Style:** What happens internally

<details>
<summary>Answer</summary>

(Assuming the device already has DHCP configuration.) The browser parses the URL and checks HSTS and its cache → DNS resolution through browser/OS/resolver caches and, if needed, root → TLD → authoritative → the host is remote, so packets go to the default gateway, whose MAC comes from ARP → TCP three-way handshake to port 443 (NAT at the home router, hop-by-hop routing) → TLS handshake and certificate validation → encrypted HTTP request → CDN/load balancer → application server (database, other services) → response back through the same path, TCP handling loss and congestion → browser parses, fetches sub-resources (reusing the connection), runs JavaScript and renders.

</details>

### Q2. How would you troubleshoot "no internet" on a laptop?

**Style:** Debugging

<details>
<summary>Answer</summary>

Scope first (only this laptop? others fine?). Then bottom-up: Wi-Fi/cable connected → `ipconfig /all` (valid IP, not 169.254.x.x; mask; gateway; DNS) → `ping <gateway>` → `ping 1.1.1.1` → `nslookup example.com` → `curl -v https://example.com`. The first failure points to the cause: link, DHCP, LAN/gateway, upstream/ISP, DNS, or a proxy/firewall/site issue.

</details>

### Q3. You can ping `8.8.8.8` but not `google.com`. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

Layers 1–3 work, so DNS is failing: wrong or unreachable DNS server, DNS blocked, or a hosts-file problem. Confirm with `nslookup google.com` (fails) and `nslookup google.com 1.1.1.1` (works) — then fix the DNS server settings (DHCP option 6) or the resolver.

</details>

### Q4. Connection refused vs connection timeout — how do you troubleshoot each?

**Style:** Comparison

<details>
<summary>Answer</summary>

Refused (immediate RST): the host is reachable but nothing listens there — check the service is running, the port, the bind address (`ss -ltnp`: 127.0.0.1 vs 0.0.0.0), containers' localhost. Timeout (no reply): the path drops packets — check DNS resolves to the right IP, firewalls/security groups/NACLs, routes, whether the host is up; `tcpdump` on the server shows whether SYNs arrive.

</details>

### Q5. Users can open one website but not another. How do you narrow it down?

**Style:** Debugging

<details>
<summary>Answer</summary>

General connectivity is fine, so test the failing site's phases with `curl -v`: DNS (does it resolve, to what?), TCP connect (refused/timeout?), TLS (certificate error, blocked SNI?), HTTP (status code?). Try `-4`/`-6` separately and another network (hotspot) to see whether it is your network's proxy/firewall/MTU/IPv6 path or the site itself.

</details>

## Advanced

### Q6. Your API behind a load balancer intermittently returns 504. What do you check?

**Style:** Scenario

<details>
<summary>Answer</summary>

504 = the backend did not answer before the LB's timeout. Identify which endpoints and when (metrics, traces). On the backend: slow queries, DB pool waits, thread pool saturation, downstream calls without timeouts, GC pauses, CPU throttling. Compare LB timeout vs request duration. Fix the slow path, add timeouts/circuit breakers, scale, or make long operations asynchronous (202 + polling).

</details>

### Q7. A Spring Boot service suddenly cannot connect to PostgreSQL after a network change. Walk through your investigation.

**Style:** Debugging

<details>
<summary>Answer</summary>

Read the exception: `UnknownHostException` → DNS; `Connection refused` → PostgreSQL not listening on that address/port; `connect timed out` → security group/firewall/NACL/route; `no pg_hba.conf entry` → network OK, access rule missing for the new source IP/subnet; pool timeout → app/DB load, not the network. Verify from the app host: `getent hosts db`, `nc -zv db 5432`, route tables, then fix the rule or config that changed.

</details>

### Q8. Explain what happens, at the network level, when a client calls a Spring Boot API through HTTPS and a load balancer, and the API queries PostgreSQL.

**Style:** What happens internally

<details>
<summary>Answer</summary>

DNS resolves the API name to the LB; TCP and TLS handshakes with the LB (or a reused HTTP/2 connection); the LB terminates TLS, reads the request (L7), picks a healthy instance and forwards it over a pooled keep-alive connection with `X-Forwarded-For/-Proto`. Tomcat assigns a worker thread; Spring Security validates the token; the controller runs and borrows a pooled, authenticated PostgreSQL connection (TCP 5432, maybe TLS) from HikariCP, executing queries (one round trip each). The response returns to the LB and is re-encrypted to the client.

</details>

### Q9. A website loads slowly only for users in another country. How do you diagnose and fix it?

**Style:** Scenario

<details>
<summary>Answer</summary>

Likely distance (RTT) multiplied by round trips. Measure from that region (synthetic monitoring, `curl -w`, traceroute): high connect/TLS times with normal server time confirm network latency. Fixes: CDN/edge caching and TLS termination near users, regional deployments, HTTP/2–3, fewer round trips (bundling, preconnect, caching), connection reuse.

</details>

### Q10. After a deployment, some requests fail with "connection reset by peer" only after idle periods. What is the likely cause?

**Style:** Debugging

<details>
<summary>Answer</summary>

Idle connections in a pool (HTTP client or DB) were silently dropped by a middlebox (LB, NAT gateway, firewall) whose idle timeout is shorter than the pool's connection lifetime; the first request on a dead connection gets an RST. Align timeouts: pool max lifetime/idle below the middlebox timeout, enable keepalive probes and validation, backend keep-alive longer than the LB's, and retry idempotent requests.

</details>

### Q11. Follow-up chain: "What happens when you type a URL?" → "What if DNS returns two IPs?" → "What if the first one is down?"

**Style:** Follow-up

<details>
<summary>Answer</summary>

With multiple A/AAAA records the client chooses one (often the first, with IPv6 preferred via Happy Eyeballs). If that address does not answer, well-behaved clients try the next address after a connect timeout or failure (browsers and curl do; some simple clients do not). That is why DNS round robin alone is weak for high availability — health-checked load balancers or failover DNS with short TTLs are used instead.

</details>

### Q12. A colleague says "the network is slow" because file uploads to S3 take long. How do you check whether it's bandwidth, latency or something else?

**Style:** Scenario

<details>
<summary>Answer</summary>

Measure throughput vs expected bandwidth (a speed test or a large single transfer), RTT to the endpoint (ping/connect time), and loss (mtr, retransmissions). Large single files at low throughput with high RTT suggest window/latency limits — use multipart parallel uploads. Loss suggests a bad link or congestion. If uploads saturate the uplink, it is simply bandwidth — schedule or throttle. Also check client CPU/disk and the region of the bucket.

</details>
