# IP Addresses, Ports, Sockets and Connections — Interview Questions

## Beginner

### Q1. What is the difference between an IP address and a port?

**Style:** Comparison

<details>
<summary>Answer</summary>

An IP address identifies a host's network interface so packets reach the right machine; a port identifies a specific process or service on that machine (443 for HTTPS, 5432 for PostgreSQL). Together they form a socket address.

</details>

### Q2. How can one server port handle thousands of simultaneous clients?

**Style:** How

<details>
<summary>Answer</summary>

A TCP connection is identified by the 4-tuple (source IP, source port, destination IP, destination port). All clients connect to the same destination port, but their source IPs or ports differ, so each connection is unique. The practical limit is server resources — memory, file descriptors and threads — not the port number.

</details>

## Intermediate

### Q3. Why is opening a new connection per request expensive?

**Style:** Why

<details>
<summary>Answer</summary>

Each new connection needs a TCP handshake (one round trip) and usually a TLS handshake (one more round trip with TLS 1.3, two with TLS 1.2) before the request is sent, plus CPU for cryptography and memory on both sides. On high-latency links this dominates request time, so clients reuse connections (keep-alive, HTTP/2) and services use connection pools.

</details>

### Q4. What happens when application servers open more database connections than the database allows?

**Style:** What happens if

<details>
<summary>Answer</summary>

New connection attempts are rejected (PostgreSQL returns "too many clients already"), so requests needing the database fail even though the database may have spare CPU. It often appears after autoscaling adds servers, each with its own pool. Fix by sizing pools against the database limit, adding a pooler like PgBouncer, or moving read traffic to replicas.

</details>

## Advanced

### Q5. How do chat or notification gateways hold millions of open connections?

**Style:** Design

<details>
<summary>Answer</summary>

By spreading connections over many gateway servers and using event-driven, non-blocking I/O (epoll-based servers such as Netty), so one thread serves many idle connections with small per-connection memory. The OS is tuned (file descriptor limits, socket buffers), a registry records which gateway holds each user, and clients reconnect to another gateway on failure.

</details>

### Q6. A proxy opening many outbound connections to one backend fails with "cannot assign requested address". Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

It has run out of ephemeral source ports for that destination IP and port: each outbound connection uses a local port, and closed connections stay in TIME_WAIT for a while. Fixes: reuse connections (keep-alive pools) instead of opening new ones per request, widen the ephemeral port range, add more source IPs or backend addresses.

</details>
