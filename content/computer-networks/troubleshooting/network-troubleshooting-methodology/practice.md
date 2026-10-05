# Network Troubleshooting Methodology — Practice

### P1. Strategy choice

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** troubleshooting strategies

Email works, web browsing works, but one internal web application shows an error page. Which approach fits best?

- A) Bottom-up starting with cables
- B) Top-down starting at the application
- C) Replace the switch
- D) Reboot the router

<details>
<summary>Answer</summary>

**Answer:** B) Top-down starting at the application

**Explanation:** Lower layers clearly work for other applications.

</details>

### P2. Locate the layer

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** layered diagnosis

Results: ping gateway ✓, ping 8.8.8.8 ✓, `nslookup site.com` ✓, `curl -v https://site.com` → "Connection timed out". Which layer is the likely problem?

<details>
<summary>Answer</summary>

Layer 4 (or a firewall in the path): IP connectivity and DNS work, but the TCP connection to port 443 of that site gets no answer — a firewall/proxy blocking it or the site being down/filtered.

</details>

### P3. Order the checks

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** bottom-up order

Order these checks bottom-up: (a) `nslookup example.com`, (b) Wi-Fi connected, (c) `ping 192.168.1.1` (gateway), (d) `curl -v https://example.com`, (e) `ipconfig /all`, (f) `ping 1.1.1.1`.

<details>
<summary>Answer</summary>

(b) → (e) → (c) → (f) → (a) → (d).

</details>

### P4. First question

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** defining the problem

A manager says "the network is down". List four questions you ask before running any command.

<details>
<summary>Answer</summary>

Who is affected (one person, a team, everyone)? What exactly fails (all sites, one app, Wi-Fi only)? Since when, and is it constant or intermittent? What changed recently (moves, updates, deployments)? Also: the exact error message.

</details>
