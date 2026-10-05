# IP Addresses vs MAC Addresses — Interview Questions

## Beginner

### Q1. What is the difference between an IP address and a MAC address?

**Style:** Comparison

<details>
<summary>Answer</summary>

A MAC address is a 48-bit, flat Layer 2 address of a network interface, used to deliver frames on the local link; it changes at every hop. An IP address is a hierarchical Layer 3 address (32-bit IPv4 / 128-bit IPv6) assigned by the network, used to route packets end to end; it stays the same from source to destination (unless NAT rewrites it).

</details>

### Q2. Why do we need both?

**Style:** Why

<details>
<summary>Answer</summary>

IP addresses are hierarchical, so routers can summarise whole networks in one route and find paths across the Internet — impossible with flat MACs. But link hardware (Ethernet, Wi-Fi) delivers frames by MAC, so on each link the packet must be addressed to the specific next device. IP = which host overall; MAC = which device on this wire. Separating them also lets IP run over any link technology.

</details>

## Intermediate

### Q3. When your PC sends a packet to google.com, whose MAC address is the destination MAC of the frame?

**Style:** What happens internally

<details>
<summary>Answer</summary>

The default gateway's (router's) MAC. The destination IP is Google's server, but the frame only needs to reach the next hop. The PC finds the gateway's MAC with ARP. Google's server's MAC is never visible outside its own LAN.

</details>

### Q4. Which addresses change as a packet crosses three routers without NAT?

**Style:** Output/prediction

<details>
<summary>Answer</summary>

On each of the four links the source and destination MACs are different (each router's outgoing MAC → next hop's MAC). The source and destination IPs stay the same; the TTL decreases by one per router.

</details>

## Advanced

### Q5. A laptop moves from home Wi-Fi to office Wi-Fi. What happens to its MAC and IP addresses, and why is that the right design?

**Style:** Scenario

<details>
<summary>Answer</summary>

The IP changes — the office DHCP server gives an address from the office subnet, because IP addresses encode location so routing works. The MAC stays the same hardware address (unless the OS uses per-network randomised MACs for privacy). Identity on the link (MAC) and location in the network (IP) are separate concerns, so a device can move between networks.

</details>
