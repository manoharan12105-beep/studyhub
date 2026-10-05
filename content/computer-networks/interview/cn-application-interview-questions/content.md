# Interview Questions: HTTP, HTTPS, DNS and Backend Networking

**Module:** Interview Preparation · **Interview priority:** Core

## What Is It?

A cross-topic bank of [interview questions](interview-questions.md) for backend and full-stack interviews: HTTP semantics and versions, HTTPS/TLS, DNS, cookies and sessions, load balancing, caching, CDNs and connection reuse.

## Why It Matters

Backend developers work at the application layer every day. Interviewers expect you to connect protocol knowledge to Spring Boot behaviour: status codes, idempotent retries, TLS termination at load balancers, forwarded headers, DNS-based service discovery and connection pools.

## Core Concept

### Answer patterns

- Explain the protocol mechanism, then say what it means **for a Spring Boot service**.
- For comparisons (HTTP/1.1 vs 2, L4 vs L7, 401 vs 403), give a table-like contrast and a use case.
- For "how does it work" (TLS, DNS), give the step sequence in order.

### Coverage

| Area | Lessons |
|------|---------|
| HTTP | [Fundamentals](../../http/http-fundamentals/content.md), [Methods](../../http/http-methods-and-idempotency/content.md), [Status Codes](../../http/http-status-codes/content.md), [Headers and Cookies](../../http/http-headers-cookies-and-sessions/content.md), [Versions](../../http/http-versions/content.md) |
| HTTPS | [Encryption](../../https-and-tls/encryption-fundamentals/content.md), [Certificates](../../https-and-tls/certificates-and-certificate-authorities/content.md), [TLS Handshake](../../https-and-tls/tls-handshake-and-https/content.md) |
| DNS | [Fundamentals](../../dns/dns-fundamentals/content.md), [Resolution](../../dns/dns-resolution-process/content.md), [Records](../../dns/dns-record-types/content.md), [Caching and Failures](../../dns/dns-caching-ttl-and-failures/content.md) |
| Performance | [Backends](../../performance/network-performance-for-backends/content.md), [Pooling](../../performance/keep-alive-and-connection-pooling/content.md), [CDNs](../../performance/caching-and-cdns/content.md), [Load Balancing](../../performance/load-balancing-l4-vs-l7/content.md) |

## Key Takeaways

- Tie every protocol answer to backend consequences.
- Know the exact order of steps for TLS and DNS.
- Know which status code, header or setting solves which production problem.
