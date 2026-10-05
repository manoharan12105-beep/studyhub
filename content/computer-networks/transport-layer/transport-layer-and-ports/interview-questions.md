# The Transport Layer and Port Numbers — Interview Questions

## Beginner

### Q1. What does the transport layer do?

<details>
<summary>Answer</summary>

It provides process-to-process communication between applications on different hosts. It multiplexes many applications over one IP address using port numbers and, with TCP, adds connection management, reliability, ordering, flow control and congestion control. UDP provides only ports and a checksum.

</details>

### Q2. What is a port number? What are the port ranges?

<details>
<summary>Answer</summary>

A 16-bit number (0–65535) in the TCP/UDP header that identifies an application endpoint on a host. Ranges: 0–1023 well-known (HTTP 80, HTTPS 443, SSH 22), 1024–49151 registered (PostgreSQL 5432, MySQL 3306), 49152–65535 dynamic/ephemeral (client-side ports).

</details>

### Q3. Name the default ports of HTTP, HTTPS, SSH, DNS, SMTP and PostgreSQL.

<details>
<summary>Answer</summary>

HTTP 80, HTTPS 443, SSH 22, DNS 53 (UDP, and TCP for large responses/zone transfers), SMTP 25 (587 for submission), PostgreSQL 5432.

</details>

## Intermediate

### Q4. What is an ephemeral port and why does the client use one?

<details>
<summary>Answer</summary>

A temporary port chosen by the client's OS from the dynamic range for the client side of a connection. It lets one client open many simultaneous connections to the same server port — each connection differs by its source port — and the server's replies are addressed back to it.

</details>

### Q5. How can one web server on port 443 handle thousands of clients at the same time?

**Style:** What happens internally

<details>
<summary>Answer</summary>

Each TCP connection is identified by the 4-tuple (client IP, client port, server IP, server port). All connections share the server side (IP, 443) but differ in the client IP and/or port, so the OS demultiplexes each incoming segment to the right connection socket. The listening socket only accepts new connections.

</details>

## Advanced

### Q6. Are TCP port 53 and UDP port 53 the same port?

**Style:** Follow-up

<details>
<summary>Answer</summary>

No. TCP and UDP have separate port spaces; a segment's protocol (from the IP header's Protocol field) decides which table the OS looks in. DNS happens to use both: UDP 53 for normal queries, TCP 53 for large responses and zone transfers.

</details>
