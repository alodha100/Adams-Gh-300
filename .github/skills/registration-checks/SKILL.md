---
name: registration-checks
description: "Use when verifying training registration behavior, reproducing duplicate signups, checking email normalization, topic independence, participant counts, or registration regression tests without fixing code."
user-invocable: true
disable-model-invocation: false
---

# Registration checks

Use this repeatable workflow to investigate the Telstra training demo and report
evidence. This skill supplies a procedure, not additional tools or permissions.

## Boundaries

- Do not modify application code, tests, dependencies, or documentation.
- Do not fix the intentional duplicate-signup bug or weaken test expectations.
- Do not install packages, commit, push, restart servers, or reset live storage.
- Use fictional details only. Do not include real participant data in reports.
- Respect the active agent's restrictions. If execution is unavailable, inspect
  source and suggest commands, clearly marking them as not run.

## Procedure

### 1. Inspect the current checkout

Read the relevant registration handlers and topic-count logic in `app.py` and
`server.js`, the frontend request in `public/app.js`, and the corresponding tests.
Check `README.md` and `package.json` for current setup and demo behavior.
Do not assume optional participant lists or unregister endpoints exist.

Identify:

- How email is normalized and how a topic is matched.
- Whether a duplicate check runs before storage is changed.
- What identifies a stored registration and how topic counts are computed.
- Whether an intentional bug is documented in this checkout.

### 2. Select the checks

Use the [reference checklist](./references/checklist.md) to choose cases for the
reported symptom. Keep unrelated checks out of scope.

Locate existing tests before choosing commands. The commands below apply when
their named tests still exist. From the repository root in Windows PowerShell:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s test -p test_app.py -k test_register_normalize_and_prevent_duplicates -k test_topic_registration_counts_are_display_only -v
```

With Node.js 22+ available:

```powershell
node --test --test-name-pattern="prevents duplicate|per-topic registration counts" test\server.test.js
```

### 3. Execute only available, permitted checks

Check the selected runtime is installed before executing the focused tests.
If a runtime or dependency is missing, report the blocker; do not install it.
These tests use isolated test storage rather than the running demo server.

Record command, result, and relevant assertions. A known intentional failure is
still a failure, not a pass. If a test fails early, later assertions in that test
were not exercised. Do not claim coverage or execution beyond the evidence.

### 4. Optionally verify browser behavior

Use browser tools only if available and the trainer confirms the target is a
disposable demo server on which synthetic signups may be created.
Do not infer permission from an open browser tab or start a server automatically.

Use a unique fictional email for the run and follow the selected checklist cases.
Compare counts before and after each request; do not assume they start at zero.
If optional unregister support exists, remove only registrations created by this
run, using their individual IDs. Otherwise report remaining synthetic records.
Do not erase other participants or reset the server to clean up.

### 5. Report without implementing

Use this structure:

1. **Scope:** checkout/backend and checks selected.
2. **Evidence:** relevant file links, actual commands run, and request/browser
   observations. Keep source inspection separate from execution.
3. **Results:** a table with case, expected behavior, actual behavior, and
   PASS / FAIL / NOT RUN / NOT APPLICABLE.
4. **Diagnosis:** confirmed cause versus unresolved hypotheses; identify the
   intentional demo bug only if supported by the current checkout.
5. **Next step:** suggest a minimal correction or missing check, without applying
   it. Explain that implementation needs a separate request and suitable tools.
