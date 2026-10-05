# ARP — Interview Questions

## Beginner

### Q1. What is ARP and why is it needed?

<details>
<summary>Answer</summary>

The Address Resolution Protocol maps an IPv4 address to a MAC address on the local network. It is needed because a host knows the next hop's IP address, but Ethernet/Wi-Fi delivers frames by MAC address, so the sender must find the MAC to put in the frame header.

</details>

### Q2. Explain the ARP request and reply.

<details>
<summary>Answer</summary>

The sender broadcasts an ARP request (destination MAC `ff:ff:ff:ff:ff:ff`): "Who has 192.168.1.20? Tell 192.168.1.10", including its own IP and MAC. Every host on the LAN receives it; only the owner of `192.168.1.20` answers with a unicast ARP reply containing its MAC. The sender stores the mapping in its ARP cache; the target also caches the sender's mapping from the request.

</details>

## Intermediate

### Q3. Your PC wants to reach `8.8.8.8`. For which IP does it send an ARP request?

**Style:** What happens internally

<details>
<summary>Answer</summary>

For its default gateway's IP (e.g. `192.168.1.1`), not for `8.8.8.8`. The subnet mask shows `8.8.8.8` is not local, so the next hop is the gateway; the frame is addressed to the gateway's MAC while the IP packet keeps destination `8.8.8.8`.

</details>

### Q4. What is gratuitous ARP? Give two uses.

<details>
<summary>Answer</summary>

An unsolicited ARP announcing the sender's own IP-to-MAC mapping (target IP = own IP). Uses: detecting duplicate IP addresses when an interface comes up, and updating other hosts' ARP caches after a failover moves a virtual IP to a different machine (VRRP, keepalived), so traffic switches immediately.

</details>

### Q5. ARP vs DNS?

**Style:** Comparison

<details>
<summary>Answer</summary>

DNS translates names to IP addresses, globally, using a hierarchy of servers over UDP/TCP 53. ARP translates IPv4 addresses to MAC addresses, only on the local link, by broadcasting to everyone on the LAN. A web request typically uses DNS first (name → server IP), then ARP (gateway IP → gateway MAC).

</details>

## Advanced

### Q6. What is ARP spoofing and how do you defend against it?

**Style:** Scenario

<details>
<summary>Answer</summary>

ARP has no authentication, so an attacker on the LAN can send forged ARP replies such as "192.168.1.1 is at the attacker's MAC". Victims update their caches and send gateway-bound traffic to the attacker, who can read, modify or drop it (man-in-the-middle). Defences: Dynamic ARP Inspection with DHCP snooping on managed switches, static ARP entries for critical hosts, port security, network segmentation — and end-to-end encryption (TLS/HTTPS, SSH) so intercepted traffic cannot be read or altered undetected.

</details>

### Q7. Does IPv6 use ARP?

**Style:** Follow-up

<details>
<summary>Answer</summary>

No. IPv6 uses Neighbor Discovery Protocol (NDP), part of ICMPv6: a Neighbor Solicitation is sent to the target's solicited-node multicast address (not a broadcast), and the target answers with a Neighbor Advertisement. NDP also handles router discovery and duplicate address detection.

</details>
