# From Wi-Fi to Web Page: What Happens When You Type a URL

**Module:** End-to-End Network Flows · **Interview priority:** Core

## What Is It?

The complete journey, from a laptop joining Wi-Fi to a rendered page, for `https://www.example.com/products` — every protocol from this course in the order it is used. This is the most famous networking interview question; a strong answer is structured, layered and mentions caching and failure points.

The setting:

```text
Laptop ──Wi-Fi──► Home router (192.168.1.1, public IP 198.51.100.7 via NAT) ──► ISP ──► Internet
                                                              … ──► CDN / load balancer 203.0.113.10 ──► web servers
```

## Why It Exists

Each protocol you studied solves one problem. Only when they run together in order do you see **why** each is needed — and where a failure at one step shows up as a symptom in another.

## The Journey

### Phase A — Joining the network

**Step 1. Connect to Wi-Fi (Layers 1–2).** The laptop finds the access point's SSID, **associates**, and authenticates (WPA2/WPA3 four-way handshake, deriving keys that encrypt the radio link). It now has a working link — but no IP address.

**Step 2. Get an IP configuration with DHCP (DORA).**

```text
DISCOVER  0.0.0.0:68 → 255.255.255.255:67   (broadcast — no IP yet, server unknown)
OFFER     192.168.1.1 → "192.168.1.23/24, gateway 192.168.1.1, DNS 192.168.1.1, lease 24h"
REQUEST   broadcast: "I take 192.168.1.23"
ACK       confirmed
```

The laptop now knows its **IP + mask**, its **default gateway** and its **DNS servers**. ([DHCP](../../dhcp/dhcp-dora/content.md))

**Step 3. Resolve the gateway's MAC with ARP.** Everything leaving the subnet goes to `192.168.1.1`, so the laptop broadcasts "Who has 192.168.1.1?" and caches the router's reply. ([ARP](../../arp-and-local-delivery/arp-address-resolution/content.md))

### Phase B — The user types the URL

**Step 4. The browser parses the URL.** Scheme `https` → port 443, host `www.example.com`, path `/products`. If the user typed only `example.com`, the browser may try HTTPS first or follow an HTTP → HTTPS redirect; an **HSTS** entry forces HTTPS immediately. The browser checks its **HTTP cache** — a fresh cached page means no network at all.

**Step 5. DNS resolution.** Caches first: browser → OS (and hosts file) → the router/resolver. On a miss, the recursive resolver walks **root → `.com` TLD → `example.com` authoritative** and returns, say, a CNAME to a CDN and then `A 203.0.113.10` (and an AAAA). ([DNS Resolution](../../dns/dns-resolution-process/content.md))

```text
laptop ──UDP 53──► 192.168.1.1 (resolver) ──► root → .com → authoritative ──► 203.0.113.10
```

Even the DNS query itself is a packet that needs Steps 6–7 below (it goes to the router).

**Step 6. Decide the route (Layer 3).** `203.0.113.10` is not in `192.168.1.0/24`, so the **next hop is the default gateway**. The frame will carry the **router's MAC** (from Step 3) while the packet carries the **server's IP**. ([Local vs Remote Delivery](../../arp-and-local-delivery/local-vs-remote-delivery/content.md))

### Phase C — Connecting

**Step 7. TCP three-way handshake (Layer 4).** The OS picks an ephemeral port (52100):

```text
192.168.1.23:52100 → 203.0.113.10:443   SYN
203.0.113.10:443  → 192.168.1.23:52100  SYN-ACK
192.168.1.23:52100 → 203.0.113.10:443   ACK          (1 RTT)
```

Each of these segments travels the full path:

- **Encapsulation:** TCP segment → IP packet → Wi-Fi frame to the router.
- **NAT at the home router:** source `192.168.1.23:52100` is rewritten to `198.51.100.7:40001` and recorded in the translation table; replies are translated back. ([NAT](../../nat/network-address-translation/content.md))
- **Routing across the Internet:** each router decrements TTL, does a **longest-prefix-match** lookup, and rebuilds the Layer 2 frame for the next link; BGP decided the path between ISPs. ([Routing](../../routing/routing-fundamentals/content.md))

**Step 8. TLS 1.3 handshake.** ClientHello (SNI `www.example.com`, ALPN `h2`, key share) → ServerHello + certificate + CertificateVerify + Finished → client verifies the certificate chain, hostname and validity → Finished. Both sides now hold symmetric session keys. (1 RTT) ([TLS](../../https-and-tls/tls-handshake-and-https/content.md))

