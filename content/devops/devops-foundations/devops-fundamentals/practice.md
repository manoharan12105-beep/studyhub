# DevOps Fundamentals — Practice

### P1. Which practice?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** CI vs CD

Every push to `main` is built and tested, and if everything passes it is deployed to production with no human step. What is this?

- A) Continuous Integration only
- B) Continuous Delivery
- C) Continuous Deployment
- D) Manual release management

<details>
<summary>Answer</summary>

**Answer:** C) Continuous Deployment

**Explanation:** Continuous delivery would stop before production and wait for an approval. Removing that manual step makes it continuous deployment.

</details>

### P2. Same image everywhere

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** environment separation

What should differ between the staging and production deployments of the same release?

- A) The Docker image
- B) The Java version
- C) The configuration (database URL, credentials, log level)
- D) The source code branch

<details>
<summary>Answer</summary>

**Answer:** C) The configuration (database URL, credentials, log level)

**Explanation:** One immutable image is promoted through environments; only configuration changes.

</details>

### P3. Mutable or immutable?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** immutable infrastructure

A developer fixes a typo by running `docker exec` into the production container and editing a file. What principle is broken?

- A) Least privilege
- B) Immutable infrastructure
- C) Continuous integration
- D) Environment variables

<details>
<summary>Answer</summary>

**Answer:** B) Immutable infrastructure

**Explanation:** The fix lives only in that container. The next deployment (or a restart from the image) loses it, and the image no longer describes what runs. Fix the code, build a new image and deploy it.

</details>

### P4. Map the lifecycle

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** DevOps lifecycle

Put these in lifecycle order: deploy, test, monitor, code, build, release.

<details>
<summary>Answer</summary>

code → build → test → release → deploy → monitor (and monitoring feeds the next plan).

</details>

### P5. Where does it belong?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** infrastructure vs application

Classify each change as *infrastructure* or *application*: (a) a new REST endpoint, (b) opening port 443 in the firewall, (c) a new DNS A record, (d) upgrading Spring Boot, (e) adding swap space to the server.

<details>
<summary>Answer</summary>

Application: (a), (d). Infrastructure: (b), (c), (e).

</details>

### P6. Choose the release style

**Difficulty:** Medium · **Type:** Decision · **Concepts:** continuous delivery vs deployment

A college project API is used only by the team; a hospital appointment API is used by patients. Which release style fits each, and why?

<details>
<summary>Answer</summary>

College project: continuous deployment is fine — failures are cheap and fast feedback helps. Hospital API: continuous delivery with a manual approval (and staging) — every change is still automatically built, tested and packaged, but a person decides when it reaches patients, and rollback is ready.

</details>

### P7. Spot the risk

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** build once

The pipeline builds the JAR and image for staging, then rebuilds both from the same commit for production a week later. What can go wrong?

<details>
<summary>Answer</summary>

The second build can differ: a newer base image, a changed snapshot dependency, or a different build environment. Production then runs an artifact that was never tested in staging. Build the image once, tag it with the commit SHA, and promote that exact tag.

</details>

### P8. Is it DevOps?

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** culture, feedback loop

A company has a CI server and a separate operations team that deploys every two months from a 40-step Word document. Developers never see production logs. List three changes that would move them towards DevOps.

<details>
<summary>Answer</summary>

Any three of: automate the 40 steps into a pipeline (scripts in Git); release small changes frequently instead of every two months; give developers ownership of and access to production logs, metrics and alerts; add automated tests that gate deployments; make deployments repeatable and reversible (versioned images, rollback); hold blameless reviews of incidents and feed them into planning.

</details>
