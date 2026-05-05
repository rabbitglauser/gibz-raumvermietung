---
name: add-frontend-component
description: Use when creating a new React component in the Next.js frontend. Picks the correct atomic-design tier (atoms / molecules / organisms / templates) and matches the existing file conventions under frontend/src/components/.
---

# Add a frontend component

## When to use

- "Create a component", "add a card / button / form", "make a new page section"
- Any new `.tsx` file under `frontend/src/components/`

## Pick the tier

| Tier | What lives here | Existing examples |
|---|---|---|
| **atoms** | Primitive UI: typography, single-purpose buttons, icons, code blocks. No app state, no other components. | `Heading.tsx`, `Text.tsx`, `CodeBlock.tsx` |
| **molecules** | Small composites of atoms (and primitives only). One clear purpose. | `StatusCard.tsx` |
| **organisms** | Multi-molecule sections — a navbar, a reservation form, a results panel. May own local state. | *(empty — populate when first organism is added)* |
| **templates** | Page-level layout shells. No domain content. | `PageContainer.tsx` |

If you find yourself reaching across tiers (e.g. an atom importing a molecule), the component is in the wrong tier.

## Steps

1. **Pick the tier** using the table above. If unsure, ask: does this compose other components? → at least molecule. Does it own state or fetch data? → organism.
2. **Create** `frontend/src/components/{tier}/{ComponentName}.tsx`. PascalCase filename, default export.
3. **Re-export from** `frontend/src/components/{tier}/index.ts` (every tier already has one — follow the existing pattern). This is what consumers import from.
4. **Use Tailwind v4 utility classes**, not CSS modules. Match the styling vocabulary of existing siblings.
5. **Server vs client.** Default to server components. Add `"use client"` only when you need state, effects, or browser APIs. `app/page.tsx` is the canonical server-component example.

## Why this matters

CLAUDE.md, Architecture notes: *"Components are organized by atomic design even though the population is small — keep new UI in the appropriate tier."* Misplacing a component (e.g. putting a stateful organism in `atoms/`) breaks the dependency direction and makes future refactors harder.

## Reference

- Atoms: `frontend/src/components/atoms/`
- Molecules: `frontend/src/components/molecules/`
- Templates: `frontend/src/components/templates/PageContainer.tsx`
- Page using these: `frontend/src/app/page.tsx`
- API client (for organisms that fetch): `frontend/src/lib/api.ts`
