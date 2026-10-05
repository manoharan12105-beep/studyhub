# Public, Private and Special IP Addresses — Interview Questions

## Beginner

### Q1. What is the difference between a public and a private IP address?

**Style:** Comparison

<details>
<summary>Answer</summary>

A public IP is globally unique and routable on the Internet, assigned via ISPs and registries. A private IP comes from the RFC 1918 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), can be reused in any network, and is not routed on the Internet; private hosts reach the Internet through NAT, which maps them to a public address.

</details>

### Q2. What is `127.0.0.1`?

<details>
<summary>Answer</summary>

The loopback address (`localhost`). Traffic to it never leaves the machine; it is used to test the local TCP/IP stack and to reach services on the same host. The whole `127.0.0.0/8` block is reserved for loopback.

</details>

## Intermediate

### Q3. A Windows PC shows the address `169.254.33.10`. What does that mean?

**Style:** Debugging

<details>
<summary>Answer</summary>

It is an APIPA (link-local) address the PC assigned itself because it got no answer from a DHCP server. The physical link is probably up, but DHCP failed — the server is down, unreachable (wrong VLAN, relay missing), or the address pool is exhausted. The PC has no gateway, so there is no Internet access.

</details>

### Q4. What does `0.0.0.0` mean in different contexts?

<details>
<summary>Answer</summary>

As a source address: "this host, no address yet" (a DHCP Discover is sent from `0.0.0.0`). As a bind address for a server: listen on all local interfaces. In a routing table: `0.0.0.0/0` is the default route that matches every destination. It is never a valid destination host address.

</details>

### Q5. When would you use a static IP instead of DHCP?

<details>
<summary>Answer</summary>

For devices others must find at a fixed address: servers, routers/gateways, DNS servers, printers, network equipment. Clients use DHCP. A DHCP reservation is often the best of both: a fixed address per MAC, managed centrally.

</details>

## Advanced

### Q6. Your Spring Boot app in a Docker container cannot connect to PostgreSQL at `localhost:5432` on the host machine. Why?

**Style:** Scenario

<details>
<summary>Answer</summary>

Inside the container, `localhost` (`127.0.0.1`) is the container's own loopback, not the host's. Nothing listens on 5432 there, so the connection is refused. Use the host's reachable address (`host.docker.internal` on Docker Desktop, the bridge gateway such as `172.17.0.1` on Linux, or better, run PostgreSQL as a container on the same Docker network and use its service name). PostgreSQL must also listen on that interface, not only on `127.0.0.1`.

</details>
