# SSH Keys for GitHub — Practice

### P1. Which file goes to GitHub?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** public vs private key

Which file do you paste into GitHub's SSH keys settings?

- A) `~/.ssh/id_ed25519`
- B) `~/.ssh/id_ed25519.pub`
- C) `~/.ssh/known_hosts`
- D) `~/.ssh/config`

<details>
<summary>Answer</summary>

**Answer:** B) `~/.ssh/id_ed25519.pub`

The file without `.pub` is the private key and must never leave your machine.

</details>

### P2. Generate a key

**Difficulty:** Easy · **Type:** Command · **Concepts:** ssh-keygen

Generate a modern SSH key labelled with `arjun@example.com`.

<details>
<summary>Answer</summary>

`ssh-keygen -t ed25519 -C "arjun@example.com"` (accept the default location and set a passphrase).

</details>

### P3. Read the test

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** ssh -T

`ssh -T git@github.com` prints `git@github.com: Permission denied (publickey).` What does this tell you, and does it mean SSH can reach GitHub?

<details>
<summary>Answer</summary>

SSH reached GitHub (the connection and host verification worked) but no offered key is registered on a GitHub account — either the key isn't loaded/present, or its public key wasn't added (or was added to another account).

</details>

### P4. Still asking for a password

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** remote URL

You set up SSH keys and `ssh -T git@github.com` greets you by name, but `git push` still asks for a username and password. Why?

<details>
<summary>Answer</summary>

The remote still uses an HTTPS URL. Switch it: `git remote set-url origin git@github.com:your-username/gradebook.git`.

</details>

### P5. Key hygiene

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** key management

You use a laptop, a lab PC and a cloud VM. Should they share one key pair? Explain.

<details>
<summary>Answer</summary>

No — generate one key per machine. Copying a private key spreads the secret; per-machine keys let you revoke exactly the key of a lost or retired machine without affecting the others, and the key titles on GitHub show where each one lives.

</details>
