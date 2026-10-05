# From Wi-Fi to Web Page — Practice

### P1. First network protocol

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** order of protocols

A laptop has just joined Wi-Fi and has no IP address. Which protocol does it use first to communicate at the IP level?

- A) DNS
- B) DHCP
- C) TCP
- D) TLS

<details>
<summary>Answer</summary>

**Answer:** B) DHCP

</details>

### P2. Order the journey

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** URL journey order

Order: (a) TLS handshake, (b) DHCP, (c) HTTP GET, (d) DNS lookup, (e) ARP for the gateway, (f) TCP handshake, (g) browser renders HTML.

<details>
<summary>Answer</summary>

(b) → (e) → (d) → (f) → (a) → (c) → (g).

</details>

### P3. Identify the step that failed

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** failure symptoms

Which step failed? (a) Browser: "This site can't be reached — server IP address could not be found". (b) Browser: "Your connection is not private — NET::ERR_CERT_DATE_INVALID". (c) Page shows "502 Bad Gateway". (d) Laptop shows IP `169.254.10.4`.

<details>
<summary>Answer</summary>

(a) DNS resolution. (b) TLS certificate validation (expired certificate or wrong system clock). (c) Behind the CDN/load balancer: the backend failed to give a valid response. (d) DHCP.

</details>

### P4. Headers on the first frame

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** addresses in the first segment

Laptop `192.168.1.23` (MAC `L`), router `192.168.1.1` (MAC `R`, public IP `198.51.100.7`), server `203.0.113.10`. For the SYN, give: src/dst MAC on the Wi-Fi link; src/dst IP before and after the router; destination port.

<details>
<summary>Answer</summary>

Wi-Fi frame: src MAC `L`, dst MAC `R`. IP before the router: `192.168.1.23 → 203.0.113.10`; after NAT: `198.51.100.7 → 203.0.113.10` (source port also translated). Destination port: **443**.

</details>

### P5. Round trips

**Difficulty:** Hard · **Type:** Calculation · **Concepts:** handshake costs

RTT to the CDN edge is 30 ms; DNS is cached; TLS 1.3; the edge has the page cached and responds instantly. How long until the first byte of HTML? What if the user's browser already has an open HTTP/2 connection to the site?

<details>
<summary>Answer</summary>

New connection: TCP 30 + TLS 30 + request/response 30 = **90 ms**. Existing connection: just the request/response, **30 ms**.

</details>
