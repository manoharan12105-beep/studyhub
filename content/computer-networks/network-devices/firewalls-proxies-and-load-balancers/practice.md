# Middleboxes: Firewalls, Proxies and Load Balancers — Practice

### P1. Which middlebox?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** reverse proxy

Nginx receives all requests for `api.example.com`, terminates TLS and forwards them to three Spring Boot instances. Nginx is acting as a:

- A) Forward proxy
- B) Reverse proxy / load balancer
- C) Modem
- D) Stateless packet filter

<details>
<summary>Answer</summary>

**Answer:** B) Reverse proxy / load balancer

</details>

### P2. Write the rules

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** firewall rules

Web servers are in `10.0.1.0/24`, PostgreSQL is `10.0.2.20`. Write three firewall rules (in plain words) so that the Internet reaches only HTTPS on the web tier and only the web tier reaches the database.

<details>
<summary>Answer</summary>

1. Allow TCP from any source to `10.0.1.0/24` port 443.
2. Allow TCP from `10.0.1.0/24` to `10.0.2.20` port 5432.
3. Deny everything else (default deny).
With a stateful firewall, replies to allowed connections are permitted automatically.

</details>

### P3. Client IP

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** X-Forwarded-For

Your access logs show every request coming from `10.0.0.7`, the load balancer. Which header contains the real client IP, and what is the risk of trusting it blindly?

<details>
<summary>Answer</summary>

`X-Forwarded-For` (or `Forwarded`). A client can send its own fake `X-Forwarded-For`; trust only the entries added by your own proxies (configure trusted proxy addresses).

</details>

### P4. L4 or L7?

**Difficulty:** Medium · **Type:** Comparison · **Concepts:** load balancer layers

You need to send `/api/*` to the Spring Boot pool and `/static/*` to an Nginx pool. Can an L4 load balancer do this?

<details>
<summary>Answer</summary>

No. An L4 balancer sees only IPs and ports; the path is inside the HTTP request (encrypted, if HTTPS). Path-based routing needs an L7 load balancer that terminates TLS and reads HTTP.

</details>
