# Troubleshooting Connectivity Problems — Interview Questions

## Intermediate

### Q1. You can ping an IP address but not a domain name. Why, and what do you do?

**Style:** Debugging

<details>
<summary>Answer</summary>

Pinging by IP proves physical, data link and network connectivity, so the failure is name resolution. Check the configured DNS servers (`ipconfig /all`, `/etc/resolv.conf`), test with `nslookup name` and then `nslookup name 1.1.1.1`; if a public resolver works, the configured resolver is wrong, down or blocked (port 53). Also check the hosts file and flush the DNS cache.

</details>

### Q2. A PC can reach everything on its own subnet but nothing outside. What is the most likely cause?

**Style:** Debugging

<details>
<summary>Answer</summary>

A wrong or missing default gateway (or the gateway router's interface/uplink is down). Same-subnet traffic is delivered directly with ARP and never uses the gateway, so it keeps working. Verify with `ipconfig`/`ip route`, ping the gateway, check the ARP entry for it, then correct the setting (usually in the DHCP scope).

</details>

### Q3. How do you tell whether high latency is caused by the network or the server?

**Style:** How

<details>
<summary>Answer</summary>

Measure the phases: `curl -w` shows connect and TLS times (network RTT) separately from time to first byte (server processing). Ping and traceroute/mtr show network RTT per hop. If connect time is low but TTFB is high, the server is slow; if ping and connect times are high, find the hop where latency jumps (local Wi-Fi, uplink, distance).

</details>

## Advanced

### Q4. Users report intermittent slowness and dropped video calls. `mtr` shows 15 % loss starting at your office router's WAN hop and continuing to every later hop. What do you conclude and do?

**Style:** Scenario

<details>
<summary>Answer</summary>

Loss that starts at a hop and persists to the destination is real loss at that point — the office uplink. Causes: a saturated link (check bandwidth graphs; heavy backups or downloads), a faulty WAN port/cable/modem (interface error counters), or an ISP problem. Relieve congestion with QoS/traffic shaping, fix hardware, or escalate to the ISP with the mtr evidence.

</details>

### Q5. A host is configured with mask /16 instead of /24. Describe which destinations fail and why.

**Style:** What happens internally

<details>
<summary>Answer</summary>

Destinations in its real /24 work. Destinations outside its real /24 but inside the /16 are wrongly considered local: the host ARPs for them directly, nobody on the LAN answers, and connections fail ("destination host unreachable"). Destinations outside the /16 still go to the gateway and work. So "some internal subnets are unreachable while the Internet works" is the signature.

</details>
