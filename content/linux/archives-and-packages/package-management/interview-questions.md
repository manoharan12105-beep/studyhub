# Package Management with apt — Interview Questions

## Beginner

### Q1. What is the difference between `apt update` and `apt upgrade`?

<details>
<summary>Answer</summary>

`apt update` downloads the latest package lists from the configured repositories — it learns what versions exist but changes no installed software. `apt upgrade` then installs newer versions of installed packages based on those lists. Always run `update` before `upgrade` or `install`.

</details>

### Q2. What is a package manager and why use one?

<details>
<summary>Answer</summary>

A tool that installs, upgrades and removes software from trusted, signed repositories, resolving dependencies automatically and recording every installed file. It gives consistent installs, easy security updates, clean removal and verification — instead of manually copying binaries and libraries.

</details>

### Q3. How do you install and remove a package on Ubuntu?

<details>
<summary>Answer</summary>

`sudo apt install nginx` and `sudo apt remove nginx` (keeps configuration) or `sudo apt purge nginx` (also removes configuration). `sudo apt autoremove` then removes dependencies that are no longer needed.

</details>

### Q4. What is a repository?

<details>
<summary>Answer</summary>

A server (or local mirror) hosting packages and signed index files, configured in `/etc/apt/sources.list` and `/etc/apt/sources.list.d/`. apt downloads the index with `apt update` and verifies packages with the repository's signing key.

</details>

## Intermediate

### Q5. What is the difference between `apt` and `dpkg`?

<details>
<summary>Answer</summary>

`dpkg` installs, removes and queries individual `.deb` files on the local machine; it does not download anything or resolve dependencies. `apt` works on top of it: it talks to repositories, works out dependencies, downloads packages and calls `dpkg` to install them.

</details>

### Q6. How do you find which package a file belongs to?

<details>
<summary>Answer</summary>

For installed files: `dpkg -S /usr/bin/curl`. For files of packages that are not installed: `apt-file search filename` (after installing `apt-file` and running `apt-file update`). On RPM systems: `rpm -qf /path` or `dnf provides /path`.

</details>

### Q7. What is the difference between `apt upgrade` and `apt full-upgrade`?

<details>
<summary>Answer</summary>

`upgrade` installs newer versions and new dependencies but never removes an installed package; packages whose upgrade would require a removal are held back. `full-upgrade` (`apt-get dist-upgrade`) may remove packages to complete the upgrade — needed for some kernel or major library changes.

</details>

### Q8. `apt install` says "Unable to locate package". What do you check?

<details>
<summary>Answer</summary>

Run `sudo apt update` (the index may be empty — common in fresh containers); check the package name (`apt search`); check that the right repository/component is enabled (e.g. `universe` on Ubuntu) and that the package exists for this release and architecture; for vendor software, add the vendor's repository and key.

</details>

### Q9. Why should Dockerfiles run `apt-get update && apt-get install` in the same `RUN` instruction?

<details>
<summary>Answer</summary>

Docker caches each layer. If `update` runs in a separate layer, later builds may reuse an old cached index and fail to find packages or install outdated versions. Combining them (and cleaning `/var/lib/apt/lists/*` afterwards, plus `--no-install-recommends`) keeps the index fresh and the image small.

</details>

## Advanced

### Q10. How would you prevent a specific package from being upgraded?

<details>
<summary>Answer</summary>

Hold it: `sudo apt-mark hold postgresql-16` (release with `apt-mark unhold`). For finer control, pin a version with a preferences file in `/etc/apt/preferences.d/`. On RHEL, `dnf versionlock`. Holding is used when an upgrade must be tested or scheduled first.

</details>

### Q11. A `dpkg -i app.deb` failed with dependency errors and now apt complains about broken packages. How do you recover?

<details>
<summary>Answer</summary>

Run `sudo apt -f install` (`--fix-broken`): apt downloads the missing dependencies and finishes configuring the package — or removes it if the dependencies cannot be met. In future, use `sudo apt install ./app.deb`, which resolves dependencies up front.

</details>

### Q12. Why is it risky to add third-party repositories?

<details>
<summary>Answer</summary>

Their packages run maintainer scripts as root and can replace system packages with their own versions, so the repository owner effectively gets root on your machine; a compromised or abandoned repository becomes a supply-chain risk, and mixing repositories can break dependencies. Mitigate by using official vendor repos only, scoping keys with `signed-by=`, pinning priorities, and preferring distribution packages or containers.

</details>
