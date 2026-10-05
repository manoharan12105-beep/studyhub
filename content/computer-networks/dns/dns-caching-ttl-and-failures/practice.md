# DNS Caching, TTL and Failures — Practice

### P1. TTL meaning

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** TTL

A record has TTL 3600. What does that mean?

- A) The domain expires in 3,600 days
- B) Caches may reuse the answer for up to 1 hour
- C) The server answers within 3,600 ms
- D) The record changes every hour

<details>
<summary>Answer</summary>

**Answer:** B) Caches may reuse the answer for up to 1 hour

</details>

### P2. Worst-case wait

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** propagation

A record with TTL 86,400 s is changed at 10:00. A resolver cached it at 09:30. Until when can its users get the old answer?

<details>
<summary>Answer</summary>

Until 09:30 + 24 h = **09:30 the next day**.

</details>

### P3. Diagnose

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** DNS failure

`ping 1.1.1.1` works. `nslookup example.com` → "DNS request timed out". `nslookup example.com 8.8.8.8` works. What is the problem and the fix?

<details>
<summary>Answer</summary>

The configured resolver is unreachable or not responding (wrong DNS server from DHCP, the router's DNS proxy down, or UDP 53 to it blocked). Fix the DNS server setting (DHCP option / network settings) or restart the router's DNS service; as a temporary workaround, use a public resolver.

</details>

### P4. One machine is wrong

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** hosts file

On one developer laptop `api.staging.example.com` resolves to `10.0.0.99`, everywhere else to `203.0.113.40`. `nslookup` on that laptop shows `203.0.113.40`, but the browser and `curl` go to `10.0.0.99`. Explain.

<details>
<summary>Answer</summary>

A hosts-file entry overrides DNS for normal application lookups, but `nslookup` queries the DNS server directly and ignores the hosts file. Remove the stale entry from `/etc/hosts` or `C:\Windows\System32\drivers\etc\hosts` (and flush the OS DNS cache).

</details>

### P5. Migration plan

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** TTL planning

The current TTL of `shop.example.com` is 1 day. The move to new servers is on Saturday 02:00, and you want clients to switch within 5 minutes. What do you do and when?

<details>
<summary>Answer</summary>

Lower the TTL to 300 s **at least one day before** Saturday 02:00 (e.g. Thursday night), so that by Saturday every cache holds a copy with the short TTL. At 02:00 change the A/CNAME record; within ~5 minutes clients move. Keep the old servers up for a while, then raise the TTL again.

</details>
