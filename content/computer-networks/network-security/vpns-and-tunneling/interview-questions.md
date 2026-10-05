# VPNs and Tunnelling — Interview Questions

## Beginner

### Q1. What is a VPN?

<details>
<summary>Answer</summary>

A Virtual Private Network creates an encrypted, authenticated tunnel over an untrusted network such as the Internet, so a remote device or site can use a private network's addresses and services as if it were directly connected. Packets are encapsulated and encrypted between the VPN endpoints.

</details>

### Q2. What is the difference between a site-to-site and a remote-access VPN?

**Style:** Comparison

<details>
<summary>Answer</summary>

A site-to-site VPN connects whole networks through gateways (branch office to head office, data centre to cloud VPC); hosts need no VPN software. A remote-access VPN connects an individual device, running a VPN client, to a network — e.g. an employee's laptop to the corporate network.

</details>

## Intermediate

### Q3. What is tunnelling?

<details>
<summary>Answer</summary>

Encapsulating one packet as the payload of another packet so it can cross a network that would not otherwise carry it. The outer header is addressed between the tunnel endpoints; the inner packet keeps its original (often private) addresses. VPNs add encryption and authentication; other tunnels (GRE, VXLAN, 6in4) may not encrypt.

</details>

### Q4. What is split tunnelling?

<details>
<summary>Answer</summary>

Only traffic for company ranges (e.g. routes for `10.0.0.0/8`) goes through the VPN; other traffic goes directly to the Internet. It reduces VPN gateway load and latency for public sites but gives less central visibility and control. A full tunnel sends all traffic through the VPN.

</details>

## Advanced

### Q5. After connecting to the corporate VPN, small pages load but large downloads and some HTTPS sites hang. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

Likely an MTU problem: VPN encapsulation adds headers, so full-size packets no longer fit the path MTU. If ICMP "fragmentation needed" messages are blocked, the senders never learn to use smaller packets (a PMTU black hole), so large transfers stall while small ones work. Fixes: lower the tunnel MTU, enable MSS clamping on the VPN gateway, and allow the relevant ICMP messages.

</details>

### Q6. Why are companies moving from VPNs to zero-trust network access?

**Style:** Why

<details>
<summary>Answer</summary>

A VPN typically grants network-level access to large internal ranges once connected, so a stolen credential or infected laptop can move laterally to many systems. Zero-trust access authenticates and authorizes every request per application, using user and device identity and context, exposes only specific apps, and does not depend on network location — reducing blast radius and fitting cloud and remote work.

</details>
