# Network Security Fundamentals and Authentication vs Authorization

**Module:** Network Security · **Interview priority:** Core

## What Is It?

Network security protects data and services as they travel and where they are reachable. Its goals are summarised as the **CIA triad**:

| Goal | Meaning | Network tools |
|------|---------|---------------|
| **Confidentiality** | Only intended parties can read data | TLS/HTTPS, SSH, VPNs, Wi-Fi WPA3 |
| **Integrity** | Data is not altered undetected | TLS MACs, signatures, checksums against accidents |
| **Availability** | Services stay reachable | Redundancy, load balancing, DDoS protection, rate limiting |

Two more ideas run through every design: **authentication** (who are you?) and **authorization** (what may you do?).

## Why It Exists

Every layer can be attacked: someone can sniff Wi-Fi (Layer 1–2), forge ARP replies (2), spoof IP addresses (3), flood SYNs (4), or abuse an API (7). Security is therefore applied **in layers** — no single control is enough.

## How It Works

### Authentication vs authorization

| | Authentication (AuthN) | Authorization (AuthZ) |
|---|------------------------|------------------------|
| Question | **Who are you?** | **What are you allowed to do?** |
| Happens | First | After authentication |
| Based on | Something you know (password), have (phone, key, certificate), are (fingerprint) | Roles, permissions, policies, ownership |
| Network examples | Password + OTP, SSH keys, client certificates (mTLS), 802.1X on switch ports, VPN login | Firewall rules, ACLs, security groups, VPN access policies |
| Application examples | Login, JWT validation in Spring Security | `@PreAuthorize("hasRole('ADMIN')")`, "users may only read their own orders" |
| HTTP failure | **401 Unauthorized** (actually "unauthenticated") | **403 Forbidden** |

```text
Request with token ──► [AuthN] valid token? → who is it: user 42, roles [USER]
                         │ no → 401
                         ▼
                       [AuthZ] may user 42 DELETE /api/users/7?
                         │ no → 403
                         ▼
                       allowed → handler runs
```

Related: **accounting/auditing** (logging who did what) completes the classic AAA model. Spring Security specifics: [Authentication Architecture](../../../spring-boot/security/authentication-architecture/content.md).

### Defence in depth

Stack independent controls so one failure does not expose everything:

```text
Internet ─► DDoS protection / CDN ─► WAF ─► load balancer (TLS) ─► firewall / security group
         ─► app authN + authZ + input validation ─► database (private subnet, least-privilege user, encrypted)
         + monitoring, logging, patching everywhere
```

### Core principles

| Principle | Meaning | Example |
|-----------|---------|---------|
| **Least privilege** | Grant only what is needed | DB user for the app cannot `DROP TABLE`; security group allows 5432 only from the app subnet |
| **Default deny** | Block everything not explicitly allowed | Firewall ends with "deny all" |
| **Segmentation** | Separate networks by trust level | Public subnet (LB) / private (app) / data (DB); VLANs for guests |
| **Encrypt in transit** | Assume the network is hostile | HTTPS everywhere, TLS to the database |
| **Zero trust** | Never trust based on network location alone; authenticate and authorise every request | mTLS between services, identity-aware proxies instead of "inside the VPN = trusted" |
| **Minimise attack surface** | Fewer open ports and services | No SSH open to the Internet; no admin endpoints publicly exposed |

### Where the module goes next

- [Firewalls and ACLs](../firewalls-and-acls/content.md) — controlling who can reach what.
- [VPNs and Tunnelling](../vpns-and-tunneling/content.md) — private paths across public networks.
- [Common Network Attacks](../common-network-attacks/content.md) — DoS/DDoS, MITM, sniffing, spoofing, phishing, port scanning — and defences.
- [TLS and HTTPS](../../https-and-tls/tls-handshake-and-https/content.md) — confidentiality and integrity in transit.

## Real World

A Spring Boot API's security, layer by layer:

| Layer | Control |
|-------|---------|
| Network | Security groups: LB accepts 443 from anywhere; app accepts 8080 only from the LB; DB 5432 only from the app |
| Transport | TLS at the LB (and optionally to the app and DB) |
| Application | Spring Security: JWT authentication, role-based authorization, CSRF/CORS settings, input validation |
| Data | Least-privilege DB user, encryption at rest, secrets in a vault, not in Git |
| Operations | Logging, alerts on 401/403 spikes, patching, rate limiting |

## Common Traps

- **"Authentication and authorization are the same."** One proves identity; the other grants permissions.
- **"Inside the corporate network is safe."** Most breaches move laterally inside; zero trust assumes the network is hostile.
- **"HTTPS means the application is secure."** It protects data in transit only — not against injection, broken access control or stolen credentials.
- **"401 means forbidden."** 401 = not authenticated; 403 = authenticated but not allowed.

## Interview Follow-up

- *"Authentication vs authorization with an example?"* Logging in with a password vs being allowed to delete only your own posts.
- *"What is defence in depth?"* Multiple independent layers of control (network, transport, application, data, monitoring).

## Key Takeaways

- CIA: confidentiality, integrity, availability.
- AuthN = who you are (401 when missing); AuthZ = what you may do (403 when denied).
- Defence in depth, least privilege, default deny, segmentation, encryption in transit, zero trust.
- Every layer has its own attacks and controls.
