---
name: "Training Demo Frontend"
description: "Use when editing the training website frontend, topic cards, participant lists, registration forms, or responsive styles."
applyTo: "public/**"
---

# Training website frontend

## Design and implementation

- Use plain HTML, CSS, and JavaScript. Do not introduce a frontend framework,
  external icon library, or build step.
- Match the existing blue palette, rounded cards, subtle borders, and spacing.
- Keep layouts responsive and check narrow screens for horizontal overflow.
- Use semantic HTML and keyboard-accessible controls. Give icon-only buttons
  meaningful accessible names and use `type="button"` inside forms unless
  the button is intended to submit the form.
- Render participant names and other user input with `textContent`, not `innerHTML`.
- Show clear loading, empty, success, and error states. Do not hide request failures.
- Preserve unsubmitted form details and topic selection when refreshing lists.

## Demo behavior

- Use fictional participant details. Never display participant email addresses.
- Preserve the intentional duplicate-registration bug unless explicitly asked to
  fix it: repeated signups should remain visible as separate participant entries.
- Keep the 30-person capacity display-only unless explicitly asked to enforce it.

## Response format

After frontend changes, finish with a short **Demo check** section describing
one browser action the trainer can perform and the visible result to expect.
