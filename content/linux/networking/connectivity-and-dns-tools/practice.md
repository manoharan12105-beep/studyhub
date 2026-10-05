# Connectivity and DNS — Practice

### P1. Limited ping

**Difficulty:** Easy · **Type:** Command · **Concepts:** ping -c

Send exactly four pings to `example.com` and stop.

<details>
<summary>Answer</summary>

```bash
# Illustrative: needs network access
ping -c 4 example.com
```

Without `-c`, Linux `ping` runs until you press `Ctrl+C`.

</details>

### P2. Read the error

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** ping error messages

`ping api.internal` prints `ping: api.internal: Name or service not known`. Which layer failed?

- A) The network cable
- B) Name resolution (DNS or /etc/hosts)
- C) The application on api.internal
- D) The firewall on port 443

<details>
<summary>Answer</summary>

**Answer:** B) Name resolution (DNS or /etc/hosts)

**Explanation:** ping never sent a packet — it could not turn the name into an IP address.

</details>

### P3. Only the address

**Difficulty:** Easy · **Type:** Command · **Concepts:** dig +short

Print only the IPv4 addresses for `example.com`, then only its mail servers.

<details>
<summary>Answer</summary>

```bash
# Illustrative: needs dnsutils and network access
dig +short example.com A
dig +short example.com MX
```

</details>

### P4. Ask another server

**Difficulty:** Medium · **Type:** Command · **Concepts:** dig @server

Your company's DNS returns an old IP for `shop.example.com`. Compare with what Google's public resolver returns.

<details>
<summary>Answer</summary>

```bash
# Illustrative
dig +short shop.example.com
dig +short @8.8.8.8 shop.example.com
```

If they differ, your internal resolver has a stale cached answer or a different (split-horizon) zone.

</details>

### P5. ping fails, service works

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** ICMP filtering

`ping web.example.com` shows 100 % packet loss, yet `curl -I https://web.example.com` returns `HTTP/2 200`. Explain.

<details>
<summary>Answer</summary>

The host is up and serving HTTPS; ICMP echo is simply blocked by a firewall or security group (common on cloud servers). Ping failure alone does not prove a host is down — test the real service port.

</details>

### P6. What applications see

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** getent vs dig

On a server, `dig +short api.partner.com` returns `203.0.113.10`, but the application logs show connections to `10.0.0.99`. Which command shows the address the application actually resolves, and what file would you check first?

<details>
<summary>Answer</summary>

`getent hosts api.partner.com` uses the system resolver like the application. Check `/etc/hosts` first — an old override (`10.0.0.99 api.partner.com`) wins over DNS with the usual `hosts: files dns` order.

</details>

### P7. Read a traceroute

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** traceroute interpretation

```text
 1  10.0.0.1      0.5 ms
 2  100.64.0.1    3.1 ms
 3  * * *
 4  198.51.100.9  4.0 ms
 5  203.0.113.5  180.2 ms
 6  203.0.113.77 181.5 ms
 7  192.0.2.10   182.0 ms
```

Users report the service at `192.0.2.10` is slow. What does this trace suggest?

<details>
<summary>Answer</summary>

Hop 3 not answering is harmless (later hops reply). Latency jumps from about 4 ms to about 180 ms between hops 4 and 5 and stays high to the destination, so the slow segment is the link into hop 5 (possibly a long-distance or congested link). Confirm with `mtr` over time before contacting the provider.

</details>
