# Common Network Attacks and Defences

**Module:** Network Security · **Interview priority:** Frequently asked

> [!NOTE]
> This topic is **defensive**: it explains how attacks work so you can recognise them and design against them. Testing attacks against systems you do not own or have no written permission to test is illegal.

## What Is It?

The attacks most often discussed in interviews, organised by what they target:

| Attack | Targets | CIA goal hit | Layer |
|--------|---------|--------------|-------|
| DoS / DDoS | A service's capacity | Availability | 3–7 |
| Packet sniffing | Unencrypted traffic | Confidentiality | 1–2 |
| Man-in-the-middle (MITM) | A conversation between two parties | Confidentiality, integrity | 2–7 |
| Spoofing (IP, ARP, DNS, email) | Trust in addresses and names | Integrity, authentication | 2–7 |
| Phishing | People | Authentication (credentials) | 7 / human |
| Port scanning | Reconnaissance of open services | (precursor) | 4 |

## Why It Exists

Many core protocols (ARP, IP, DNS, SMTP) were designed for a cooperative network and trust what they receive. Attacks exploit that trust, or simply overwhelm finite resources. Knowing them explains *why* we use TLS, firewalls, rate limits and MFA.

## The Attacks

### DoS and DDoS

**Denial of Service** makes a service unavailable by exhausting a resource; **Distributed** DoS uses thousands of machines (often a botnet of hacked devices).

| Kind | How | Example | Defences |
|------|-----|---------|----------|
| **Volumetric** | Saturate bandwidth | UDP floods; **amplification** via open DNS/NTP/memcached with a spoofed source | Upstream scrubbing, CDN/anycast absorption, ISP filtering (BCP 38) |
| **Protocol** | Exhaust connection state | **SYN flood** fills half-open connection queues | SYN cookies, firewall/LB protection, rate limits |
| **Application (L7)** | Expensive requests | Flood of search or login requests, slow-loris (very slow headers) | WAF, rate limiting, caching, CAPTCHAs, timeouts, autoscaling |

### Packet sniffing

Capturing traffic on a shared medium or a compromised position (open Wi-Fi, a mirrored switch port, a hacked router). Tools like Wireshark are legitimate for troubleshooting. Anything sent in **plain text** — HTTP, Telnet, FTP, unencrypted SMTP/IMAP, Basic auth — is exposed.
**Defence:** encryption everywhere (HTTPS, SSH, TLS to databases, WPA3 Wi-Fi); switched networks; VPNs on untrusted networks.

### Man-in-the-middle (MITM)

The attacker positions itself between two parties, relaying (and possibly modifying) traffic while each side believes it talks to the other. Ways in: ARP spoofing on a LAN, a rogue Wi-Fi access point ("evil twin"), DNS spoofing, a compromised router or proxy. SSL stripping tries to keep the victim on HTTP.
**Defence:** TLS with certificate verification (the MITM cannot present a valid certificate for the domain), **HSTS** (forces HTTPS), never clicking through certificate warnings, SSH host-key checking, mutual TLS between services.

### Spoofing

| Kind | Forged | Effect | Defence |
|------|--------|--------|---------|
| **IP spoofing** | Source IP | Hide origin; reflection/amplification DDoS; bypass naive IP-based trust | Ingress/egress filtering (BCP 38), never use source IP as authentication |
| **ARP spoofing** | IP ↔ MAC mapping on a LAN | Victim sends traffic to the attacker (MITM) | Dynamic ARP Inspection, static entries for gateways, encryption |
| **DNS spoofing / cache poisoning** | DNS answers | Victims sent to the attacker's IP | DNSSEC, randomised query IDs and ports, DoH/DoT, TLS certificates as a backstop |
| **MAC spoofing** | MAC address | Bypass MAC filters | 802.1X authentication |
| **Email spoofing** | From address | Phishing | SPF, DKIM, DMARC |

### Phishing

Tricking people into revealing credentials or running malware — fake login pages, urgent emails, look-alike domains (`examp1e.com`), SMS (smishing), calls (vishing). A valid HTTPS padlock does **not** mean the site is legitimate.
**Defence:** MFA (preferably phishing-resistant: passkeys/FIDO2 security keys), email authentication (SPF/DKIM/DMARC), user awareness, password managers (they will not autofill on the wrong domain).

### Port scanning

Probing a host's ports to find open services and their versions — the reconnaissance step before an attack (and a normal part of authorised security testing).

| Probe result | Meaning |
|--------------|---------|
| SYN-ACK received | **Open** — a service listens |
| RST received | **Closed** — host reachable, nothing listening |
| No reply / ICMP prohibited | **Filtered** — a firewall drops or rejects it |

**Defence:** expose as few ports as possible (default-deny firewalls), patch exposed services, rate-limit and alert on scans (IDS), do not reveal versions in banners.

## Summary: Attack → Defence

| Attack | Primary defences |
|--------|------------------|
| DDoS | CDN/anycast, scrubbing services, rate limiting, autoscaling, SYN cookies |
| Sniffing | Encryption in transit (TLS, SSH, VPN, WPA3) |
| MITM | TLS + certificate validation, HSTS, mTLS, DAI |
| IP/ARP/DNS spoofing | Filtering, DAI, DNSSEC, never trust addresses as identity |
| Phishing | MFA/passkeys, DMARC, training |
| Port scanning | Minimal exposure, firewalls, IDS, patching |

## Real World

For a Spring Boot API on the Internet: a CDN/WAF in front absorbs DDoS and filters L7 attacks; rate limiting per client (API gateway or Bucket4j-style) protects login and expensive endpoints; HTTPS + HSTS stops MITM and sniffing; only port 443 is exposed; login uses MFA; logs alert on spikes of 401/403/429.

## Common Traps

- **"HTTPS sites are safe from phishing."** Phishing sites have valid certificates; HTTPS only proves the connection goes to *that* domain.
- **"Blocking an attacker's IP stops a DDoS."** Distributed and spoofed sources make IP blocking futile at scale.
- **"Private networks cannot be sniffed."** Insiders, compromised hosts and ARP spoofing make internal traffic vulnerable — encrypt internal traffic too.

## Interview Follow-up

- *"How does HTTPS prevent MITM?"* Certificate validation proves the server's identity; the MITM cannot sign the handshake as the real server.
- *"DoS vs DDoS?"* One source vs many distributed sources — DDoS cannot be stopped by blocking one IP.

## Key Takeaways

- DoS/DDoS hit availability (volumetric, protocol such as SYN flood, application layer).
- Sniffing and MITM hit confidentiality/integrity — defeated by encryption with authentication (TLS, SSH, HSTS).
- Spoofing forges IPs, ARP, DNS or email identities — never treat addresses as proof of identity.
- Phishing targets people — MFA and email authentication help. Port scans precede attacks — minimise exposure.
