# Registration verification checklist

## Expected behavior versus teaching bug

Correct duplicate detection uses normalized email plus topic ID, not name.
The documented teaching bug accepts repeated submissions with new registration
IDs. Verify the current implementation before claiming that bug is present.

| Case | Expected corrected behavior | Possible teaching-bug observation |
|---|---|---|
| First valid signup | HTTP 201; selected topic count increases by one | Same |
| Identical email/topic repeated | HTTP 409; storage, count, and any list unchanged | HTTP 201; separately stored signup increases count |
| Email casing and surrounding spaces changed | Still HTTP 409 for the same normalized email/topic | Repeated signup accepted despite normalization |
| Same email, different available topic | HTTP 201; only the other topic's count increases | Same; may be untested if a preceding assertion failed |
| Invalid email, empty name, or unknown topic | HTTP 400; no stored signup or count change | Inspect and test; do not infer from the duplicate bug |
| Independent topic counts | Unrelated topic counts remain unchanged | Same unless another defect is found |
| More than 30 unique signups | Allowed while capacity remains display-only | Same; do not introduce enforcement during verification |
| Participant list, if present | Count agrees with entries; email is not displayed | Repeated names can appear for separate signup IDs |
| Unregister, if present | Removes exactly the selected signup; decrements its topic count | A second duplicate remains until separately removed |
| Unknown/already removed signup, if supported | Explicit not-found response; no other record removed | Verify the implemented endpoint contract |

For corrected duplicate behavior, first establish a successful signup with a
unique fictional email. Test the repeat and normalized variant against that same
signup, without restarting or resetting storage between them.

## Existing test limitations

- The duplicate-prevention test may check normalization, duplicate rejection,
  and different-topic signup sequentially. Failure at duplicate rejection means
  later assertions did not run.
- A count test using unique emails does not prove duplicates leave counts unchanged.
- A source-level expectation is not a recorded test result.
- Do not add or rewrite tests as part of this verification-only skill; recommend
  missing regression assertions for a separate implementation task.

## Trainer demonstration

### Explicit invocation

In a supporting chat client, type `/registration-checks` and select the skill.
If it is not listed, start a new chat or reload the VS Code window and check the
workspace skill path. Availability depends on client support and configuration.

Example request:

```text
/registration-checks Verify duplicate signups and topic counts in both backends.
Run existing focused tests if permitted. Do not fix anything or use the browser.
```

### Task-based discovery

Start a new chat without explicitly attaching the skill:

```text
Verify this training app's duplicate signups, email normalization, and registration
counts using existing regression tests. Report evidence without changing code.
```

Check whether the client reports loading the skill; a matching request is not a
guarantee that every client will select it automatically.

### Explain progressive loading

1. The skill's name and description make its purpose discoverable.
2. When selected, the agent reads the workflow in `SKILL.md`.
3. This checklist is a supporting reference read when the procedure needs it.

Contrast the customizations:

- **Instructions:** project or file-level rules for work.
- **Agent:** a role with configured tools and boundaries.
- **Skill:** a repeatable procedure, usable only with the tools the agent has.

With a read-only agent, demonstrate source evidence and NOT RUN results.
With an execution-capable agent, demonstrate actual focused test output.
Neither should claim a passing result for the intentional duplicate bug.
