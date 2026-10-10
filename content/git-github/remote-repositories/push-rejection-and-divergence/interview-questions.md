# Push Rejection, Divergence and Force-with-Lease — Interview Questions

## Beginner

### Q1. Why does Git reject a push?

**Style:** Why

<details>
<summary>Answer</summary>

Because the update isn't a fast-forward: the remote branch contains commits your branch doesn't, so moving it to your commit would discard them. Git refuses unless you force it.

</details>

### Q2. Your push was rejected with "fetch first". What do you do?

**Style:** How

<details>
<summary>Answer</summary>

`git fetch`, inspect the incoming commits (`git log main..origin/main`), integrate them with `git pull --rebase` or a merge, resolve any conflicts, run the tests, then `git push`.

</details>

## Intermediate

### Q3. What is the difference between `--force` and `--force-with-lease`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`--force` replaces the remote branch unconditionally. `--force-with-lease` replaces it only if it still points where your remote-tracking branch says, so if someone pushed since your last fetch the push is rejected as "stale info" instead of erasing their commits.

</details>

### Q4. What does "diverged" mean in `git status`?

**Style:** What

<details>
<summary>Answer</summary>

Your branch and its upstream each have commits the other doesn't ("have 1 and 1 different commits each"). You must integrate — rebase your commits on top of the upstream or merge — before a normal push can succeed.

</details>

## Advanced

### Q5. When can `--force-with-lease` still overwrite a teammate's work?

**Style:** Trap

<details>
<summary>Answer</summary>

When your remote-tracking ref was refreshed by a fetch you didn't act on — for example an IDE's background fetch. The lease then matches the remote (including the teammate's commit), and your push replaces it. Pin the expected commit (`--force-with-lease=<branch>:<sha>`) or add `--force-if-includes`, which requires that the remote tip is part of your local branch's history.

</details>

### Q6. How would you prevent force pushes to `main` entirely?

**Style:** Scenario

<details>
<summary>Answer</summary>

On the server, not the client: GitHub branch protection rules or rulesets on `main` that block force pushes and deletions, require pull requests and passing checks. Client habits (`--force-with-lease`, aliases) help, but only server-side rules are enforced for everyone.

</details>
