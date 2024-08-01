# Hooks Toolkit CLI

## Add .env Variables

Copy the `.env.sample` to `.env`.

Update the `HOOKS_COMPILE_HOST` variable.

## Global Usage (For Using as a CLI)

Install:

```bash
npm i -g hooks-toolkit-cli
```

Use:

You can initialize a new project by running:

```bash
hooks-toolkit-cli init
```
To build the contracts, run:

```bash
hooks-toolkit-cli compile contracts build
```

This will compile the `contracts` directory and output the WASM files into the `build` directory.

## SDK Usage (For Using as an SDK)

Install:

```bash
npm install hooks-toolkit-cli
```

Usage:

```javascript
import { buildDir } from "hooks-toolkit-cli";

const dirPath = "my/path/to/hooks/root/dir";
const outDir = "my/build/wasm/directory";
await buildDir(dirPath, outDir);
```

## Development / Deployment

### Build Repo

```bash
yarn run build
```

### Build Executable Package

```bash
pkg .
```

### Publish NPM Package

```bash
npm publish --access=public
```