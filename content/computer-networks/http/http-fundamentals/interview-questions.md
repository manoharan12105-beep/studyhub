# HTTP Fundamentals — Interview Questions

## Beginner

### Q1. What is HTTP?

<details>
<summary>Answer</summary>

The HyperText Transfer Protocol: a request/response application-layer protocol in which a client asks a server for a resource identified by a URL, and the server replies with a status, headers and an optional body. It is stateless and runs over TCP (80), TLS (HTTPS, 443) or QUIC (HTTP/3).

</details>

### Q2. What are the parts of an HTTP request and response?

<details>
<summary>Answer</summary>

Request: request line (method, path, version), headers, a blank line, optional body. Response: status line (version, status code, reason phrase), headers, a blank line, optional body. Example: `GET /api/orders/7 HTTP/1.1` → `HTTP/1.1 200 OK` with `Content-Type: application/json` and a JSON body.

</details>

## Intermediate

### Q3. What does "HTTP is stateless" mean? How do applications remember users?

**Style:** Why

<details>
<summary>Answer</summary>

The server keeps no protocol-level memory between requests; each request must carry everything needed to process it. Applications remember users by sending identity with every request — a session cookie pointing to server-side session data, or a self-contained token such as a JWT in the `Authorization` header. Statelessness lets any server behind a load balancer handle any request.

</details>

### Q4. Why is the `Host` header mandatory in HTTP/1.1?

<details>
<summary>Answer</summary>

Many websites share one IP address (virtual hosting). The request line contains only the path, so the server or reverse proxy needs `Host` to know which site is meant. (In HTTPS, the TLS SNI extension carries the host name earlier so the right certificate can be chosen.)

</details>

## Advanced

### Q5. How does the receiver know where an HTTP/1.1 body ends on a persistent connection?

**Style:** What happens internally

<details>
<summary>Answer</summary>

TCP is a byte stream without message boundaries, so HTTP frames messages itself: the headers end at the empty line, and the body length comes from `Content-Length`, or from `Transfer-Encoding: chunked` (each chunk prefixed by its size, ending with a zero-size chunk). Without either, a response body ends when the connection closes. HTTP/2 and HTTP/3 use binary frames with explicit lengths instead.

</details>
