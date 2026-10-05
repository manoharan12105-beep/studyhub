# Network Configuration — Interview Questions

## Beginner

### Q1. How do you find the IP address of a Linux machine?

<details>
<summary>Answer</summary>

`ip addr` (or `ip -br addr` for a compact view) shows the addresses of every interface; `hostname -I` prints just the addresses. On older systems `ifconfig`. The public address seen from the internet may differ because of NAT (`curl ifconfig.me`).

</details>

### Q2. How do you see the default gateway?

<details>
<summary>Answer</summary>

`ip route` — the line starting with `default via` shows the gateway and the interface. Legacy equivalents: `route -n` or `netstat -rn`.

</details>

### Q3. What is the loopback interface?

<details>
<summary>Answer</summary>

`lo`, with addresses `127.0.0.1` and `::1`: a virtual interface for the machine to talk to itself. Traffic never leaves the host, so a service listening only on `127.0.0.1` cannot be reached from other machines.

</details>

### Q4. What is `/etc/hosts` used for?

<details>
<summary>Answer</summary>

Static hostname-to-IP mappings for the local machine, checked before DNS (per `/etc/nsswitch.conf`). Useful for local overrides and testing — e.g. pointing `api.example.com` at a new server before changing DNS.

</details>

### Q5. How do you change the hostname permanently?

<details>
<summary>Answer</summary>

`sudo hostnamectl set-hostname newname` (systemd), then update the `127.0.1.1` line in `/etc/hosts`. `hostname newname` alone changes it only until reboot.

</details>

## Intermediate

### Q6. What is the difference between `ip` and `ifconfig`?

<details>
<summary>Answer</summary>

`ifconfig` (and `route`, `arp`, `netstat`) come from the deprecated net-tools package and do not show everything modern kernels support (multiple addresses per interface, policy routing, namespaces). `ip` (iproute2) covers addresses, links, routes, neighbours, tunnels and namespaces with one consistent syntax and is installed by default.

</details>

### Q7. Where is DNS configured on Linux, and how is the lookup order decided?

<details>
<summary>Answer</summary>

`/etc/nsswitch.conf` decides the order (`hosts: files dns` → `/etc/hosts` first, then DNS). DNS servers are listed in `/etc/resolv.conf`; on systemd-resolved systems it points to the local stub `127.0.0.53`, and `resolvectl status` shows the real upstream servers. Persistent DNS settings belong in netplan, NetworkManager or systemd-networkd configuration.

</details>

### Q8. What does `ip route get 8.8.8.8` tell you?

<details>
<summary>Answer</summary>

Which route the kernel would actually use for that destination: the gateway (`via`), the outgoing interface (`dev`) and the source address (`src`). It is the quickest way to check that traffic leaves through the expected interface on multi-homed servers or VPN setups.

</details>

### Q9. You added an IP address with `ip addr add`, and it disappeared after a reboot. Why?

<details>
<summary>Answer</summary>

`ip` changes the running kernel configuration only. Persistent configuration must be written to the system's network manager: `/etc/netplan/*.yaml` + `netplan apply` on Ubuntu, `nmcli connection modify` on NetworkManager systems, or `systemd-networkd` files.

</details>

## Advanced

### Q10. A server can reach machines on its own subnet but nothing else. What do you check?

<details>
<summary>Answer</summary>

The default route (`ip route` — missing or wrong `default via`), whether the gateway is reachable (`ping` it, `ip neigh` for its MAC), firewall rules on the host or gateway, and whether the gateway forwards/NATs traffic. Also check that the netmask is right — a wrong prefix length makes the host think remote addresses are local (or vice versa).

</details>

### Q11. `sudo` prints "unable to resolve host web01" after a hostname change. Why, and how do you fix it?

<details>
<summary>Answer</summary>

`sudo` looks up the machine's own hostname, and the new name exists neither in `/etc/hosts` nor in DNS. Add it: `127.0.1.1 web01` (Debian/Ubuntu convention) in `/etc/hosts`. The command still runs, but the delay and warning disappear.

</details>
