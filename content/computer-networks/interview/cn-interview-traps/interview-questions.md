# Computer Networks Interview Traps — Interview Questions

## Beginner

### Q1. "A switch breaks up broadcast domains." True?

**Style:** Trap

<details>
<summary>Answer</summary>

False. A switch breaks up **collision** domains (one per port). Broadcast frames are flooded to every port in the same VLAN, so all ports share one broadcast domain. Routers (per interface) and VLANs break up broadcast domains.

</details>

### Q2. "To reach google.com, my PC needs Google's server's MAC address." True?

**Style:** Trap

<details>
<summary>Answer</summary>

False. The PC needs only its **default gateway's** MAC (found by ARP). The packet carries Google's IP; the MAC addresses change on every link and the server's MAC is never visible outside its own LAN.

</details>

### Q3. "HTTP is stateful because websites remember my login." True?

**Style:** Trap

<details>
<summary>Answer</summary>

False. HTTP is stateless; each request is independent. Login state is layered on top with cookies (session IDs) or tokens that the client sends with every request.

</details>

### Q4. "401 means the user is not allowed to access the resource." True?

**Style:** Trap

<details>
<summary>Answer</summary>

Imprecise. 401 means **not authenticated** (missing/invalid credentials). An authenticated user without permission gets **403**.

</details>

### Q5. "Ping failed, so the server is down." True?

**Style:** Trap

<details>
<summary>Answer</summary>

Not necessarily. Many servers and cloud security groups block ICMP. Test the actual service: `curl -v`, `nc -zv host 443`. Conversely, a successful ping does not prove the application works.

</details>

## Intermediate

### Q6. "More bandwidth reduces latency." True?

**Style:** Trap

<details>
<summary>Answer</summary>

Only the transmission part. Propagation delay depends on distance, and queuing/processing delays remain. A request across continents still has 200+ ms RTT on any bandwidth; latency-bound workloads improve by fewer round trips and shorter distances.

</details>

### Q7. "UDP is unreliable, so it is never used for important traffic." True?

**Style:** Trap

<details>
<summary>Answer</summary>

False. DNS, DHCP and real-time media use UDP deliberately, and HTTP/3 runs on QUIC over UDP with full reliability, congestion control and encryption implemented on top. UDP is a minimal base, not a weakness.

</details>

### Q8. "TCP sequence numbers count segments." True?

**Style:** Trap

<details>
<summary>Answer</summary>

False. They count **bytes**. ACK = the next byte expected, cumulatively acknowledging everything before it.

</details>

### Q9. "TIME_WAIT happens on the server and should be disabled to save ports." True?

**Style:** Trap

<details>
<summary>Answer</summary>

False on both counts. TIME_WAIT is on whichever side **closes first** (often the client or a proxy). It protects correctness (re-ACKing a lost FIN, letting old segments expire). Reduce TIME_WAIT pressure by reusing connections (keep-alive, pools), not by disabling it.

</details>

### Q10. "Flow control and congestion control are the same." True?

**Style:** Trap

<details>
<summary>Answer</summary>

False. Flow control protects the **receiver** using the window it advertises (rwnd); congestion control protects the **network** using the sender's congestion window (cwnd) inferred from loss/delay. The sender uses min(rwnd, cwnd).

</details>

### Q11. "NAT is a firewall, so devices behind it are secure." True?

**Style:** Trap

<details>
<summary>Answer</summary>

False. NAT blocks unsolicited inbound connections only as a side effect of having no mapping; it has no security policy, does nothing for outbound traffic, and can be traversed (hole punching, UPnP). Use real firewalls; IPv6 networks rely on stateful firewalls without NAT.

</details>

### Q12. "DNS uses only UDP." True?

**Style:** Trap

<details>
<summary>Answer</summary>

False. It uses UDP 53 for normal queries, TCP 53 for large responses and zone transfers, and TLS/HTTPS for encrypted DNS (DoT 853, DoH 443).

</details>

### Q13. "Idempotent means the same response every time." True?

**Style:** Trap

<details>
<summary>Answer</summary>

False. It means the same **effect on server state**. A repeated DELETE returns 404 after the first 204 and is still idempotent.

</details>

## Advanced

### Q14. "HTTPS encrypts everything with the server's public key." True?

**Style:** Trap

<details>
<summary>Answer</summary>

False. The certificate's public key is used to verify the server's identity (it signs the handshake); ECDHE key exchange produces symmetric session keys, and AES-GCM/ChaCha20 encrypt the actual data.

</details>

### Q15. "HTTPS hides which website I visit." True?

**Style:** Trap

<details>
<summary>Answer</summary>

Mostly false. The path, query, headers and body are encrypted, but the server IP is visible, and the hostname usually leaks via DNS queries and the TLS SNI field (unless encrypted DNS and Encrypted Client Hello are used).

</details>

### Q16. "HTTP/2 eliminated head-of-line blocking." True?

**Style:** Trap

<details>
<summary>Answer</summary>

Only at the HTTP level. All streams share one TCP connection, so a lost TCP segment still stalls every stream until retransmitted. HTTP/3 over QUIC removes head-of-line blocking across streams.

</details>

### Q17. "The route with the best metric always wins." True?

**Style:** Trap

<details>
<summary>Answer</summary>

False. Longest prefix match comes first — a `/24` beats a `/16` regardless of metric. Administrative distance and metrics only decide between routes to the **same** prefix.

</details>

### Q18. "Changing a DNS record takes effect immediately — DNS propagation is a push." True?

**Style:** Trap

<details>
<summary>Answer</summary>

False. Resolvers and clients keep cached answers until their TTL expires; nothing is pushed. Lower the TTL in advance of planned changes.

</details>

### Q19. "A /24 has 256 usable hosts." True?

**Style:** Trap

<details>
<summary>Answer</summary>

False. It has 256 addresses but 254 usable hosts — the network address (all host bits 0) and the broadcast address (all host bits 1) are reserved.

</details>

### Q20. "`X-Forwarded-For` always tells you the real client IP." True?

**Style:** Trap

<details>
<summary>Answer</summary>

False. Any client can send its own `X-Forwarded-For`. Trust only the entries added by your own proxies/load balancers (configure trusted proxy addresses); otherwise attackers can spoof their IP in logs and rate limits.

</details>
