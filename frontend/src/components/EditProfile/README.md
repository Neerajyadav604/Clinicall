EditProfile component

Design notes:
- Implements accessible, responsive form using Tailwind utility classes.
- Avatar upload uses an accessible hidden file input with preview.
- Form fields include client-side validation and clear error messages.

Rules & inspirations taken from repomix-output.xml (skills):
- `skills/frontend-design/SKILL.md`: bold aesthetic choices, CSS variables, and micro-interaction guidance influenced focus styles and visual tone.
- `skills/brand-guidelines/SKILL.md`: color and typography choices guided the neutral background and accent (`orange`) focus ring.
- `skills/frontend-design` and `skills/canvas-design`: emphasis on craftsmanship and spacing informed layout and breathing room.

Usage:
Import with `import EditProfile from 'src/components/EditProfile'` and provide `initial` and an async `onSave(payload)` handler that performs API upload/save. Avatar file is delivered as `avatarFile` in the payload.
