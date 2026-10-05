# Troubleshooting Connection Errors — Interview Questions

## Intermediate

### Q1. What is the difference between "connection refused" and "connection timed out"?

**Style:** Comparison

<details>
<summary>Answer</summary>

Refused: the SYN reached the host (or a rejecting firewall), which replied with a TCP RST — the network path works but nothing listens on that IP and port, so the error is immediate. Timed out: no reply at all — packets are silently dropped by a firewall/security group, the IP or route is wrong, or the host is down — so the client retries SYNs until its timeout. Refused points to the service; timeout points to the network path or a firewall.

</details>

### Q2. A Spring Boot app works with `curl localhost:8080` on the server, but other machines get "connection refused". Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

It listens only on the loopback interface (`127.0.0.1:8080`, e.g. `server.address=127.0.0.1`), so connections arriving on the network interface find no listener and get RST. `ss -ltn` shows the bind address. Bind to `0.0.0.0` or the server's IP. (If it timed out instead, a firewall would be the suspect.)

</details>

### Q3. A containerised service fails to reach PostgreSQL at `localhost:5432` with "connection refused", though PostgreSQL runs on the host. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

Inside a container, `localhost` refers to the container's own network namespace, where nothing listens on 5432. Use the host's address (`host.docker.internal`, the bridge gateway IP) or, better, put PostgreSQL in a container on the same Docker network and use its service name; ensure PostgreSQL listens on that interface and `pg_hba.conf` allows the container network.

</details>

## Advanced

### Q4. Clients time out connecting to your new cloud service on port 443. How do you find where packets are dropped?

**Style:** Scenario

<details>
<summary>Answer</summary>

Confirm DNS returns the right IP. Test from within the same subnet (bypassing perimeter controls) and from outside. Check the instance's security group (inbound 443 from the client range), the subnet NACL (inbound 443 and outbound ephemeral ports — it is stateless), route tables (public subnet with an Internet gateway, or behind a load balancer), and the host firewall. Use VPC flow logs to see REJECTed flows and `tcpdump` on the instance to see whether SYNs arrive; if they arrive with no SYN-ACK, check that the service listens on 443 and the host firewall.

</details>

### Q5. A service sees "connection reset by peer" errors only on the first request after long idle periods. What is happening?

**Style:** What happens internally

<details>
<summary>Answer</summary>

A middlebox (load balancer, NAT gateway, firewall) or the server closed the idle connection after its idle timeout, but the client's pool still believed it was open. The first request on that dead connection gets an RST (or silence followed by a timeout). Fix by retiring pooled connections sooner than the shortest idle timeout on the path, enabling keepalive probes, validating connections before use, and retrying idempotent requests.

</details>
