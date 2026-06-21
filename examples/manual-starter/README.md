# Manual Starter Example

This example mirrors the bilingual tutorial in `docs/manual`.

## What it demonstrates

- create an `Engine` with `H5Platform`
- enter a custom `Scene`
- spawn clickable visual elements through `Input`
- render a simple HUD
- emit module logs with `Logger`

## Quick run

Build the example with the repository script:

```bash
npm run example:build
```

The output is written to `dist/examples/manual-starter`.

You can still bundle it manually with esbuild if needed:

```bash
npx esbuild examples/manual-starter/src/main.ts --bundle --outfile=examples/manual-starter/dist/main.js --format=iife --platform=browser --define:__DEV__=true --define:__APP_ENV__='\"development\"'
```

Then serve the repository root with any static file server and open `dist/examples/manual-starter/index.html`.

## Files

- `src/main.ts`: engine bootstrap
- `src/StarterScene.ts`: sample scene logic
- `index.html`: browser shell
