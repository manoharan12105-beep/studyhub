# SSH — Interview Questions

## Beginner

### Q1. What is SSH and why is it preferred over Telnet?

<details>
<summary>Answer</summary>

Secure Shell is a protocol for encrypted, authenticated remote access over TCP port 22 — remote shells, file transfer (SCP/SFTP) and tunnelling. Telnet sends everything, including passwords, in clear text and does not verify the server; SSH encrypts all traffic, verifies the server's host key and supports key-based user authentication.

</details>

## Intermediate

### Q2. How does SSH public-key authentication work?

**Style:** What happens internally

<details>
<summary>Answer</summary>

The user's public key is placed in `~/.ssh/authorized_keys` on the server. During login, after the encrypted channel is established, the client signs data unique to the session with its private key; the server verifies the signature with the stored public key. The private key never leaves the client, and nothing reusable is sent over the network.

</details>

### Q3. What does the "host key verification failed / REMOTE HOST IDENTIFICATION HAS CHANGED" warning mean?

**Style:** Scenario

<details>
<summary>Answer</summary>

The server presented a host key different from the one stored in `~/.ssh/known_hosts`. Either the server was legitimately reinstalled or its keys rotated (or the IP now belongs to another machine), or someone is intercepting the connection (man-in-the-middle). Verify the new fingerprint through a trusted channel before removing the old entry (`ssh-keygen -R host`).

</details>

### Q4. What is SSH local port forwarding? Give a use case.

<details>
<summary>Answer</summary>

`ssh -L local_port:target_host:target_port user@jump` listens on a local port and forwards connections through the encrypted SSH session to the jump host, which connects to the target. Use case: reaching a PostgreSQL database in a private subnet (`ssh -L 5433:db.internal:5432 user@bastion`, then connect to `localhost:5433`) without exposing the database publicly.

</details>

## Advanced

### Q5. Which keys does SSH use for what?

<details>
<summary>Answer</summary>

Host key pair (server): proves the server's identity by signing the key exchange. User key pair (client): proves the user's identity. Ephemeral Diffie-Hellman keys: agree on a shared secret, from which symmetric session keys (e.g. AES-GCM or ChaCha20-Poly1305) are derived to encrypt and integrity-protect the traffic. Because session keys are ephemeral, past sessions stay secret even if the host key later leaks (forward secrecy).

</details>
