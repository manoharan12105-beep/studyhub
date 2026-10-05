# Network Configuration — Practice

### P1. Read the address

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** ip addr output

From the line `inet 10.0.2.15/24 brd 10.0.2.255 scope global enp0s3`, give the interface name, IP address, prefix length and broadcast address.

<details>
<summary>Answer</summary>

Interface `enp0s3`, address `10.0.2.15`, prefix `/24` (netmask 255.255.255.0), broadcast `10.0.2.255`.

</details>

### P2. Find the gateway

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** ip route

`ip route` prints:

```text
default via 192.168.1.1 dev wlan0 proto dhcp metric 600
192.168.1.0/24 dev wlan0 proto kernel scope link src 192.168.1.42
```

What is the default gateway?

- A) 192.168.1.42
- B) 192.168.1.1
- C) 192.168.1.0
- D) wlan0

<details>
<summary>Answer</summary>

**Answer:** B) 192.168.1.1

**Explanation:** The `default via` line names the gateway. `192.168.1.42` is this machine's own address.

</details>

### P3. Brief view

**Difficulty:** Easy · **Type:** Command · **Concepts:** ip -br

Show every interface with its state and IPv4 addresses on one line each.

<details>
<summary>Answer</summary>

```bash
ip -br -4 addr
```

</details>

### P4. Local only

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** loopback binding

A colleague's Spring Boot app works with `curl http://localhost:8080` on the server, but from another machine `curl http://10.0.0.5:8080` is refused. `ss -ltn` shows `127.0.0.1:8080`. Explain.

<details>
<summary>Answer</summary>

The application listens only on the loopback address, so the kernel accepts connections to `127.0.0.1:8080` but refuses connections arriving at `10.0.0.5`. Configure it to listen on all interfaces (`server.address=0.0.0.0` or remove the restriction) or on `10.0.0.5`, and make sure the firewall allows port 8080.

</details>

### P5. Override DNS for a test

**Difficulty:** Medium · **Type:** Command · **Concepts:** /etc/hosts, getent

Make `shop.example.com` resolve to `10.0.0.50` on this machine only, then verify it the way applications resolve names.

<details>
<summary>Answer</summary>

```bash
# Illustrative: needs root
echo "10.0.0.50  shop.example.com" | sudo tee -a /etc/hosts
getent hosts shop.example.com
```

Remove the line after testing so it does not silently override DNS later.

</details>

### P6. Which interface?

**Difficulty:** Medium · **Type:** Command · **Concepts:** ip route get

A server has a public and a private interface. Check which interface and source address are used to reach `10.20.30.40`.

<details>
<summary>Answer</summary>

```bash
# Illustrative
ip route get 10.20.30.40
```

The output's `dev` and `src` fields show the interface and source address the kernel chooses.

</details>

### P7. Unreachable network

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** default route

`ping 8.8.8.8` fails with "connect: Network is unreachable", while `ping 192.168.1.10` (same subnet) works. What is the most likely cause, and how do you confirm and temporarily fix it?

<details>
<summary>Answer</summary>

There is no default route, so the kernel has no path to addresses outside the local subnet. Confirm with `ip route` (no `default` line). Temporary fix: `sudo ip route add default via 192.168.1.1 dev eth0` (using the real gateway). Then make it permanent in netplan/NetworkManager and find out why it was lost (DHCP failure, wrong static config).

</details>
