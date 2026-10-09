# Installation and Environment Setup — Interview Questions

## Beginner

### Q1. How do you install Claude Code and confirm it works?

**Style:** How

<details>
<summary>Answer</summary>

Use the native installer — `curl -fsSL https://claude.ai/install.sh | bash` on macOS, Linux and WSL, or `irm https://claude.ai/install.ps1 | iex` in Windows PowerShell — or a package manager such as Homebrew or WinGet. Open a new terminal, run `claude --version` (it prints the version and `(Claude Code)`), then `claude doctor` for read-only diagnostics. Start `claude` in a project and sign in through the browser.

</details>

### Q2. Which accounts can you use?

**Style:** What

<details>
<summary>Answer</summary>

A Claude Pro or Max subscription, a Team or Enterprise seat, a Claude Console account, or a cloud provider (Amazon Bedrock, Google Cloud's Agent Platform, Microsoft Foundry). The free claude.ai plan does not include Claude Code. Companies usually require their own organization account so data handling and billing follow the company agreement.

</details>

### Q3. Where do Claude Code settings live?

**Style:** What

<details>
<summary>Answer</summary>

User settings in `~/.claude/settings.json`; shared project settings in `.claude/settings.json` (committed); personal project settings in `.claude/settings.local.json` (kept out of Git); and managed settings deployed by an organization, which take precedence. `~/.claude.json` holds sign-in, MCP server configuration and per-project state that Claude Code manages. `/status` shows which settings files loaded.

</details>

## Intermediate

### Q4. How do the VS Code and JetBrains integrations relate to the CLI?

**Style:** Comparison

<details>
<summary>Answer</summary>

The JetBrains plugin runs the `claude` CLI in the IDE terminal and adds IDE features — diff viewer, selection sharing, diagnostics — so the CLI must be installed. The VS Code extension is a graphical panel with its own session list and a subset of commands; it does not add `claude` to your PATH. For a CLI-only feature in VS Code, install the CLI and run it in the integrated terminal.

</details>

### Q5. How are updates handled, and why might a team care?

**Style:** Why

<details>
<summary>Answer</summary>

Native installs auto-update in the background; the new version applies at the next start. `autoUpdatesChannel` can be `latest` or `stable` (about a week old, skipping releases with major regressions), and admins can pin a minimum version. Teams care because behaviour — default permission mode, settings keys — is version-dependent, so a shared workflow or CI job should know which version it runs.

</details>

## Advanced

### Q6. A new developer's settings change has no effect. How do you troubleshoot?

**Style:** Debugging

<details>
<summary>Answer</summary>

Run `/status` to see which settings sources loaded; a managed or project file may set the same key at higher precedence. Run `claude doctor` to catch invalid JSON (comments and trailing commas are errors) or rejected keys. Confirm the file is in the right place — `.claude/settings.json` in the directory where the session starts — and whether the key is read only at startup (some, like `model`, need a new session or `/model`).

</details>

### Q7. What security points do you raise when rolling Claude Code out to a team?

**Style:** Security

<details>
<summary>Answer</summary>

Install from the official source only and without `sudo`; use organization accounts, not personal ones; keep API keys out of prompts, `CLAUDE.md` and committed settings; consider managed settings for non-negotiable deny rules (secrets, production commands); commit a reviewed `.claude/settings.json` with sensible permissions; and document a minimum supported version.

</details>
