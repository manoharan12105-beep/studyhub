# Connectivity and DNS — Interview Questions

## Beginner

### Q1. How do you check whether a remote host is reachable?

<details>
<summary>Answer</summary>

`ping -c 4 host` sends ICMP echo requests and shows replies, round-trip times and packet loss. If ICMP is blocked, test the actual service port instead (`nc -zv host 443`, `curl -I https://host`).

</details>

### Q2. What does `traceroute` show?

<details>
<summary>Answer</summary>

The sequence of routers (hops) between you and the destination, with the round-trip time to each. It works by sending probes with increasing TTL values; each router that drops a probe at TTL 0 reports back. It helps locate where packets are lost or delayed.

</details>

### Q3. How do you look up the IP address of a domain?

<details>
<summary>Answer</summary>

`dig +short example.com`, `nslookup example.com` or `host example.com`. To see what applications on the machine will use (including `/etc/hosts`), `getent hosts example.com`.

</details>

### Q4. What is the difference between `dig` and `nslookup`?

<details>
<summary>Answer</summary>

Both query DNS servers. `dig` shows the complete response — status code, flags, sections, TTLs, the responding server, query time — and has script-friendly output (`+short`). `nslookup` gives a simpler summary and is also available on Windows. Neither consults `/etc/hosts`.

</details>

## Intermediate

### Q5. `ping google.com` works, but the browser cannot open a website on your server. What could be wrong?

<details>
<summary>Answer</summary>

Basic connectivity and DNS work, so look higher: is the web service running and listening (`ss -ltnp`), on the right address (not only `127.0.0.1`) and port; is a firewall or cloud security group blocking 80/443; is the site's DNS record pointing to the right IP; does `curl -v http://server/` return an error (TLS, 502 from a proxy, application error)? Check the service logs.

</details>

### Q6. `ping server01` says "Name or service not known", but `ping 10.0.0.15` works. What is the problem and how do you investigate?

<details>
<summary>Answer</summary>

Name resolution is failing; the network itself is fine. Check `getent hosts server01`, `/etc/hosts`, `/etc/resolv.conf` (DNS servers and `search` domains — maybe the full name `server01.corp.example.com` is needed), and query the DNS server directly with `dig server01.corp.example.com @dns-ip`.

</details>

### Q7. What do `NXDOMAIN` and `SERVFAIL` mean in `dig` output?

<details>
<summary>Answer</summary>

`NXDOMAIN`: the domain name does not exist (authoritative "no such name") — often a typo or a missing record. `SERVFAIL`: the resolver could not obtain an answer — upstream servers unreachable, misconfigured delegation, or DNSSEC validation failure.

</details>

### Q8. Why might DNS changes not be visible immediately?

<details>
<summary>Answer</summary>

Resolvers, operating systems, browsers and applications cache answers for the record's TTL. Until the cached entry expires, clients keep the old address. Check the TTL with `dig`, compare answers from different resolvers (`dig @8.8.8.8`), and lower TTLs in advance of planned changes. Some applications (e.g. the JVM with certain settings) cache longer.

</details>

### Q9. In traceroute output, several middle hops show `* * *` but the destination answers. Is there a problem?

<details>
<summary>Answer</summary>

Usually not. Those routers simply do not send "time exceeded" replies (rate limiting or policy), but they forward traffic. Problems are indicated when stars continue to the end and the destination never answers, or when latency jumps at one hop and stays high for all later hops.

</details>

## Advanced

### Q10. `dig app.internal` returns the correct IP, but the application still connects to an old IP. Why?

<details>
<summary>Answer</summary>

`dig` bypasses the system resolver. The application may be using an `/etc/hosts` override, a different `nsswitch` order, a local caching daemon (systemd-resolved, nscd) with stale data, or its own DNS cache (the JVM caches lookups per `networkaddress.cache.ttl`; connection pools keep existing connections). Check with `getent hosts app.internal`, flush caches (`resolvectl flush-caches`), and restart or reconfigure the application.

</details>

### Q11. How would you troubleshoot intermittent packet loss to a remote service?

<details>
<summary>Answer</summary>

Run `mtr -rwc 100 host` (or long `ping` with timestamps) to measure loss and latency per hop over time; loss that starts at one hop and persists to the destination locates the problem, while loss only at an intermediate hop is usually ICMP rate limiting. Correlate with interface errors (`ip -s link`), local saturation, and the provider. Test with TCP-based probes too, since ICMP may be deprioritised.

</details>
