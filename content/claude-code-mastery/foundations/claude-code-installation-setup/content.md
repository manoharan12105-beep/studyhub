# Installation and Environment Setup

**Module:** Foundations, Installation and Modes · **Interview priority:** Frequently asked

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 and code.claude.com/docs (October 2026). Install commands and supported platforms change; the [official setup page](https://code.claude.com/docs/en/setup) is the source of truth.

## Definition

Setting up Claude Code means four things: **installing** the `claude` program, **authenticating** it with an account that includes Claude Code, choosing **where you will use it** (terminal, IDE, desktop app) and making a **first configuration** — at minimum, knowing where settings live and how to check what loaded.

## Why It Matters

- A broken install (wrong PATH, two installs fighting, an outdated version) causes confusing behaviour that looks like "the AI is wrong".
- Authentication decides billing and data handling: a personal subscription, a company Team/Enterprise seat, a Console API key or a cloud provider.
- Many features in this subject are **version-dependent**. Knowing how to check and update your version is a basic professional habit.

## How It Works

```text
install  ──►  claude --version  ──►  claude (first run)  ──►  /login in the browser  ──►  ready
                 prints e.g.               opens the              Pro, Max, Team,
           "2.1.289 (Claude Code)"     login flow             Enterprise, Console,
                                                              or a cloud provider
```

The native installer places a launcher on your PATH and keeps the program updated in the background. Settings are JSON files Claude Code reads at startup; your sign-in and some per-project state live in `~/.claude.json`, which Claude Code manages itself.

## System Requirements

| Requirement | Supported (per the setup docs) |
|-------------|-------------------------------|
| Operating system | macOS 13.0+, Windows 10 1809+ or Windows Server 2019+, Ubuntu 20.04+, Debian 10+, Alpine Linux 3.19+ |
| Hardware | 4 GB+ RAM, x64 or ARM64 |
| Network | Internet connection |
| Shell | Bash, Zsh, PowerShell or CMD |
| Account | Pro, Max, Team, Enterprise or Console account, or a supported cloud provider. The free claude.ai plan does not include Claude Code |

**Status:** Platform-specific — on native Windows, Claude Code uses Git Bash for its Bash tool when Git for Windows is installed, and a PowerShell tool otherwise. The Bash **sandbox** (Module 4) runs on macOS, Linux and WSL 2, not native Windows.

## Install

Pick one method. The native installer is the documented recommendation and updates itself.

**macOS, Linux, WSL:**

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows PowerShell:**

```powershell
irm https://claude.ai/install.ps1 | iex
```

**Alternatives:**

| Method | Command | Updates |
|--------|---------|---------|
| Homebrew | `brew install --cask claude-code` | Manual: `brew upgrade claude-code` |
| WinGet | `winget install Anthropic.ClaudeCode` | Manual: `winget upgrade Anthropic.ClaudeCode` |
| npm (Node.js 22+) | `npm install -g @anthropic-ai/claude-code` | `npm install -g @anthropic-ai/claude-code@latest` |
| apt, dnf, apk | See the setup docs | Manual (needs elevated privileges) |

> [!WARNING]
> Do not use `sudo npm install -g` — the docs warn it causes permission problems and security risks. If you see two different versions in different terminals, you probably have two installs; `claude doctor` reports duplicate or leftover installs.

## Verify and Update

```bash
claude --version
claude doctor
```

**Output:**

```text
2.1.289 (Claude Code)
```

(That is the first command on the machine used to write this subject; your version number will differ.) `claude doctor` prints read-only diagnostics — install health, settings-file errors, warnings with suggested fixes — without starting a session.

Native installs check for updates at startup and while running; the update takes effect the next time you start Claude Code. To update now, run `claude update`. The `autoUpdatesChannel` setting chooses `"latest"` (default) or `"stable"` (typically about a week old, skipping releases with major regressions).

## Authentication

Run `claude` in a project. On first launch it opens a browser to sign in; when the browser cannot reach back (WSL 2, SSH, containers), paste the code it shows into the terminal.

| Account type | Typical user | Billing |
|--------------|--------------|---------|
| Pro or Max | Individual developer | Subscription usage limits |
| Team or Enterprise | Company seat | Organization plan; admins can enforce settings |
| Claude Console | API customer | Pay per token from Console credits |
| Amazon Bedrock, Google Cloud's Agent Platform, Microsoft Foundry | Enterprises on a cloud provider | The provider's billing; no browser login |

If `ANTHROPIC_API_KEY` is set and you approve it when asked, Claude Code uses the key instead of a browser login. Use `/login` and `/logout` inside a session to switch accounts. Credentials are stored in the macOS Keychain when available, in a `0600` file on Linux, and in a file under your user profile on Windows.

> [!CAUTION]
> Never paste an API key into a prompt, a `CLAUDE.md` or a committed settings file. Keys belong in your environment, a secret manager or CI secrets.

## Basic Configuration

You do not need to configure anything to start. Learn where things live:

| File | Scope | Created when |
|------|-------|--------------|
| `~/.claude/settings.json` | You, every project | You change an option in `/config`, or create it yourself |
| `.claude/settings.json` | Everyone in this project (commit it) | You create it |
| `.claude/settings.local.json` | You, this project (kept out of Git) | You answer "Yes, and don't ask again" to a command prompt, or create it |
| `~/.claude.json` | Sign-in, MCP servers, per-project state | Claude Code writes it; you rarely edit it |

Inside a session, `/config` opens settings such as theme and editor mode, and `/status` shows the version, model, account and which settings files loaded. Module 4 covers settings and precedence in depth.

## Terminal Workflow vs IDE Integration

| Surface | How it works | Choose it when |
|---------|--------------|----------------|
| **Terminal CLI** | `claude` in any terminal; every command and skill available | You want full control, scripting, `!` shell mode, all commands |
| **VS Code extension** | A graphical panel (Spark icon); diffs in the editor; a mode selector | You live in VS Code and like reviewing diffs in the editor |
| **JetBrains plugin** | Runs `claude` in the IDE's terminal and connects to it: IDE diff viewer, selection sharing, `Ctrl+Esc` / `Cmd+Esc` to launch | You use IntelliJ IDEA for Java |
| **Desktop app** | A graphical app with a Code tab for local sessions | You prefer a GUI outside the IDE |

Two details trip people up:

- The **VS Code extension does not put `claude` on your PATH** and supports a subset of commands; for a CLI-only feature, install the CLI and run `claude` in VS Code's integrated terminal.
- The **JetBrains plugin does not bundle the CLI** — it shows "Cannot launch Claude Code" if `claude` is not on your PATH.

The IDE integrations share your selection and open file with Claude, and `Read` deny rules also block that sharing for matching files.

## Step-by-Step Walkthrough

1. Install with the native installer for your OS.
2. Open a **new** terminal and run `claude --version`. If it says *command not found*, fix PATH before anything else.
3. Run `claude doctor` and read the warnings.
4. `cd` into a real project, run `claude`, and sign in.
5. Run `/status`: confirm the account, model and settings sources.
6. For Java work in IntelliJ, install the JetBrains plugin and confirm it launches `claude` from the IDE.

[Lab 02](../../labs/cc-lab-02-install-configure/content.md) walks through these steps with checks.

## Common Mistakes

- Installing twice (npm and native) and getting different versions in different shells.
- Expecting the VS Code extension to provide the `claude` command in every terminal.
- Running `claude` once from the home directory and approving trust there.
- Pasting API keys into chat or committing them in `.claude/settings.json`.
- Ignoring updates for months, then following documentation for a newer version.

## Security Considerations

- `curl … | bash` runs a script from the internet. Use only the official URL, from the official docs, over HTTPS; the setup docs also describe verifying binary integrity and code signatures if your organization requires it.
- On a shared or company machine, check whether **managed settings** apply (`/status` shows them). They can enforce permissions you cannot override — by design.
- Logging in with a personal account on a work repository can violate company policy and send code under the wrong data agreement. Use the account your organization approved.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `claude: command not found` | Install directory not on PATH, or old terminal | Open a new terminal; follow the PATH fix in the install troubleshooting docs |
| Login page never returns | Browser cannot reach the local callback (WSL 2, SSH, container) | Paste the code from the browser at `Paste code here if prompted` |
| Different versions in two terminals | Two installs | `claude doctor`, remove the extra install |
| Settings change ignored | Invalid JSON (comments, trailing comma) or a higher-precedence file | `/status`, `claude doctor` |
| JetBrains: "Cannot launch Claude Code" | CLI not installed or not on PATH | Install the CLI first |

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| Native installer | Auto-updates | Your version changes under you; pin a channel if stability matters |
| Package manager | Fits your existing tooling | Manual updates |
| Terminal | Every feature, scriptable | Diffs are text unless you use an IDE diff viewer |
| IDE extension | Visual diffs, inline context | Subset of commands in VS Code |

## Interview Takeaways

- Know the supported install methods, how to verify (`claude --version`, `claude doctor`) and how updates work.
- Explain which account types exist and why a company might require Team/Enterprise or a cloud provider.
- Describe how the CLI and IDE integrations relate: the JetBrains plugin drives the CLI; the VS Code extension is a separate panel with a subset of commands.

## Key Takeaways

- Install natively, verify with `claude --version` and `claude doctor`, keep it updated.
- Sign in with the account your organization approves; keys never go into prompts or repositories.
- `~/.claude/settings.json`, `.claude/settings.json` and `.claude/settings.local.json` are the files to know; `/status` shows what loaded.
- Terminal for full control; IDE integrations for visual review — they use the same engine.
