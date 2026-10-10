# HTTPS and SSH Remotes — Practice

### P1. Which protocol?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** URL formats

Which remote URL uses SSH?

- A) `https://github.com/your-org/gradebook.git`
- B) `git@github.com:your-org/gradebook.git`
- C) `github.com/your-org/gradebook`
- D) `http://github.com/your-org/gradebook.git`

<details>
<summary>Answer</summary>

**Answer:** B) `git@github.com:your-org/gradebook.git`

</details>

### P2. Switch to SSH

**Difficulty:** Easy · **Type:** Command · **Concepts:** set-url

Change `origin` to `git@github.com:your-username/gradebook.git`.

<details>
<summary>Answer</summary>

`git remote set-url origin git@github.com:your-username/gradebook.git`

</details>

### P3. Spot the leak

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** credentials in URLs

`git remote -v` on a shared lab machine prints `https://arjun:ghp_EXAMPLE_TOKEN@github.com/your-org/gradebook.git`. What are the risks, and what should Arjun do?

<details>
<summary>Answer</summary>

The token is stored in plain text and visible to anyone using the machine or seeing the output; it may also be in shell history and logs. Arjun should revoke the token on GitHub immediately, reset the URL to one without credentials (`git remote set-url origin https://github.com/your-org/gradebook.git`), and use a credential helper or SSH.

</details>

### P4. Firewall

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** ports

On a campus network, `git fetch` over SSH hangs and times out, while the GitHub website works. What's a likely cause and two workarounds?

<details>
<summary>Answer</summary>

Outbound port 22 is blocked. Switch the remote to HTTPS (port 443) with a credential manager, or use GitHub's SSH-over-443 endpoint (`ssh.github.com`, port 443) configured in `~/.ssh/config`.

</details>
