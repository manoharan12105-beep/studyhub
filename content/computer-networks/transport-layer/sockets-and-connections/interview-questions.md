# Sockets and Connections — Interview Questions

## Beginner

### Q1. What is the difference between a port and a socket?

**Style:** Comparison

<details>
<summary>Answer</summary>

A port is a 16-bit number that identifies an application on a host. A socket is an endpoint — an IP address plus a port (and protocol), e.g. `203.0.113.10:443` — and also the OS object an application uses to send and receive. A TCP connection is a pair of sockets, identified by the 4-tuple.

</details>

### Q2. What uniquely identifies a TCP connection?

<details>
<summary>Answer</summary>

The 4-tuple: source IP, source port, destination IP, destination port (the 5-tuple adds the protocol). Two connections to the same server port are distinguished by the client's IP or port.

</details>

## Intermediate

### Q3. What happens on the server when `accept()` returns?

**Style:** What happens internally

<details>
<summary>Answer</summary>

The kernel has completed a three-way handshake on the listening socket and placed the connection in the accept queue. `accept()` removes it and returns a new connected socket representing that one client (local IP/port = the server's listening address, remote = the client's IP and ephemeral port). The listening socket stays in LISTEN and keeps accepting others.

</details>

### Q4. Can a server handle more than 65,535 simultaneous connections?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Yes. All server-side connections share one local port; they differ by the remote IP and port, so the number of possible 4-tuples is enormous. The practical limits are memory, file descriptors (`ulimit -n`), CPU and the thread or event-loop model. The 65,535 limit applies to the client side: one client IP can open at most about that many connections to the same server IP and port (fewer, given its ephemeral range).

</details>

## Advanced

### Q5. A reverse proxy starts failing with "Cannot assign requested address" when connecting to a backend under heavy load. What is happening?

**Style:** Debugging

<details>
<summary>Answer</summary>

Ephemeral port exhaustion: the proxy opens a new TCP connection per request to the same backend IP:port, and each closed connection sits in TIME_WAIT for a while, so the proxy runs out of free source ports for that destination. Fixes: reuse connections (keep-alive / connection pooling to the backend), widen the ephemeral port range, spread load across more backend IPs, or (carefully) enable `tcp_tw_reuse` for outgoing connections.

</details>
