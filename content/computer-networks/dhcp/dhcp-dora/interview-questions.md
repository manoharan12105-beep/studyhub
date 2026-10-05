# DHCP — Interview Questions

## Beginner

### Q1. What is DHCP and what information does it provide?

<details>
<summary>Answer</summary>

The Dynamic Host Configuration Protocol automatically configures hosts on an IP network. A DHCP server leases an IP address and provides the subnet mask, default gateway, DNS servers, lease time and other options (domain name, NTP servers). It runs over UDP 67 (server) and 68 (client).

</details>

### Q2. Explain the DORA process.

<details>
<summary>Answer</summary>

Discover: the client, with no IP, broadcasts from `0.0.0.0` to `255.255.255.255` looking for servers. Offer: a server proposes an address and configuration. Request: the client broadcasts that it accepts one specific offer (so other servers withdraw theirs). Acknowledge: the server confirms the lease and the client configures its interface.

</details>

## Intermediate

### Q3. Why are DHCP Discover and Request broadcast?

**Style:** Why

<details>
<summary>Answer</summary>

Discover: the client has no IP address and does not know any server's address, so broadcasting is the only way to reach a server. Request: broadcasting it informs all servers that made offers which one was accepted, so the others can return their offered addresses to their pools.

</details>

### Q4. What happens when a DHCP lease is about to expire?

<details>
<summary>Answer</summary>

At T1 (50 % of the lease) the client sends a unicast Request to its server to renew; an ACK extends the lease. If that fails, at T2 (87.5 %) it broadcasts a Request to any server (rebinding). If the lease expires without renewal, the client must stop using the address and restart DORA.

</details>

### Q5. What is the difference between DNS and DHCP?

**Style:** Comparison

<details>
<summary>Answer</summary>

DHCP configures the host itself — its IP, mask, gateway and which DNS servers to use — when it joins a network. DNS resolves other hosts' names to IP addresses whenever the host wants to connect to something by name. DHCP is local and starts with broadcasts; DNS is a global hierarchy queried by unicast.

</details>

## Advanced

### Q6. A new floor's PCs get 169.254.x.x addresses, but other floors work. The DHCP server is in the data centre. What do you check?

**Style:** Debugging

<details>
<summary>Answer</summary>

Clients are not receiving DHCP replies. Since broadcasts do not cross routers, the new floor's VLAN needs a DHCP relay (`ip helper-address`) on its gateway pointing to the server; then check the server has a scope/pool for that subnet (matching the relay's giaddr), that firewalls allow UDP 67/68 between relay and server, that the switch ports are in the right VLAN, and that DHCP snooping trusts the uplink.

</details>
