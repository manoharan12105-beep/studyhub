# DevOps Fundamentals — Interview Questions

## Beginner

### Q1. What is DevOps?

**Style:** What

<details>
<summary>Answer</summary>

DevOps is a culture and set of practices in which the team that develops a service also builds, releases and operates it, with the delivery steps automated. Its goal is to deliver changes quickly *and* safely: small changes, automated builds and tests, repeatable deployments, and monitoring that feeds back into development. It is not a single tool or only a job title.

</details>

### Q2. What is the difference between CI, continuous delivery and continuous deployment?

**Style:** Comparison

<details>
<summary>Answer</summary>

- **Continuous Integration:** every change is merged frequently and automatically built and tested.
- **Continuous Delivery:** the pipeline also produces a release artifact that is always ready to deploy; going to production is a manual decision (a button or approval).
- **Continuous Deployment:** every change that passes the pipeline is deployed to production automatically, with no manual step.

</details>

### Q3. Why are small, frequent releases considered safer than large, rare ones?

**Style:** Why

<details>
<summary>Answer</summary>

A small change is easier to review and test, and when it breaks something the cause is obvious and the rollback is small. A large release mixes many changes, so a failure is hard to locate, and rolling back removes many unrelated features. Frequent releases also keep the deployment process practised and automated.

</details>

### Q4. Name the typical environments and what each is for.

**Style:** What

<details>
<summary>Answer</summary>

Development (a developer's machine, fake data), testing/CI (automated tests on every change, throwaway data), staging (a production-like rehearsal with realistic data and no real users) and production (real users and real data). The same build moves through them; only configuration differs.

</details>

## Intermediate

### Q5. What does "immutable infrastructure" mean, and how does Docker help?

**Style:** How

<details>
<summary>Answer</summary>

Once an artifact or server is built it is never modified in place; a change means building a new version and replacing the old one. Docker images fit this: an image tag such as `taskapi:4f2c1a9` always contains the same files, so you deploy by replacing the container with one from a new image, and roll back by running the previous tag. Nobody edits files inside a running container.

</details>

### Q6. Why should the same artifact be deployed to staging and production instead of rebuilding for each?

**Style:** Why

<details>
<summary>Answer</summary>

Rebuilding can produce a different artifact (different dependency versions, base image updates, build machine differences), so production would run something that was never tested. Building once and promoting the same image guarantees that what passed the tests is exactly what runs. Environment differences belong in configuration (environment variables, secrets), not in the artifact.

</details>

### Q7. What is the difference between deploying infrastructure and deploying an application?

**Style:** Comparison

<details>
<summary>Answer</summary>

Infrastructure is what the application runs on — servers, networks, firewall rules, DNS, managed databases — and changes rarely. The application is the code artifact (a JAR or image) and changes often. They have different tools and risks: infrastructure can be described as code (Terraform, Ansible), while applications are delivered by CI/CD pipelines that build, test and release images.

</details>

### Q8. A team says "we do DevOps — we bought a CI tool". What is missing?

**Style:** Trap

<details>
<summary>Answer</summary>

A tool alone is not DevOps. Questions to ask: do developers own their service in production? Are builds, tests and deployments automated end to end? Are releases small and frequent? Is there monitoring and a feedback loop into planning? Are deployments repeatable and reversible? Without those practices, a CI server just runs the same manual habits faster.

</details>

## Advanced

### Q9. Continuous deployment is risky for a payments service. How can you still release often?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Use continuous *delivery*: every change is built, tested and packaged automatically, but production deployment needs an approval (a protected environment in GitHub Actions). Reduce risk further with a staging environment, automated health checks after deployment, fast rollback to the previous image, and feature flags so code can be deployed while the feature stays off.

</details>

### Q10. Walk me through what happens from `git push` to a live change in your project.

**Style:** Architecture

<details>
<summary>Answer</summary>

Push → GitHub Actions checks out the code, sets up JDK 21 and runs `mvn verify` against a PostgreSQL service container → on `main`, it builds a Docker image tagged with the commit SHA and pushes it to the container registry → a deploy job SSHes to the VPS and runs a deploy script that sets the new tag, runs `docker compose pull` and `docker compose up -d` → the script polls `/actuator/health/readiness` and rolls back to the previous tag if the service is not healthy → Nginx keeps serving HTTPS traffic to the container, and logs plus an uptime check watch the result.

</details>
