# Writing Git Hooks — Interview Questions

## Beginner

### Q1. Give an example of a useful pre-commit hook.

**Style:** Scenario

<details>
<summary>Answer</summary>

One that inspects only the staged, added lines (`git diff --cached -U0`) and blocks the commit if they contain debug output like `System.out.println("DEBUG…")`, conflict markers or likely hard-coded secrets — printing why, so the developer can fix it immediately.

</details>

## Intermediate

### Q2. Why should a pre-commit hook inspect `git diff --cached` rather than the files on disk?

**Style:** Why

<details>
<summary>Answer</summary>

The commit contains the staged (index) version, which can differ from the working copy (partially staged files, `MM`). Checking files on disk could block a clean commit or miss a problem in what's actually being committed.

</details>

### Q3. How does a `pre-push` hook know which branch is being pushed?

**Style:** How

<details>
<summary>Answer</summary>

Git writes one line per ref to the hook's standard input: local ref, local commit id, remote ref, remote commit id. The hook reads them (`while read local_ref local_sha remote_ref remote_sha`) and can reject, for example, when the remote ref is `refs/heads/main`. The remote name and URL are passed as arguments.

</details>

## Advanced

### Q4. A teammate says the secret-scanning pre-commit hook makes the repository safe. Do you agree?

**Style:** Trap

<details>
<summary>Answer</summary>

No. The hook is skippable (`--no-verify`), not installed in every clone, and pattern-based (it misses formats and has false positives). It reduces accidents; it doesn't prevent leaks. Server-side push protection, secret scanning, CI checks and — above all — keeping secrets out of the code are what make it safer, and leaked secrets must still be rotated.

</details>
