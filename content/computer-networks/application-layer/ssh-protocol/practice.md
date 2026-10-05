# SSH — Practice

### P1. Port

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** SSH port

Which port does SSH use by default?

- A) 21
- B) 22
- C) 23
- D) 443

<details>
<summary>Answer</summary>

**Answer:** B) 22

</details>

### P2. Where does each key live?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** key files

Where are (a) your private key, (b) your public key for login, (c) the server's host key fingerprints you trust?

<details>
<summary>Answer</summary>

(a) On your machine, e.g. `~/.ssh/id_ed25519` (never shared). (b) On the server in `~/.ssh/authorized_keys` of the target user. (c) On your machine in `~/.ssh/known_hosts`.

</details>

### P3. Tunnel

**Difficulty:** Medium · **Type:** Command · **Concepts:** local port forwarding

Write the SSH command to reach Redis at `cache.internal:6379` through bastion `bastion.example.com` (user `ops`) via local port 6380.

<details>
<summary>Answer</summary>

```bash
# Illustrative
ssh -L 6380:cache.internal:6379 ops@bastion.example.com
```

Then connect to `localhost:6380`.

</details>

### P4. Encryption keys

**Difficulty:** Hard · **Type:** Conceptual · **Concepts:** symmetric vs asymmetric in SSH

A colleague says "SSH encrypts my traffic with my private key, so if my key leaks, all my past sessions can be decrypted." Correct them.

<details>
<summary>Answer</summary>

Traffic is encrypted with symmetric session keys derived from an ephemeral Diffie-Hellman exchange; the private key only signs to prove identity. A leaked private key lets an attacker impersonate you in future logins (revoke it), but it does not decrypt recorded past sessions — that is forward secrecy.

</details>
