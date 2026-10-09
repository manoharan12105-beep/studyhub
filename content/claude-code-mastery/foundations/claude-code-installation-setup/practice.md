# Installation and Environment Setup — Practice

### P1. Verify the install

**Difficulty:** Easy · **Type:** Command · **Concepts:** verification

Which two commands confirm that Claude Code is installed and report problems with the installation and settings, without starting a session?

<details>
<summary>Answer</summary>

```bash
claude --version
claude doctor
```

`claude --version` prints the version followed by `(Claude Code)`. `claude doctor` prints read-only diagnostics: install health, settings validation errors and warnings with fixes. (`/doctor` inside a session is a fuller checkup that can also fix issues.)

</details>

### P2. Account check

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** authentication

Which account can **not** be used to sign in to Claude Code according to the setup docs?

- A) Claude Max subscription
- B) Claude for Teams seat
- C) Free claude.ai plan
- D) Claude Console account

<details>
<summary>Answer</summary>

**Answer:** C) Free claude.ai plan

The docs state that the free plan does not include Claude Code. Pro, Max, Team, Enterprise and Console accounts work, as do Amazon Bedrock, Google Cloud's Agent Platform and Microsoft Foundry.

</details>

### P3. Two versions

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** duplicate installs

`claude --version` prints `2.1.289` in PowerShell but `2.1.240` in Git Bash. What is the likely cause and how do you investigate?

<details>
<summary>Answer</summary>

Two installations (for example native and npm) with different PATH order in each shell. Run `claude doctor` in each shell — it reports duplicate or leftover installs — then remove the extra one and keep a single install method. Check which binary each shell runs (`Get-Command claude` in PowerShell, `which claude` in Git Bash).

</details>

### P4. JetBrains plugin

**Difficulty:** Easy · **Type:** Failure diagnosis · **Concepts:** IDE integration

After installing the JetBrains plugin in IntelliJ IDEA you get "Cannot launch Claude Code". Why?

<details>
<summary>Answer</summary>

The plugin runs the `claude` CLI in the IDE terminal and does not bundle its own copy. Install the CLI (and make sure it is on PATH), then restart the IDE.

</details>

### P5. Where does this setting go?

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** settings scopes

Match each need to a file: (a) your preferred theme in every project; (b) a permission rule the whole team should get; (c) a personal exception for this one project that teammates should not get.

<details>
<summary>Answer</summary>

(a) `~/.claude/settings.json` — user scope.
(b) `.claude/settings.json` in the repository, committed.
(c) `.claude/settings.local.json` — project local; Claude Code keeps it out of Git when it creates the file (if you create it by hand, add it to `.gitignore`).

</details>

### P6. Callback fails in WSL

**Difficulty:** Medium · **Type:** Failure diagnosis · **Concepts:** login

In WSL 2, you sign in in the browser but the terminal keeps waiting, and the browser shows a code. What do you do?

<details>
<summary>Answer</summary>

Paste the code at the terminal's `Paste code here if prompted` prompt. The browser could not reach Claude Code's local callback server, which is common in WSL 2, SSH sessions and containers.

</details>

### P7. Secure install decision

**Difficulty:** Medium · **Type:** Security · **Concepts:** supply chain

A blog post suggests `curl -fsSL https://claude-code-installer.example.org/install.sh | sudo bash`. What is wrong with it?

<details>
<summary>Answer</summary>

Two problems: the URL is not the official one (`https://claude.ai/install.sh` from the official docs), so you would run an unknown script; and `sudo` gives that script root. Use the official command without `sudo`; the native installer does not need it. If your company requires it, verify binary integrity as the setup docs describe.

</details>

### P8. Choose a surface

**Difficulty:** Hard · **Type:** Trade-off · **Concepts:** terminal vs IDE

You maintain a Spring Boot service in IntelliJ IDEA and want (1) visual diffs and (2) to script a nightly read-only report with `claude -p`. Which surfaces do you set up and why?

<details>
<summary>Answer</summary>

Install the **CLI** (required for both) and the **JetBrains plugin**. The plugin runs the CLI in IntelliJ's terminal and opens changes in the IDE diff viewer — (1). The nightly report is a non-interactive `claude -p` run from a script or scheduler — (2), which only the CLI provides. The VS Code extension would not help here, and the IDE integrations are front-ends to the same engine, not replacements for the CLI.

</details>
