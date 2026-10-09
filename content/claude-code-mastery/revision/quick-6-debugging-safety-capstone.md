# Block 6: Debugging, Safety and Capstone

## Debugging Method

Symptom → evidence (trace, test, log, plan, count, bisect) → one hypothesis → failing test → fix the cause → full build → review the test diff.

## Stack Trace Reading

1. Exception type + message (helpful NPE: `Cannot invoke "String.trim()" because "discountCode" is null`).
2. First frame in your package (`PriceCalculator.java:14`).
3. Callers below it; last `Caused by:` for the root cause.

## orderdesk Scenarios

| Scenario | Evidence | Fix |
|----------|----------|-----|
| NPE (BUG-101) | Trace at `PriceCalculator.java:14` | Null/blank code → no discount |
| Stored row after 500 | 1 row after failed create | `@Transactional` on `create()` → 0 rows |
| 404 on `/pay` | `NoResourceFoundException: No static resource …` | Endpoint missing in that build |
| Injection (SEC-3) | `[1,2]` for `x' OR '1'='1` | `?` parameter + regression test with stored rows |
| Rounding regression | `expected: <900> but was: <899>`; bisect → `Math.round` commit | Integer division |
| Startup failure | `missing column [paid_at] in table [orders]` | New `V2__add_paid_at.sql`; never edit V1 |
| Lost updates | `HashMap` count ≪ 200000 | `ConcurrentHashMap.merge` / atomic DB update |

## Verifying AI Changes

- Evidence over plausibility: real output, red→green tests, the whole diff.
- Watch for: invented APIs/config keys, tests that test mocks, weakened tests, scope creep, "should work".

## Safety Essentials

- Secrets: deny reads, never paste, rotate if leaked.
- Humans: commit, push, merge, deploy.
- Layers: instructions → permissions → hooks → sandbox → CI → branch protection → review. None alone is a guarantee.
- Automation: explicit modes, limits, exit code + `is_error`, read-only AI steps.

## Capstone Rubric (32 points)

Reproduction · Correctness · Test integrity · Security · Scope · Guardrails · Review · Communication — 4 points each. Automatic "weak": weakened test, edited applied migration, secret in a file or prompt, unreviewed commit/push.

## Self-Check

- Fix BUG-101 but forget the stored row? → Reproduce every symptom in the issue.
- SEC-3 test passes before the fix? → It has no stored rows to expose.
- Claude says "all tests pass"? → Show me the `Tests run:` line.
