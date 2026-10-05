# Traps and Misconceptions

Each line: the tempting wrong belief → the precise truth.

## Devices and Layers

- "Switches split broadcast domains" → they split **collision** domains; routers/VLANs split broadcast domains.
- "A hub sends the frame to the destination" → it sends it to **every** port.
- "Routers forward by MAC" → by **IP**; MACs only get the frame to the next hop.
- "Routers change the destination IP to the next router" → they change the destination **MAC**.
- "Every layer adds a trailer" → only the **Data Link** layer (FCS).
- "The Internet uses the OSI model" → it uses **TCP/IP**; OSI is a reference model.
- "The browser is a Layer 7 device" → it uses Layer 7 **protocols**.

## Addressing

- "My PC needs the remote server's MAC" → it needs the **default gateway's** MAC.
- "A /24 has 256 hosts" → **254** usable.
- "/24 means 24 hosts" → 24 **network** bits.
- "Larger prefix = larger network" → **smaller** network.
- "172.0.0.0/8 is private" → only **172.16.0.0–172.31.255.255** (/12).
- "169.254.x.x means no cable" → link works, **DHCP failed**.
- "127.0.0.1 tests the network card" → tests only the **software stack**.
- "x.x.x.0 and x.x.x.255 are always invalid" → inside a /23 or /22 they can be **ordinary hosts**.
- "IPv6 has broadcast" → **no**; multicast replaces it.

## Routing and ICMP

- "Best metric wins" → **longest prefix** wins first.
- "TTL is seconds" → a **hop count**.
- "Ping failed → server down" → ICMP may be **blocked**; test the port.
- "`* * *` in traceroute = packet loss there" → that hop just **doesn't reply**; check later hops.
- "Block all ICMP for safety" → breaks **PMTUD** and IPv6 neighbour discovery.

## Transport

- "TCP sequence numbers count segments" → they count **bytes**.
- "TCP makes the Internet circuit-switched" → connection state exists only in the **end hosts**.
- "UDP has no error checking" → it has a **checksum**; it just doesn't retransmit.
- "UDP is always faster" → it avoids handshakes and stalls but has the **same bandwidth**.
- "TIME_WAIT is on the server" → on the side that **closes first**.
- "Disable TIME_WAIT" → **reuse connections** instead.
- "CLOSE_WAIT times out" → it lasts until the **app closes** the socket.
- "Flow control = congestion control" → **receiver** vs **network**.
- "A server can only handle 65,535 connections" → server connections share **one port**; limits are resources.

## Application

- "HTTP is stateful" → stateless; **cookies/tokens** add state.
- "Idempotent = same response" → same **server state**.
- "PATCH is idempotent like PUT" → **not guaranteed**.
- "401 = forbidden" → 401 = **unauthenticated**; 403 = forbidden.
- "404 = server down" → server **answered**: no such resource.
- "302 keeps POST" → use **307/308** to keep the method.
- "no-cache = don't cache" → **revalidate** before use; `no-store` = don't store.
- "Basic auth is encrypted" → **Base64 encoding**; needs HTTPS.
- "HTTP/2 removed head-of-line blocking" → only at the HTTP level; **TCP** HOL remains (HTTP/3 fixes).
- "HTTP/3 is unreliable (UDP)" → **QUIC** provides reliability.

## Security and TLS

- "HTTPS encrypts data with the server's public key" → **symmetric session keys** from ECDHE.
- "Padlock = trustworthy site" → only proves the **domain**; phishing sites have certificates.
- "HTTPS hides the site I visit" → hostname leaks via **DNS and SNI**.
- "Certificates contain the private key" → **public** key only.
- "NAT is a firewall" → side effect only; use **firewalls**.
- "Inside the VPN = trusted" → **zero trust**: authenticate every request.
- "Authentication = authorization" → **who** vs **what**.

## DNS, DHCP and Performance

- "DNS uses only UDP" → also **TCP** (large answers, zone transfers), DoT, DoH.
- "DNS changes propagate (pushed)" → caches **expire by TTL**.
- "CNAME can point to an IP / sit at the apex" → **name only**, **not at the apex**.
- "MX lower number = less preferred" → lower = **more** preferred.
- "DHCP Request is unicast" → initial Request is **broadcast**.
- "More bandwidth fixes slow APIs" → usually **round trips** dominate.
- "Bigger connection pool = faster DB" → past a point, **slower**.
- "`X-Forwarded-For` is trustworthy" → only from **your own proxies**.
- "Backend sees the client IP" → behind a LB it sees the **LB's** IP.
