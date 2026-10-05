# Network Types — Interview Questions

## Beginner

### Q1. Explain LAN, MAN and WAN with an example of each.

<details>
<summary>Answer</summary>

LAN: a network in one home, office or building (home Wi-Fi, an office Ethernet). MAN: a network across a city (a university's campuses linked by metro fibre). WAN: a network across countries or continents (a bank's branch network, the Internet). As scope grows, speed per cost falls, latency rises, and the links are leased from carriers instead of owned.

</details>

### Q2. What is the difference between the Internet, an intranet and an extranet?

**Style:** Comparison

<details>
<summary>Answer</summary>

They differ in who may access them. The Internet is public. An intranet is a private network for the organisation's members (internal portals and tools). An extranet extends part of the intranet to authorised outsiders such as suppliers. All three normally use the same TCP/IP and web technologies; access is restricted by firewalls, VPNs and authentication.

</details>

## Intermediate

### Q3. Is the Internet a WAN?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Yes — the largest one, made of many interconnected networks. But not every WAN is the Internet: companies lease private WAN circuits (MPLS, dedicated lines) that carry only their own traffic.

</details>

### Q4. Why is a LAN usually faster and lower latency than a WAN?

**Style:** Why

<details>
<summary>Answer</summary>

Short distances (signal travel time is tiny), few hops, cheap high-capacity Ethernet/Wi-Fi equipment owned by you, and no sharing with other customers. A WAN spans long distances (propagation delay alone is about 5 ms per 1,000 km of fibre), crosses many routers and uses leased capacity that is expensive per Mbit/s.

</details>

## Advanced

### Q5. How does a remote employee use an intranet application securely?

**Style:** Scenario

<details>
<summary>Answer</summary>

Through a VPN (or a zero-trust access proxy): the laptop authenticates, an encrypted tunnel is built across the Internet to the company's VPN gateway, and the laptop receives an address on, or a route into, the internal network. Internal DNS names then resolve and firewall rules allow the traffic. The application should still authenticate users itself — being "inside the network" should not be treated as proof of identity.

</details>
