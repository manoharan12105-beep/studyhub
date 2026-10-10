# Java Feature Branches, Meaningful Commits and Conflicts in Java Code — Interview Questions

## Beginner

### Q1. What makes a commit "meaningful" in a Java project?

**Style:** What

<details>
<summary>Answer</summary>

It contains one logical change together with its tests, compiles and passes the test suite, and has a message explaining what and why ("Add highest() to GradeCalculator"). Refactors, formatting and dependency bumps go in separate commits.

</details>

## Intermediate

### Q2. Two developers added different methods at the end of the same class and Git reports a conflict. How do you resolve it?

**Style:** Scenario

<details>
<summary>Answer</summary>

Keep both methods. Git often aligns the additions so the closing braces are shared outside the markers; rebuild each method completely, check brace balance and imports, run `git diff --check`, compile and run the tests, then `git add` and commit. Deleting the markers alone usually fails to compile.

</details>

### Q3. How do you handle conflicts in `import` statements?

**Style:** How

<details>
<summary>Answer</summary>

Keep the union of both import sets, remove duplicates, and let the IDE optimise imports; then compile. Import conflicts are mechanical, but unused or missing imports break the build, so the compiler confirms the result.

</details>

## Advanced

### Q4. A merge produced no conflicts but the Java build fails. What happened, and how would CI catch it?

**Style:** Debugging

<details>
<summary>Answer</summary>

A semantic conflict: changes on different lines are incompatible — e.g. one branch renamed a method another branch started calling, or changed a return type. Git merges text, not types. CI that builds the merge result of a pull request (or requires branches to be up to date before merging) catches it before it reaches `main`.

</details>
