# Unicast, Broadcast, Multicast and Anycast — Interview Questions

## Beginner

### Q1. Explain unicast, broadcast and multicast.

<details>
<summary>Answer</summary>

Unicast: one sender to one receiver (normal web traffic). Broadcast: one sender to every device in the local broadcast domain (ARP requests, DHCP Discover). Multicast: one sender to all hosts that joined a group address, with the network copying packets only where members are (IPTV, OSPF).

</details>

### Q2. What is anycast? Give a real example.

<details>
<summary>Answer</summary>

The same IP address is announced from many locations and routing delivers each packet to the nearest one. Public DNS resolvers such as `1.1.1.1` and `8.8.8.8`, the DNS root servers and CDNs use anycast to answer from a site close to the user and to spread attack traffic.

</details>

## Intermediate

### Q3. Why don't routers forward broadcasts?

**Style:** Why

<details>
<summary>Answer</summary>

If they did, every broadcast (every ARP request, every DHCP Discover) would flood the entire Internet and overwhelm it. Stopping broadcasts at routers confines them to one broadcast domain; that is a key reason large networks are split into subnets or VLANs.

</details>

### Q4. Why do ARP and DHCP Discover use broadcast?

**Style:** Why

<details>
<summary>Answer</summary>

In both cases the sender does not know whom to address. ARP knows the target IP but not its MAC, so it asks every device on the link. A DHCP client has no IP address and does not know the server's address, so it broadcasts Discover to `255.255.255.255` from `0.0.0.0`.

</details>

### Q5. Does IPv6 have broadcast?

**Style:** Follow-up

<details>
<summary>Answer</summary>

No. IPv6 replaces broadcast with multicast — e.g. neighbour discovery sends to a solicited-node multicast address so that only hosts whose address ends with the same bits process it, instead of every host.

</details>

## Advanced

### Q6. Multicast vs anycast — what is the difference?

**Style:** Comparison

<details>
<summary>Answer</summary>

Multicast delivers one packet to *all* members of a group (one-to-many). Anycast delivers a packet to *one* of many servers sharing an address — the nearest by routing (one-to-nearest). Multicast needs group membership (IGMP/MLD) and multicast routing; anycast needs only normal routing announcements (BGP) and looks like unicast to the sender.

</details>
