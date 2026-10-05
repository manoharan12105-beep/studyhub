# A Packet's Journey — Interview Questions

## Intermediate

### Q1. Describe what happens when a host sends data to another host on the same LAN.

**Style:** What happens internally

<details>
<summary>Answer</summary>

The host sees from its subnet mask that the destination is local, resolves the destination's MAC with ARP (broadcast request, unicast reply — the switch learns both ports), then sends the frame with the destination's MAC. The switch looks up the destination MAC in its table and forwards the frame, unchanged, out of one port. The receiving NIC checks the MAC and FCS, IP checks the address, and TCP/UDP hands the data to the right socket. No router is involved and TTL is unchanged.

</details>

### Q2. Which header fields change as a packet goes from a home laptop to a web server on the Internet?

**Style:** Output/prediction

<details>
<summary>Answer</summary>

On every link, the source and destination MAC addresses (and the FCS). At every router, the TTL (and IPv4 header checksum). At the home router's NAT, the source IP (private → public) and source port; the reply's destination IP and port are translated back. The destination IP and port stay the same end to end (unless a load balancer or destination NAT is involved).

</details>

## Advanced

### Q3. Your server logs show all requests coming from one IP, but you know they are from many users. Give two possible reasons.

**Style:** Scenario

<details>
<summary>Answer</summary>

(1) The users are behind the same NAT — an office, a mobile carrier's CGNAT — so they share one public IP. (2) The server sits behind a reverse proxy or load balancer, which opens its own connections, so the TCP peer is always the proxy; the real client IPs are in `X-Forwarded-For` / `Forwarded`, which the application must be configured to read (from trusted proxies only).

</details>

### Q4. How does a reply packet reach the correct laptop when 20 devices share one public IP?

**Style:** What happens internally

<details>
<summary>Answer</summary>

When each outbound connection passed the NAT router, it rewrote the source to the public IP and a unique public port and stored the mapping (private IP:port ↔ public port, plus the remote endpoint). Replies arrive addressed to the public IP and that unique port; the router looks up the port, rewrites the destination back to the private IP:port, and delivers the frame to that device's MAC.

</details>
