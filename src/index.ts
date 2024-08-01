#!/usr/bin/env node

import { Command } from "commander";
import { buildFile } from "./js2wasm/build";
import { mkdir, statSync } from "fs";
import * as esbuild from "esbuild";
import * as fs from "fs";
import * as path from "path";

const copyFiles = (source: string, destination: string) => {
  fs.readdirSync(source).forEach((file) => {
    const srcFile = path.join(source, file);
    const destFile = path.join(destination, file);

    if (fs.statSync(srcFile).isDirectory()) {
      fs.mkdirSync(destFile, { recursive: true });
      copyFiles(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  });
};

const clean = (filePath: string, outputPath?: string): string => {
  const tsCode = fs.readFileSync(filePath, "utf-8");
  const importPattern = /^\s*import\s+.*?;\s*$/gm;
  const exportPattern = /^\s*export\s*\{[^}]*\};?\s*$/gm;
  const commentPattern = /^\s*\/\/.*$/gm;
  let cleanedCode = tsCode.replace(importPattern, "");
  cleanedCode = cleanedCode.replace(exportPattern, "");
  cleanedCode = cleanedCode.replace(commentPattern, "");
  cleanedCode = cleanedCode.trim();
  if (outputPath) {
    fs.writeFileSync(outputPath, cleanedCode, "utf-8");
  }
  return cleanedCode;
};

const initCommand = async (type: 'c' | 'js', folderName: string) => {
  const templateDir = path.join(__dirname, 'init');
  const newProjectDir = path.join(process.cwd(), folderName);

  if (fs.existsSync(newProjectDir)) {
    console.error(`Directory ${folderName} already exists.`);
    process.exit(1);
  }

  fs.mkdirSync(newProjectDir, { recursive: true });

  if (type === 'c' || type === 'js') {
    copyFiles(templateDir, newProjectDir);
    console.log(`Created ${type === 'c' ? 'CHooks' : 'JSHooks'} project in ${newProjectDir}`);
  } else {
    console.error('Invalid type. Use "c" for CHooks or "js" for JSHooks.');
    process.exit(1);
  }
};

const compileCommand = async (inPath: string, outDir: string) => {
  if (!inPath) {
    console.error("Input path is required.");
    process.exit(1);
  }

  if (!outDir) {
    console.error("Output directory path is required.");
    process.exit(1);
  }

  try {
    const outStat = statSync(outDir);
    if (!outStat.isDirectory()) {
      console.error("Output path must be a directory.");
      process.exit(1);
    }
  } catch (error: any) {
    mkdir(outDir, { recursive: true }, (err) => {
      if (err) {
        console.error(`Failed to create directory: ${outDir}`);
        process.exit(1);
      }
      console.log(`Created directory: ${outDir}`);
    });
  }

  if (path.extname(inPath) === ".ts") {
    const file = inPath.split("/").pop();
    const filename = file?.split(".ts")[0];
    const newPath = inPath.replace(file as string, `dist/${filename}.js`);
    await esbuild.build({
      entryPoints: [inPath],
      outfile: newPath,
      bundle: true,
      format: "esm",
    });
    clean(newPath, newPath);
    await buildFile(newPath, outDir);
    return;
  }

  const dirStat = statSync(inPath);
  if (dirStat.isDirectory()) {
    throw Error("JS2Wasm Can ONLY build files");
  } else {
    await buildFile(inPath, outDir);
  }
};

export async function main() {
  const program = new Command();

  program
    .command('init <type> <folderName>')
    .description('Initialize a new project')
    .action(initCommand);

  program
    .command('compile <inPath> [outDir]')
    .description('Compile TypeScript files')
    .action(compileCommand);

  await program.parseAsync(process.argv);
}