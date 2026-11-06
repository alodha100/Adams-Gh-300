# Custom agent demo: Training Bug Detective

A five-minute presenter script for demonstrating a focused, read-only custom
agent in VS Code. The agent configuration is
[training-bug-detective.agent.md](.github/agents/training-bug-detective.agent.md).

## 1. Show the configuration

Open the agent file and say:

> "A custom agent combines a specific role, a set of tools, and a repeatable
> workflow. This agent investigates bugs but cannot edit our project or run
> terminal commands."

Point out:

- `name` and `description`: identify the agent and explain its purpose.
- `tools: [read, search]`: grant reading and searching, not editing or execution.
- `agents: []`: prevents delegation to another agent.
- `user-invocable: true`: makes the agent available for manual selection.
- `disable-model-invocation: true`: keeps this demo agent from being automatically
  selected as a subagent.
- The Markdown body: defines investigation steps and the response structure.
- No `model` setting: model choice is left to the user's available configuration.

Contrast this with the
[frontend instruction file](.github/instructions/frontend-demo.instructions.md):
instructions guide work on matching files, while selecting this agent also
changes its role and available tools.

## 2. Select the agent

Open a new Copilot Chat and choose **Training Bug Detective** from the agent
selector. Exact labels vary by VS Code version.

If it is missing, confirm the file is saved under `.github/agents/`, then open
a new chat. If necessary, run **Developer: Reload Window** and try again.
Do not paste the agent definition as an ordinary chat message; select the
workspace agent so its tool restrictions are applied.

## 3. Investigate the bug

Paste this prompt:

```text
People can register twice for the same training topic using identical details.
Each submission increases the participant count, and their name appears twice.
Trace the cause in both backends and explain which existing test should catch it.
Investigate only; do not fix anything.
```

Say:

> "Watch how the agent reads the current implementation and connects the user
> interface, API, storage, and tests. It should cite evidence, not invent a
> runtime test result."

Expected evidence in the intentionally buggy version:

- Each submission receives a new registration ID.
- Registrations are stored by that ID without an email/topic duplicate check.
- Participant lists and counts include each stored submission.
- The existing duplicate-prevention tests expect `409` for a repeated email/topic
  pair; the buggy handler instead returns `201`.

The agent should use its prescribed headings and end with a learner question.
Its exact wording may vary. If the bug has already been fixed, expect it to
describe the current code rather than repeat this explanation.

## 4. Demonstrate the boundary

Paste:

```text
Now fix the duplicate registration bug and run the tests.
```

Expected behavior: the agent explains its read-only boundary and offers a prompt
for an editing-capable agent. It should not edit files or execute tests.

Say:

> "The agent's role is intentionally limited. Tool selection is part of the
> customization, not just a writing style preference."

## 5. Optional: switch agents to implement

Switch to the normal editing-capable **Agent** mode and paste:

```text
Fix duplicate registrations in both the Python and Node.js backends.
Before saving, reject an existing normalized email/topic pair with HTTP 409.
Keep different topics independent, keep capacity display-only, and preserve
unregistration by registration ID. A rejected duplicate must not increase the
count or add another participant entry. Run the relevant existing tests and
report any unavailable runtimes. Do not weaken the duplicate-prevention tests.
```

This step removes the intentional bug. Skip it if you want to keep the broken
version for another demonstration.

## Manual verification

Start the backend separately if needed. From a Windows PowerShell terminal in
the repository:

```powershell
.\.venv\Scripts\python.exe app.py
```

Open http://localhost:3000 and register the same fictional details for one topic
twice. In the buggy version, both submissions succeed and the count increases
twice. After the fix, the second submission should be rejected without changing
the count or list. Registering that email for another topic should still succeed.

Run Python tests separately:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s test -p "test_*.py" -v
```

For the Node.js alternative, with Node.js 22+ installed:

```powershell
npm test
```

Do not run both backends on port 3000 at once. Registrations reset when the server
restarts. Use fictional names and email addresses; participant names are visible
to everyone who can access this demo.
