# TCP Connection Termination, TIME_WAIT and TCP States — Interview Questions

## Beginner

### Q1. Explain the TCP four-way termination.

<details>
<summary>Answer</summary>

The side that closes first sends FIN (FIN-WAIT-1). The other side ACKs it (the closer moves to FIN-WAIT-2; the other side is in CLOSE-WAIT and its application sees end-of-stream). When that application closes, it sends its own FIN (LAST-ACK). The first side ACKs it and enters TIME-WAIT for 2 × MSL; the other side goes to CLOSED. Each direction is closed separately because TCP is full duplex.

</details>

### Q2. Why does termination take four steps when the handshake takes three?

**Style:** Why

<details>
<summary>Answer</summary>

In the handshake the server can always send its SYN together with its ACK. In termination, after receiving a FIN the other side may still have data to send, so it ACKs immediately but sends its own FIN only when its application closes. If it has nothing left, it can combine them (FIN-ACK) and the close takes three segments.

</details>

## Intermediate

### Q3. What is TIME_WAIT and why does it exist?

<details>
<summary>Answer</summary>

The state the active closer enters after sending the final ACK, lasting 2 × MSL (60 s on Linux). It lets the closer re-acknowledge the peer's FIN if the final ACK was lost (otherwise it would reply RST), and it keeps the 4-tuple reserved until any delayed duplicate segments from the old connection have expired, so they cannot corrupt a new connection with the same 4-tuple.

</details>

### Q4. A server shows thousands of connections in CLOSE_WAIT. What does that tell you?

**Style:** Debugging

<details>
<summary>Answer</summary>

The remote peers have closed their side, but the local application never closed its sockets — a resource leak in the application (unclosed HTTP responses, streams or JDBC connections, or threads stuck before `close()`). CLOSE_WAIT does not time out on its own; eventually the process runs out of file descriptors. Fix the code (try-with-resources, close response bodies, use pooled clients properly).

</details>

### Q5. What is the difference between closing with FIN and with RST?

**Style:** Comparison

<details>
<summary>Answer</summary>

FIN is a graceful close of one direction: data already sent is delivered and acknowledged, and the connection goes through the normal closing states (with TIME_WAIT). RST aborts immediately: pending data is discarded, no TIME_WAIT, and the peer gets "connection reset by peer". RST is sent for segments to unknown connections, on abortive close, or by middleboxes killing connections.

</details>

## Advanced

### Q6. A load-balanced service returns occasional 502 errors exactly when connections have been idle for a while. What TCP-level cause would you check?

**Style:** Scenario

<details>
<summary>Answer</summary>

A keep-alive timeout mismatch: if the backend closes idle connections before the load balancer does, the LB may send a new request on a connection the backend has just closed (the backend replies RST), producing a 502. Configure the backend's idle/keep-alive timeout to be longer than the load balancer's idle timeout, so the LB always closes first.

</details>

### Q7. Your service makes many short HTTP calls to one downstream host and starts failing with port exhaustion. What is happening and what is the right fix?

**Style:** Debugging

<details>
<summary>Answer</summary>

Each call opens a new connection; the service closes it first, so each socket sits in TIME_WAIT for 60 s, keeping its ephemeral port busy for that destination. With thousands of calls per minute, the ephemeral port range runs out. The right fix is connection reuse — HTTP keep-alive with a pooled client (Apache/OkHttp/JDK HttpClient shared instance) — rather than tuning away TIME_WAIT.

</details>
