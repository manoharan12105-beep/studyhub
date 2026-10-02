---
name: study-content
description: Create, edit or review StudyHub study material — topic Markdown files (content.md, examples.md, interview-questions.md, practice.md, revision.md) and their metadata entries in any category (aptitude, DSA, CS concepts, or categories added later). Use whenever adding a topic, filling a template, writing questions, or checking content quality and consistency.
---

# Study Content

You are writing study material that must (1) teach a beginner from zero and (2) let the same person revise for an interview in minutes. Accuracy and clarity beat volume.

**Format rules live in [docs/content-guide.md](../../../docs/content-guide.md). Read it before writing.** This skill covers how to do the work well. For DSA topics, also use the `dsa` skill.

## Scope guard

- Only create topics the owner has named. If a request is vague ("add some sorting topics"), ask for the list instead of choosing.
- If the owner gives subtopics, they become H2/H3 sections of a topic, or separate topics — ask if it is unclear which.

## Workflow for a new topic

1. **Classify.** Choose `type`: `data-structure`, `algorithm`, `concept`, `aptitude`, or `reference`. Confirm the category/subcategory exists in `metadata/categories.json`; if not, ask before creating one.
2. **Check for overlap.** Search `metadata/topics/*.json` for an existing topic with the same subject. Extend it rather than duplicating.
3. **Plan sections.** Open the matching template in `templates/lesson/`. Decide which sections teach something for *this* topic; drop the rest. Decide which companion files are worth having (a small concept may need only `content.md` + `interview-questions.md`).
4. **Write `content.md`** (see "Writing" below).
5. **Write companion files** (see "Questions" below). `revision.md` last — it summarises what you actually wrote.
6. **Add the metadata entry** to `metadata/topics/<category>.json` from `templates/metadata/topic.json`. Fill `description`, `difficulty`, `tags`, `estimatedMinutes`, `prerequisites`, `relatedTopics` honestly. `files` lists exactly what exists.
7. **Verify** with the checklist at the end. Set `status` to `published` only when it passes.

## Writing

- **Lead with the answer.** Each section's first sentence states the point; detail follows.
- **Progressive depth.** Plain-language intuition → precise definition → mechanism → edge cases → interview angle.
- **Every abstraction gets something concrete:** an example, a diagram, a table, or a dry run.
- **Short paragraphs** (≤ 4 sentences). Bullets for lists of parallel items, tables for comparisons, numbered lists for sequences.
- **Bold** only key terms on first definition. No exclamation marks, no "simply"/"just"/"obviously", no motivational filler.
- Define every term before using it, or link to the topic that defines it.
- Explain *why*, not only *what* — interviewers probe reasoning.
- Write in your own words. No copied text from books or websites.

### Adapting to the subject

| Subject kind | Emphasise |
|---|---|
| DSA | intuition, steps, Java, dry run, complexity with justification (use the `dsa` skill) |
| Theory (OS, networks, DBMS, …) | mechanism/flow, architecture, comparison tables, real-world examples, misconceptions |
| Commands/tools (`reference`) | syntax, options table, runnable examples with expected output, dangerous cases flagged with `> [!CAUTION]` |
| Aptitude | concept → formulas (every variable defined) → shortcuts with their limits → problem patterns → many fully worked examples |

## Questions

**Interview questions** (`interview-questions.md`)
- Mix: definitions, "why/how", comparisons, "what happens if", and (for DSA) coding.
- Answers are what a strong candidate would *say*: direct answer first, then justification, then example/code.
- Prefer questions actually asked in placement/technical interviews over trivia.

**Practice** (`practice.md`)
- Ordered easy → hard; each tagged `**Difficulty:**`.
- Each tests one idea from the lesson; never require knowledge the lesson does not cover (or link to the prerequisite).
- Hint reveals direction, not the answer. Answer includes the reasoning.
- Aptitude MCQs: four options, one correct, distractors based on real mistakes. Exception: reasoning formats that have a standard five-choice answer key (syllogisms, statement–conclusion/assumption, cause and effect, data sufficiency) use options A–E with the same key throughout the topic.

**Examples** (`examples.md`)
- Every step shown; no skipped arithmetic. Mention the faster method in a `> [!TIP]` where one exists.

**Numbering:** `Q`/`P`/`E` ids are append-only. When editing, add new questions at the end of their group with the next free number.

## Editing existing content

- Read the whole topic and its metadata first.
- Change only what was asked; preserve the owner's wording elsewhere.
- Keep ids, question numbers and section names stable.
- Update `updated` in metadata for meaningful changes; update `files` if you add or remove a file.
- If you spot an error outside the requested change, report it rather than silently rewriting.

## Verification checklist

- [ ] Facts, formulas and complexities checked; nothing stated with false confidence.
- [ ] All code compiles and stated outputs match real output (see `dsa` skill).
- [ ] One H1; sections match the template's names and order; no leftover `{{placeholders}}` or guidance comments.
- [ ] Every code fence has a language; every image has alt text and exists in `images/`.
- [ ] Relative links resolve.
- [ ] `<details>` blocks have blank lines inside so Markdown renders.
- [ ] `revision.md` (if present) stands alone and adds nothing new.
- [ ] Metadata: valid against the schema; `id` unique; referenced ids exist; `files` equals the folder contents; folder at the derived path.
