# Middleboxes: Firewalls, Proxies and Load Balancers — Interview Questions

## Beginner

### Q1. What is a firewall?

<details>
<summary>Answer</summary>

A device or software that allows or blocks traffic according to ordered rules on fields such as source/destination IP, port, protocol and connection state. Network firewalls (including cloud security groups) protect a whole network segment; host firewalls (`ufw`, Windows Firewall) protect one machine.

</details>

### Q2. What is the difference between a forward proxy and a reverse proxy?

**Style:** Comparison

<details>
<summary>Answer</summary>

A forward proxy sits in front of clients and makes requests on their behalf — used for filtering, caching and controlling outbound access; servers see the proxy's IP. A reverse proxy sits in front of servers and receives requests on their behalf — used for TLS termination, load balancing, caching and hiding backends; clients see only the proxy.

</details>

## Intermediate

### Q3. Behind a load balancer, `request.getRemoteAddr()` in Spring Boot always returns the same IP. Why, and how do you get the real client IP?

**Style:** Debugging

<details>
<summary>Answer</summary>

The load balancer terminates the client's connection and opens its own connection to the app, so the TCP peer is the load balancer. It passes the original client address in `X-Forwarded-For` (or `Forwarded`). Configure `server.forward-headers-strategy=native` or `framework` so Spring uses it — and only trust these headers when they come from your own proxy, since clients can set them too.

</details>

### Q4. What is a middlebox, and why are they controversial?

<details>
<summary>Answer</summary>

Any on-path device that does more than forward packets — firewalls, NAT, proxies, load balancers, WAFs. They add security, scale and address sharing, but they break the end-to-end principle: they can block new protocols, drop unknown TCP options or rewrite traffic, which slows protocol evolution (one reason HTTP/3 runs over encrypted UDP via QUIC).

</details>

## Advanced

### Q5. Is a load balancer a firewall? Can it replace one?

**Style:** Follow-up

<details>
<summary>Answer</summary>

No. A load balancer distributes allowed traffic and exposes only the ports it listens on, which reduces exposure, but it is not designed to enforce network policy between segments. You still need security groups/firewall rules so that backends accept traffic only from the load balancer and databases only from the app tier, and often a WAF for application-layer attacks.

</details>
