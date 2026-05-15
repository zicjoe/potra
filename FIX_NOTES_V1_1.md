# Potra Replacement v1.1

This patch fixes the Vite/Tailwind startup error:

```text
Can't resolve 'tw-animate-css' in src/styles
```

## What changed

- Added `tw-animate-css` to frontend dependencies.
- Kept the existing Vite structure.
- No UI redesign.
- No styling change intended.

## Why

The generated shadcn/Tailwind v4 components use animation utilities such as `animate-in`, `fade-in-0`, `zoom-in-95`, and related Radix state animations. The CSS file already imports `tw-animate-css`, but the package was missing from `package.json`.
