# Boundary Rules

- UI components may not access window, location, or navigator directly.
- UI components must not perform data calculations; use domain or lib.
- Hooks may use browser APIs, but must not import UI components.
- Domain modules must be pure and must not import React.
- Lib modules must be pure and must not import hooks or domain.
- App may compose hooks, domain, and components, but should not duplicate calculations.
- Config modules (if added) may be read by upper layers only.
- Chart data shaping belongs in domain or hooks, not UI components.
- Stylesheets must not import JavaScript.
- No module should import from dist or public.

## ESLint suggestions

- import/no-cycle
- import/no-restricted-paths
- boundaries
- react-hooks/rules-of-hooks
- no-restricted-globals
