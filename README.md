# Hooks Toolkit CLI

## Add .env Variables

Copy the `.env.sample` to `.env`.

Update the `HOOKS_COMPILE_HOST` variable.

## Global Usage (For Using as a CLI)

Install:

```bash
npm i -g @transia/hooks-toolkit-cli
```

Use:

You can initialize a new project by running:

```bash
hooks-toolkit-cli init
```

To build the c contracts, run:

```bash
hooks-toolkit-cli compile-c contracts build
```

This will compile the `contracts` directory and output the `.wasm` files into the `build` directory.

To build the js contracts, run:

```bash
hooks-toolkit-cli compile-js contracts/base.ts build
```

This will compile the `base.ts` file and output the `.bc` file into the `build` directory.

To listen to the debug stream, run:

```bash
hooks-toolkit-cli debug "Account 1" rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn
```

## SDK Usage (For Using as an SDK)

Install:

```bash
npm install @transia/hooks-toolkit-cli
```

Usage:

```javascript
import { buildDir } from "@transia/hooks-toolkit-cli";

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