# Networking and SSH Cheat Sheet

Linux commands for addresses, routes, DNS, ports, HTTP, SSH and file transfer.

## Interfaces and Routes

| Command | Purpose |
|---------|---------|
| `ip -br addr` / `ip addr show eth0` | Addresses per interface |
| `ip -br link` | Interfaces up/down, MAC |
| `ip route` / `ip route get 8.8.8.8` | Routing table / route used for a destination |
| `hostname` / `hostname -I` / `hostnamectl` | Name / all IPs / host details |
| `ip neigh` | ARP / neighbour cache |
| `ifconfig`, `route`, `netstat` | Legacy net-tools equivalents |

## Connectivity and DNS

| Command | Purpose |
|---------|---------|
| `ping -c 3 host` | ICMP reachability and latency (may be blocked) |
| `traceroute -n host` / `tracepath host` / `mtr host` | Path, hop by hop |
| `dig name` / `dig +short name` / `dig name MX` / `dig @1.1.1.1 name` | DNS queries (records, specific server) |
| `nslookup name` / `host name` | Simpler DNS lookups |
| `getent hosts name` | System resolver (`/etc/hosts` + DNS, as applications see it) |
| `/etc/hosts` | Static name → IP mappings |
| `/etc/resolv.conf` / `resolvectl status` | DNS servers |
| `/etc/nsswitch.conf` (`hosts: files dns`) | Lookup order |

dig status: `NOERROR` ok · `NXDOMAIN` name does not exist · `SERVFAIL` resolver failure · "no servers could be reached" = DNS server unreachable.

## Ports and Connections

| Command | Purpose |
|---------|---------|
| `ss -ltn` / `sudo ss -ltnp` | Listening TCP ports (with processes) |
| `ss -lun` | Listening UDP ports |
| `ss -tan` / `ss -s` | All TCP connections / summary |
| `sudo lsof -i :8080` / `sudo fuser 8080/tcp` | Who uses a port |
| `nc -zv host 443` | Test a TCP port |
| `timeout 3 bash -c '</dev/tcp/host/443'` | Port test without extra tools |

Well-known ports: 22 SSH · 25 SMTP · 53 DNS · 80 HTTP · 443 HTTPS · 3306 MySQL · 5432 PostgreSQL · 6379 Redis · 8080 alternate HTTP · 27017 MongoDB.

Listening on `0.0.0.0` / `*` = all interfaces; `127.0.0.1` = this machine only.

## HTTP

| Command | Purpose |
|---------|---------|
| `curl https://site` | GET, body to stdout |
| `curl -I url` | Headers only (HEAD) |
| `curl -v url` | Debug: DNS, connect, TLS, headers |
| `curl -sS -o /dev/null -w '%{http_code}\n' url` | Status code only |
| `curl -X POST -H 'Content-Type: application/json' -d '{"a":1}' url` | POST JSON |
| `curl -L url` / `curl -O url` | Follow redirects / save with remote name |
| `wget url` / `wget -c url` | Download / resume |

Errors: `(6)` could not resolve host · `(7)` failed to connect (refused) · `(28)` timeout · `(60)` certificate problem.

## SSH and File Transfer

| Command | Purpose |
|---------|---------|
| `ssh user@host` / `ssh -p 2222 -i key user@host` | Connect / port and key |
| `ssh user@host 'cmd'` | Run one remote command |
| `ssh -v user@host` | Debug |
| `ssh-keygen -t ed25519` | Create a key pair |
| `ssh-copy-id user@host` | Install the public key |
| `ssh -L 5433:localhost:5432 user@host` | Local port forward |
| `~/.ssh/config` | `Host`, `HostName`, `User`, `Port`, `IdentityFile`, `ProxyJump` |
| `scp f user@host:/dir/` / `scp -r` / `scp -P 2222` | Copy (capital `-P` = port) |
| `rsync -avz src/ user@host:/dst/` | Sync differences; `-n` dry run, `--delete` mirror |

Permissions: `~/.ssh` `700`, private key `600`, `authorized_keys` `600`. Hardening: `PermitRootLogin no`, `PasswordAuthentication no`, test with `sshd -t` and a second session.

## Firewall (Ubuntu ufw)

`sudo ufw status verbose` · `sudo ufw allow 22/tcp` · `sudo ufw allow from 10.0.0.0/16 to any port 5432 proto tcp` · `sudo ufw enable` (allow SSH **first**). RHEL: `firewall-cmd --list-all`, `--add-port=8080/tcp --permanent`, `--reload`.