### Phase D — The request and the response

**Step 9. Send the HTTP request** — encrypted inside TLS, over HTTP/2:

```http
GET /products HTTP/2
Host: www.example.com
Accept: text/html
Cookie: session=…
```

**Step 10. The server side.** At `203.0.113.10` a **CDN edge or load balancer** terminates TLS. If the page is cached at the edge, it answers immediately. Otherwise it forwards the request (over its own pooled connection) to an origin server — e.g. a Spring Boot application, which may query a database and other services ([Backend Request Flows](../backend-request-flows/content.md)).

**Step 11. The response travels back.**

```http
HTTP/2 200
Content-Type: text/html; charset=utf-8
Cache-Control: no-cache
Content-Encoding: br
```

The body is split into TCP segments (or QUIC packets); TCP acknowledges, retransmits anything lost, and grows its congestion window; NAT translates the destination back to `192.168.1.23:52100`.

**Step 12. The browser renders.** It decompresses and parses the HTML, discovers CSS, JavaScript and images, and fetches them — many over the **same** HTTP/2 connection, some from other domains (each new domain repeats DNS → TCP → TLS), many served from cache (`304 Not Modified` or fresh copies). It builds the DOM and CSSOM, runs JavaScript, lays out and paints the page. Later API calls (`fetch('/api/cart')`) reuse the connection.

## Timeline: Where the Time Goes

With an 80 ms RTT to the server and nothing cached:

| Phase | Approximate cost |
|-------|------------------|
| DNS (cold) | 20–100 ms (cached: ~0) |
| TCP handshake | 1 RTT = 80 ms |
| TLS 1.3 handshake | 1 RTT = 80 ms |
| Request → first byte | 1 RTT + server time = 80 ms + X |
| Body download + sub-resources | Several RTTs (slow start, dependencies) |

Optimisations map directly onto these steps: DNS caching and prefetch, CDN edges (shorter RTT), keep-alive and HTTP/2 (no repeated handshakes), TLS 1.3 / HTTP/3 (fewer round trips), compression and caching (fewer bytes).

## What Can Fail at Each Step

| Step | Failure | Symptom |
|------|---------|---------|
| 1 | Wrong Wi-Fi password, weak signal | Not connected / drops |
| 2 | DHCP server down | `169.254.x.x`, no gateway |
| 3, 6 | Wrong gateway | Local works, Internet does not |
| 5 | DNS broken | "Server IP address could not be found"; ping by IP works |
| 7 | Firewall drop / no listener | Timeout / connection refused |
| 8 | Expired or wrong certificate, wrong clock | Browser certificate warning |
| 10 | Backend down/slow | 502 / 503 / 504 from the LB/CDN |
| 11 | Packet loss | Slow, stalling download |

## Real World

Browser dev tools (Network tab → Timing) show exactly these phases for every request: *DNS Lookup*, *Initial connection*, *SSL*, *Waiting for server response (TTFB)*, *Content Download*. `curl -w` prints the same breakdown from the command line ([Diagnostic Commands](../../troubleshooting/network-diagnostic-commands/content.md)).

## Common Traps

- **Starting the answer with HTTP.** DNS, TCP and TLS come first — and DHCP/ARP before that.
- **Forgetting caches.** Browser cache, DNS caches and CDN caches often skip whole steps.
- **"The packet's destination MAC is the server's."** It is the default gateway's; MACs change every hop, IPs do not (except NAT).
- **Saying "the browser connects to the server" without layers.** Mention transport (TCP 443), security (TLS), and how the packet is delivered (IP routing, NAT).

## Interview Follow-up

- *"What changes if it is `http://`?"* Port 80, no TLS handshake — and usually a redirect to HTTPS.
- *"What changes with HTTP/3?"* QUIC over UDP 443; transport and TLS handshakes combined into 1 RTT.
- *"Where is NAT in this story?"* At the home router (and possibly CGNAT at the ISP), translating every packet.

## Key Takeaways

- Join: Wi-Fi association → DHCP (IP, mask, gateway, DNS) → ARP for the gateway.
- Request: URL parse + cache check → DNS → routing decision (gateway) → TCP handshake → TLS handshake → HTTP request.
- On the path: encapsulation, NAT at the edge, hop-by-hop routing with new frames, CDN/LB at the far end.
- Response: TCP reliability and congestion control, NAT back, render and fetch sub-resources over the same connection.
- Each step has a characteristic failure symptom.
