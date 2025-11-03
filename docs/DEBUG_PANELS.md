# Debug Panels: How to enable/disable

By default, debug panels render only in development. In production builds they are hidden unless explicitly enabled.

## Ways to enable in a prod build

- Build-time env flag: set VITE_DEBUG_PANELS=true
- Runtime query param: add ?debug=1 to the URL
- Runtime localStorage: set localStorage.setItem('debug_panels','1') in the devtools console

## Examples

1) Build with debug panels enabled:

   VITE_DEBUG_PANELS=true bun run build

2) Temporarily enable via URL:

   https://yourapp.example.com/?debug=1

3) Toggle via browser console:

   localStorage.setItem('debug_panels','1')

Remove with:

   localStorage.removeItem('debug_panels')
