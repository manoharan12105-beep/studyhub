# Troubleshooting: Network Connectivity and DNS — Interview Questions

## Beginner

### Q1. A server cannot reach the internet. What do you check, in order?

<details>
<summary>Answer</summary>

Interface and IP (`ip -br addr`), default route (`ip route`), ping the gateway, ping a public IP (`ping 1.1.1.1`), then a name (`ping example.com` / `dig example.com`). The first step that fails points to the layer with the problem: local configuration, gateway/routing, upstream network, or DNS.

</details>

### Q2. Pinging an IP address works but pinging a hostname fails. What is the problem?

<details>
<summary>Answer</summary>

Name resolution (DNS). Check `/etc/resolv.conf` (or `resolvectl status`), `/etc/hosts`, and query with `dig name` to see whether the DNS server answers and with what status.

</details>

### Q3. How do you check whether a remote port is open?

<details>
<summary>Answer</summary>

`nc -zv host port`, `curl -v telnet://host:port` or `curl -v http://host:port/`, or without extra tools `timeout 3 bash -c '</dev/tcp/host/port'`. On the server itself, `ss -ltnp` shows whether something listens on it.

</details>

### Q4. Which file holds the DNS servers a Linux machine uses?

<details>
<summary>Answer</summary>

`/etc/resolv.conf` (`nameserver` lines). On systems with systemd-resolved it often points to `127.0.0.53`, a local stub; `resolvectl status` shows the real upstream servers. `/etc/hosts` holds static name–address mappings checked before DNS (order set in `/etc/nsswitch.conf`).

</details>

## Intermediate

### Q5. What is the difference between "Connection refused" and "Connection timed out"?

<details>
<summary>Answer</summary>

**Refused**: the target host replied with a TCP reset — it is reachable, but no process listens on that port (or a firewall rejects actively). **Timed out**: no reply arrived at all — packets are dropped by a firewall or security group, the host is down, or the address/route is wrong.

</details>

### Q6. A service works with `curl localhost:8080` on the server, but not from your laptop. Why?

<details>
<summary>Answer</summary>

Most often it listens only on `127.0.0.1` — `ss -ltnp` shows the local address. Otherwise the host firewall (`ufw`, `firewalld`, `nftables`) or a cloud security group blocks the port, or you are using an address not reachable from your network.

</details>

### Q7. `dig` returns `NXDOMAIN`. What does that mean and what do you do?

<details>
<summary>Answer</summary>

The DNS server answered authoritatively that the name does not exist. Check the spelling and the domain (search domain for short names), whether the record was created in the right zone, and whether you are asking the right server (internal names need internal DNS or the VPN). Compare `dig @<authoritative or public server> name`.

</details>

### Q8. Why might `getent hosts name` and `dig name` give different answers?

<details>
<summary>Answer</summary>

`getent` uses the system resolver as applications do: `/etc/hosts` first (per `/etc/nsswitch.conf`), then DNS, mDNS or other sources. `dig` queries a DNS server directly and ignores `/etc/hosts`. An old `/etc/hosts` entry therefore shows up in `getent` and applications but not in `dig`.

</details>

### Q9. After changing a DNS record, some clients still reach the old server. Why?

<details>
<summary>Answer</summary>

Caching: resolvers and clients keep the old answer until its TTL expires; applications (such as the JVM) may cache longer; a stale `/etc/hosts` entry overrides DNS. Wait for the TTL, flush caches (`resolvectl flush-caches`), and lower the TTL in advance of planned migrations.

</details>

## Advanced

### Q10. How do you troubleshoot intermittent connection timeouts between two services?

<details>
<summary>Answer</summary>

Measure when and where: test repeatedly (`curl -w '%{time_connect} %{time_total}\n'` in a loop), check whether failures correlate with load, a specific backend or DNS answer (round-robin to a dead IP), look at connection state counts (`ss -s`, many `SYN-SENT` or `TIME-WAIT`), packet loss (`mtr`), connection-tracking table exhaustion on firewalls/NAT, and server-side limits (accept backlog, max connections, thread pools). `tcpdump` on both ends shows whether packets leave and arrive.

</details>

### Q11. `ping` fails but `curl` to the same host works. How is that possible?

<details>
<summary>Answer</summary>

ICMP (used by ping) is commonly blocked by firewalls or cloud security groups while TCP ports are open. A failed ping alone does not mean the host is down — test the actual service port.

</details>

### Q12. What happens step by step when you run `curl https://api.example.com`, from a troubleshooting point of view?

<details>
<summary>Answer</summary>

1. Name resolution: `/etc/hosts`, then the DNS servers in `resolv.conf` → IP address (fails as "Could not resolve host").
2. Routing: the kernel picks an interface and gateway (`ip route get <ip>`) ("Network is unreachable").
3. TCP handshake to port 443 ("refused" or "timed out").
4. TLS handshake: certificate validity, hostname match, trusted CA ("SSL certificate problem").
5. HTTP request and response: status codes (`4xx`/`5xx`) and redirects.

Each step has its own error message, which tells you where to look; `curl -v` shows them all.

</details>
