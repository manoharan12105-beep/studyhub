# From Wi-Fi to Web Page — Interview Questions

## Intermediate

### Q1. What happens when you type `https://www.example.com` into a browser and press Enter?

**Style:** What happens internally

<details>
<summary>Answer</summary>

1. The browser parses the URL (HTTPS → port 443) and checks HSTS and its cache.
2. DNS: browser, OS and resolver caches; otherwise the resolver queries root → `.com` → the authoritative server and returns the IP.
3. The OS sees the IP is not local, so it sends packets to the default gateway (ARP gives the gateway's MAC).
4. TCP three-way handshake to port 443 from an ephemeral port; the home router NATs the source address; routers forward hop by hop.
5. TLS handshake: ClientHello with SNI/ALPN, server certificate and signature, key exchange → session keys; the browser validates the certificate.
6. The encrypted HTTP request (`GET /`) reaches a CDN/load balancer, which serves from cache or forwards to an application server (which may query databases).
7. The response returns (TCP handles loss and congestion); the browser parses HTML, fetches CSS/JS/images (often on the same connection), runs JavaScript and renders.

</details>

### Q2. Before the browser can even send a DNS query, what has to have happened on the network?

<details>
<summary>Answer</summary>

The device must have a link (Wi-Fi association/authentication or Ethernet), an IP configuration from DHCP (address, mask, default gateway, DNS server addresses), and — if the DNS server is the router or outside the subnet — the MAC of the next hop resolved with ARP so the frame carrying the DNS query can be addressed.

</details>

### Q3. Which steps of the URL journey can be skipped by caching?

**Style:** Follow-up

<details>
<summary>Answer</summary>

The browser HTTP cache can skip the whole network exchange (fresh copy) or reduce it to a revalidation (304). DNS caches (browser, OS, resolver) skip resolution. Connection reuse (keep-alive, HTTP/2) skips TCP and TLS handshakes; TLS session resumption shortens new handshakes. CDN caches skip the trip to the origin and the server-side work.

</details>

## Advanced

### Q4. The page loads, but it takes 3 seconds before anything appears. How do you find which step is slow?

**Style:** Debugging

<details>
<summary>Answer</summary>

Use the browser's Network tab timing for the document request: DNS lookup, initial connection (TCP), SSL (TLS), waiting/TTFB (server processing) and content download, then the waterfall for render-blocking CSS/JS. Large DNS time → resolver issues; large connect/SSL → distance or network loss (consider a CDN, HTTP/3); large TTFB → backend (trace the server); many sequential sub-resource requests → reduce/blocking resources. `curl -w` gives the same breakdown from servers in different locations.

</details>

### Q5. How does the journey differ for HTTP/3?

**Style:** Comparison

<details>
<summary>Answer</summary>

After DNS (which may also advertise HTTP/3 support via HTTPS records, or the browser learns it from an earlier `Alt-Svc` header), the browser uses QUIC over UDP 443 instead of TCP: the transport and TLS 1.3 handshakes are combined into one round trip (zero on resumption), streams are independent so a lost packet does not stall other resources, and the connection can survive a network change. NAT and routing work the same way, but on UDP.

</details>
