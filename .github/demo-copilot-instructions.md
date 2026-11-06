# Project Description

This project is a small full-stack training registration website for
Telstra's GH-300 GitHub Copilot training.

Learners can browse training topics and submit fictional registration
details. The website supports demonstrations of code explanation,
debugging, testing, frontend improvements, and agent customization.

The recommended backend is Python with FastAPI. An alternative Node.js
backend serves the same frontend and API. There is no frontend build step.

This is a teaching demo, not a production registration service.
Registrations are stored in memory and disappear when the server restarts.
No email is sent and no real training place is reserved.

## Project Structure

Paths below are relative to this instruction file.

- [public/](../public/): Shared frontend using plain HTML, CSS, and JavaScript.
  - [index.html](../public/index.html): Main page and registration form.
  - [styles.css](../public/styles.css): Shared styling and responsive layouts.
  - [app.js](../public/app.js): Loads topics, renders cards, submits
    registrations, and refreshes displayed counts.
- [app.py](../app.py): Python FastAPI backend, API validation,
  in-memory registrations, and local development entry point.
- [server.js](../server.js): Alternative Node.js HTTP backend.
- [topics.json](../topics.json): Training catalogue shared by both backends.
- [topics.js](../topics.js): Loads the catalogue for Node.js.
- [requirements.txt](../requirements.txt): Python runtime dependencies.
- [requirements-dev.txt](../requirements-dev.txt): Python test dependencies.
- [package.json](../package.json): Node.js commands and runtime requirements.
- [test/](../test/): Python and Node.js API and static-file tests.
- [.devcontainer/devcontainer.json](../.devcontainer/devcontainer.json):
  GitHub Codespaces configuration.
- [README.md](../README.md): Setup instructions, API behavior, and demo notes.

Verify the current checkout before assuming that optional demo features
or endpoints exist.

## Project Guidelines

- Inspect existing code before making changes. Keep changes focused on
  the requested task and avoid unrelated refactoring.
- Preserve the plain HTML, CSS, and JavaScript frontend. Do not introduce
  frameworks, build tools, or dependencies unless the task requires them.
- Maintain consistent API behavior across both backends when changing
  shared functionality.
- Match the existing blue palette, rounded cards, spacing, and typography.
- Keep layouts usable on desktop and narrow mobile screens.
- Use semantic HTML, labeled controls, visible keyboard focus, and
  meaningful accessible names for icon-only buttons.
- Render participant names and other user input with textContent,
  not innerHTML.
- Show clear loading, empty, success, and error states.
- Use descriptive names that follow existing conventions.
- Keep topic data valid JSON with unique IDs and the fields expected
  by the frontend: id, title, description, and duration.
- Restart the backend after editing topics.json; the catalogue is loaded
  at startup.
- Do not hardcode the number of topics in new logic or tests.
- Never commit secrets or use real employee details in examples or tests.

## Demo Behavior

- Preserve the intentional duplicate-registration bug unless explicitly
  asked to fix it. Repeated submissions currently create separate
  registrations and increase the topic count.
- Do not weaken duplicate-prevention tests to make the intentional bug pass.
- Keep the displayed capacity of 30 people informational unless explicitly
  asked to enforce a registration limit.
- Do not introduce authentication, persistent storage, email delivery,
  or external integrations without an explicit request.
- Explain demo limitations rather than presenting the application as
  production-ready.

## Educational Standards

When generating training content, examples, or explanations:

- **Learning-focused**: State clear objectives and connect exercises to
  practical GitHub Copilot workflows.
- **Learner-friendly**: Use clear, encouraging language and explain
  unfamiliar terminology.
- **Practical**: Use this application's topic catalogue, registration flow,
  and tests for realistic demonstrations.
- **Reproducible**: Provide prerequisites, steps, expected results, and
  measurable completion criteria.
- **Evidence-based**: Distinguish observed behavior from assumptions.
  Never claim a test ran when only its source was inspected.
- **Responsible**: Use fictional data and emphasize human review,
  verification, privacy, and appropriate tool permissions.
- **Accurate**: Treat the training catalogue as sample content, not an
  official GH-300 exam syllabus.

## Validation

- Use existing tests and commands rather than adding new tooling by default.
- Run focused tests for changed behavior, then expand coverage as needed.
- For shared API changes, validate both backends when runtimes are available.
- Python tests on Windows:
  .\.venv\Scripts\python.exe -m unittest discover -s test -p "test_*.py" -v
- Node.js tests:
  npm test
- For frontend changes, verify the affected flow, error states,
  keyboard access, and narrow-screen layout.
- Report what was checked, the results, and any unavailable runtimes.
- Distinguish expected failures from the intentional teaching bug
  from newly introduced regressions.