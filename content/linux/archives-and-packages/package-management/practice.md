# Package Management with apt — Practice

These items describe commands that need root or network access. Try them in a VM or container.

### P1. Order of operations

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** apt update vs upgrade

You want to apply the latest security fixes on an Ubuntu server. Which sequence is correct?

- A) `sudo apt upgrade` then `sudo apt update`
- B) `sudo apt update` then `sudo apt upgrade`
- C) `sudo apt install --update`
- D) `sudo dpkg -i --upgrade`

<details>
<summary>Answer</summary>

**Answer:** B) `sudo apt update` then `sudo apt upgrade`

**Explanation:** `update` refreshes the list of available versions; `upgrade` then installs them. In the other order, `upgrade` uses an outdated list.

</details>

### P2. Install without prompts

**Difficulty:** Easy · **Type:** Command · **Concepts:** apt install -y

Install `tree` and `jq` in one command, answering yes automatically.

<details>
<summary>Answer</summary>

```bash
# Illustrative: needs root
sudo apt update && sudo apt install -y tree jq
```

</details>

### P3. Remove completely

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** remove vs purge

You removed `nginx` with `apt remove`, reinstalled it, and your old configuration came back. Which command would also have removed the configuration files?

- A) `apt remove --all nginx`
- B) `apt purge nginx`
- C) `apt clean nginx`
- D) `apt autoremove nginx`

<details>
<summary>Answer</summary>

**Answer:** B) `apt purge nginx`

**Explanation:** `remove` keeps configuration files; `purge` deletes them as well. `clean` empties the download cache; `autoremove` removes unused dependencies.

</details>

### P4. Who owns this file?

**Difficulty:** Medium · **Type:** Command · **Concepts:** dpkg -S

A strange binary `/usr/bin/wcurl` exists on the server. Find out which package installed it and list the other files of that package.

<details>
<summary>Answer</summary>

```bash
# Illustrative
dpkg -S /usr/bin/wcurl          # e.g. curl: /usr/bin/wcurl
dpkg -L curl
```

If `dpkg -S` reports no package, the file was installed manually — worth investigating.

</details>

### P5. Pending updates

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** apt-cache policy

`apt-cache policy openssl` shows `Installed: 3.0.13-0ubuntu3.4` and `Candidate: 3.0.13-0ubuntu3.5`. What does that tell you, and what would you do?

<details>
<summary>Answer</summary>

A newer version (often a security fix) is available in the repositories but not installed. Read the changelog or security notice, then `sudo apt install --only-upgrade openssl` (or `sudo apt upgrade`), and restart services that use the library (`needrestart` lists them).

</details>

### P6. Local .deb with dependencies

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** dpkg -i vs apt install ./

`sudo dpkg -i vendor-agent_2.1_amd64.deb` fails with "dependency problems — leaving unconfigured". Fix the situation, and say what you would run next time.

<details>
<summary>Answer</summary>

```bash
# Illustrative
sudo apt -f install                          # fetch the missing dependencies and finish configuration
# next time:
sudo apt install ./vendor-agent_2.1_amd64.deb
```

`dpkg` does not download dependencies; `apt install ./file.deb` does.

</details>

### P7. Slim container image

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** Dockerfile best practices

A Dockerfile has:

```text
RUN apt-get update
RUN apt-get install curl
```

Name three problems and write a better instruction.

<details>
<summary>Answer</summary>

1. The `update` layer is cached separately, so later builds may install from a stale index.
2. `install` without `-y` waits for confirmation and fails in a non-interactive build.
3. Recommended packages and the package lists stay in the image, making it larger.

```bash
# Illustrative: Dockerfile RUN instruction
apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
```

</details>

### P8. Other distributions

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** dnf, apk

Write the equivalent of `sudo apt install git` on (a) Rocky Linux and (b) an Alpine container.

<details>
<summary>Answer</summary>

(a) `sudo dnf install git` (b) `apk add git` (inside the container, usually as root).

</details>
