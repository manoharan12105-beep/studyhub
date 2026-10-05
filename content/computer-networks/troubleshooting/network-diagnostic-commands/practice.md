# Network Diagnostic Commands — Practice

### P1. Right tool

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** tool selection

Which command shows the list of routers between you and a server?

- A) ping
- B) nslookup
- C) tracert / traceroute
- D) ipconfig

<details>
<summary>Answer</summary>

**Answer:** C) tracert / traceroute

</details>

### P2. Match the error

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** curl errors

Map each curl error to a layer/cause: (a) `Could not resolve host`, (b) `Failed to connect … Could not connect to server` immediately, (c) `Connection timed out after 3002 milliseconds`, (d) `SSL certificate problem: certificate has expired`.

<details>
<summary>Answer</summary>

(a) DNS. (b) Connection refused — nothing listening on that port (or actively rejected). (c) No answer — firewall dropping, wrong route, host down. (d) TLS — expired server certificate.

</details>

### P3. Read ipconfig

**Difficulty:** Medium · **Type:** Output · **Concepts:** configuration red flags

`ipconfig /all` shows `IPv4 Address: 169.254.77.12`, `Default Gateway:` (empty), `DHCP Enabled: Yes`. What happened?

<details>
<summary>Answer</summary>

DHCP failed: the PC assigned itself an APIPA (link-local) address and has no gateway. Check the link, the DHCP server/relay and pool, then `ipconfig /release` and `ipconfig /renew`.

</details>

### P4. Command for each question

**Difficulty:** Medium · **Type:** Command · **Concepts:** command selection

Give a Linux command for each: (a) default gateway, (b) is `db:5432` reachable, (c) which resolver answers and what it returns for `api.example.com`, (d) only the HTTP status code of `https://api.example.com/health`.

<details>
<summary>Answer</summary>

```bash
# Illustrative
ip route                                   # (a) "default via …"
nc -zv db 5432                             # (b)
dig api.example.com                        # (c) or: nslookup api.example.com
curl -s -o /dev/null -w '%{http_code}\n' https://api.example.com/health   # (d)
```

</details>

### P5. Test before DNS change

**Difficulty:** Hard · **Type:** Command · **Concepts:** curl --resolve

A new server `203.0.113.77` should serve `https://shop.example.com`, but DNS still points to the old server. How do you test the new server with the correct hostname, SNI and certificate check?

<details>
<summary>Answer</summary>

```bash
# Illustrative
curl -v --resolve shop.example.com:443:203.0.113.77 https://shop.example.com/
```

curl connects to the new IP but sends `shop.example.com` in SNI and the `Host` header and verifies the certificate for that name.

</details>
