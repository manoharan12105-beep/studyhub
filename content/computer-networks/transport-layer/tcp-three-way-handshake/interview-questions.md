# The TCP Three-Way Handshake — Interview Questions

## Beginner

### Q1. Explain the TCP three-way handshake.

<details>
<summary>Answer</summary>

1. The client sends SYN with its initial sequence number x (state SYN-SENT).
2. The server replies SYN-ACK: its own ISN y and ack = x + 1 (state SYN-RECEIVED).
3. The client sends ACK with ack = y + 1. Both sides are ESTABLISHED and data can flow.
It synchronises both sequence numbers, confirms both directions work and negotiates options such as MSS and window scaling.

</details>

### Q2. Why is the acknowledgement number x + 1 when the SYN carried no data?

<details>
<summary>Answer</summary>

The SYN flag itself consumes one sequence number (so does FIN). Acknowledging x + 1 confirms the SYN was received and says the first data byte expected is x + 1.

</details>

## Intermediate

### Q3. Why does TCP need three steps and not two?

**Style:** Why

<details>
<summary>Answer</summary>

Each side must send its ISN and receive an acknowledgement of it. With only SYN and SYN-ACK, the server would not know whether the client received its ISN or whether the SYN was an old delayed duplicate from a previous connection — it could open phantom connections. The third ACK confirms the client is live and synchronised. Three is the minimum because the server merges its ACK and its SYN into one segment.

</details>

### Q4. What happens if the client sends a SYN to a port where nothing is listening?

**Style:** What happens internally

<details>
<summary>Answer</summary>

The server's kernel responds with a TCP RST (reset). The client's `connect()` fails immediately with "Connection refused". If instead a firewall silently drops the SYN, the client retransmits SYNs with exponential back-off and eventually reports a timeout.

</details>

## Advanced

### Q5. What is a SYN flood and how do SYN cookies stop it?

**Style:** Scenario

<details>
<summary>Answer</summary>

An attacker sends many SYNs (often with spoofed sources) and never completes the handshake, filling the server's queue of half-open connections so legitimate clients cannot connect. With SYN cookies, when the queue is full the server keeps no state: it encodes the connection parameters (with a secret and a timestamp) in its ISN. A real client's final ACK returns ISN + 1, from which the server reconstructs and validates the connection; spoofed SYNs never return an ACK and cost nothing.

</details>

### Q6. How many round trips does a new HTTPS request cost before the server sees the request?

**Style:** Follow-up

<details>
<summary>Answer</summary>

With TLS 1.3 over TCP: 1 RTT for the TCP handshake + 1 RTT for the TLS handshake, then the request is sent (the response arrives after a third RTT). TLS 1.2 needs 2 RTTs for its handshake. Add DNS resolution if the name is not cached. HTTP/3 over QUIC combines transport and TLS into 1 RTT (0 RTT on resumption), and keep-alive/pooling avoids the cost entirely for reused connections.

</details>
