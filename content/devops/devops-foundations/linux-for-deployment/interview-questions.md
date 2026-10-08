# Linux for Deployment — Interview Questions

## Beginner

### Q1. How does key-based SSH login work, and why is it preferred over passwords?

**Style:** How

<details>
<summary>Answer</summary>

You generate a key pair; the public key is added to `~/.ssh/authorized_keys` on the server and the private key stays on your machine. At login the server asks the client to prove it holds the private key (a signature), so no secret crosses the network. Keys cannot be guessed like passwords, so you can disable password login entirely and stop brute-force attacks.

</details>

### Q2. How do you find which process is listening on port 8080?

**Style:** How

<details>
<summary>Answer</summary>

`sudo ss -ltnp` (or `sudo ss -ltnp 'sport = :8080'`) lists listening TCP sockets with the owning process name and PID. `sudo lsof -i :8080` works too. `ps` alone cannot answer it because it knows nothing about ports.

</details>

### Q3. What is the difference between `kill` and `kill -9`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`kill PID` sends SIGTERM, which a program can handle: Spring Boot stops accepting requests, finishes in-flight ones and closes the connection pool. `kill -9` sends SIGKILL, which cannot be caught — the process dies immediately with no cleanup. Send SIGTERM first and use SIGKILL only if the process does not exit.

</details>

### Q4. Which permissions should a `.env` file containing a database password have?

**Style:** What

<details>
<summary>Answer</summary>

`600` (read and write for the owner only), owned by the deployment user: `chmod 600 .env`. Group and others get no access. It must also never be committed to Git.

</details>

## Intermediate

### Q5. `free -h` shows 150 MB free on a 2 GB server. Is the server out of memory?

**Style:** Trap

<details>
<summary>Answer</summary>

Not necessarily. Linux uses spare memory for the page cache, which it gives back on demand. Look at the **available** column: that estimates memory usable by new programs. Real exhaustion shows as low available memory, swap activity, and "Out of memory: Killed process" lines in `journalctl -k` or `dmesg`.

</details>

### Q6. A deployment user was added to the `docker` group but still gets "permission denied" on the Docker socket. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

Group membership is read when a session starts. The user must log out and back in (or start a new SSH session) for the new group to apply; `id` shows the groups of the current session. Also note that `docker` group membership is root-equivalent, so it should be given only to trusted users.

</details>

### Q7. You enabled ufw and lost your SSH session. What happened, and how do you avoid it?

**Style:** What happens if

<details>
<summary>Answer</summary>

ufw's default policy denies incoming connections, so enabling it without an SSH rule blocks port 22 and your session can no longer reach the server. Always run `sudo ufw allow OpenSSH` (or `allow 22/tcp`) before `sudo ufw enable`. To recover, use the cloud provider's web console to log in and add the rule.

</details>

### Q8. What is the difference between `systemctl restart` and `systemctl reload` for Nginx?

**Style:** Comparison

<details>
<summary>Answer</summary>

`restart` stops and starts the service: connections drop briefly. `reload` asks Nginx to re-read its configuration and start new workers while old workers finish their requests, so there is no downtime. Run `sudo nginx -t` first; reloading a broken configuration is refused and the old one keeps running.

</details>

## Advanced

### Q9. A firewall denies port 8080, yet the application in Docker is reachable on `http://IP:8080` from the internet. Explain.

**Style:** Production failure

<details>
<summary>Answer</summary>

Docker programs iptables directly when a port is published (`-p 8080:8080`): incoming traffic is redirected to the container in the NAT table before ufw's input rules apply, so ufw never sees it. Fix: publish only on loopback (`127.0.0.1:8080:8080`) and let Nginx on the host proxy to it, or do not publish the port at all when only other containers need it.

</details>

### Q10. The API is down. Describe your first five minutes on the server.

**Style:** Scenario

<details>
<summary>Answer</summary>

SSH in (proves the server and network are up). `df -h` for a full disk and `free -h` plus `journalctl -k` for OOM kills. `docker compose ps` to see whether the containers run or restart in a loop, and `systemctl status nginx docker`. `sudo ss -ltnp` to confirm the expected ports listen. `curl -i localhost:8080/actuator/health` to test the app without Nginx. Then read `docker compose logs --tail 100 app` and Nginx's `error.log`. Change one thing at a time and note what you changed.

</details>
