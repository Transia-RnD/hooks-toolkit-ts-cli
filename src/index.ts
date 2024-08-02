#!/usr/bin/env node

import { Command } from "commander";
import { buildFile } from "./js2wasm/build";
import { mkdir, statSync, writeFileSync, readFileSync } from "fs";
import * as esbuild from "esbuild";
import * as fs from "fs";
import * as path from "path";
import { addListeners, ISelect } from "./debug";
import axios from "axios";

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

const initCommand = async (type: "c" | "js", folderName: string) => {
  const templateDir = path.join(__dirname, "init", type);
  const newProjectDir = path.join(process.cwd(), folderName);

  if (fs.existsSync(newProjectDir)) {
    console.error(`Directory ${folderName} already exists.`);
    process.exit(1);
  }

  fs.mkdirSync(newProjectDir, { recursive: true });

  if (type === "c" || type === "js") {
    copyFiles(templateDir, newProjectDir);
    console.log(
      `Created ${
        type === "c" ? "CHooks" : "JSHooks"
      } project in ${newProjectDir}`
    );
    try {
      const aliceResponse = await axios.post(
        "https://jshooks.xahau-test.net/newcreds"
      );
      if (aliceResponse.data.error) {
        console.error(aliceResponse.data.error);
        process.exit(1);
      }
      if (aliceResponse.data.code === "tesSUCCESS") {
        const aliceSecret = aliceResponse.data.secret;

        const envFilePath = path.join(newProjectDir, ".env");
        const envObject = {
          HOOKS_COMPILE_HOST: "https://hook-buildbox.xrpl.org",
          XRPLD_ENV: "testnet",
          XRPLD_WSS: "wss://jshooks.xahau-test.net",
          ALICE_SEED: aliceSecret,
        };
        const envContent = Object.entries(envObject)
          .map(([key, value]) => `${key}=${value}`)
          .join("\n");
        writeFileSync(envFilePath, envContent, { encoding: "utf-8" });

        console.log("Secrets saved to .env file.");
      } else {
        console.error("Failed to retrieve secrets from the server.");
      }
    } catch (error) {
      console.error("Error making POST requests:", error);
    }
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

const debugCommand = async (accountLabel: string, accountValue: string) => {
  const selectedAccount: ISelect | null = {
    label: accountLabel,
    value: accountValue,
  };

  addListeners(selectedAccount);
};

const newCredsCommand = async (name: string) => {
  if (!name) {
    console.error(`Invalid name.`);
    process.exit(1);
  }

  const envFilePath = path.join(process.cwd(), ".env");

  // Read the existing .env file
  let envContent = "";
  try {
    envContent = readFileSync(envFilePath, "utf-8");
  } catch (error) {
    console.error("Error reading .env file:", error);
    process.exit(1);
  }

  // Generate a new credential
  let newSecret;
  try {
    const response = await axios.post(
      "https://jshooks.xahau-test.net/newcreds"
    );
    if (response.data.code === "tesSUCCESS") {
      newSecret = response.data.secret;
    } else {
      console.error("Failed to retrieve secret from the server.");
      process.exit(1);
    }
  } catch (error) {
    console.error("Error making POST request:", error);
    process.exit(1);
  }

  // Add the new credential to the .env content
  const newEnvLine = `${name.toUpperCase()}_SEED=${newSecret}\n`;
  const updatedEnvContent = envContent + newEnvLine;

  // Write the updated .env file
  try {
    writeFileSync(envFilePath, updatedEnvContent, "utf-8");
    console.log(`Added new credential for ${name} to .env file.`);
  } catch (error) {
    console.error("Error writing to .env file:", error);
    process.exit(1);
  }
};

export async function main() {
  const program = new Command();

  program
    .command("init <type> <folderName>")
    .description("Initialize a new project")
    .action(initCommand);

  program
    .command("compile <inPath> [outDir]")
    .description("Compile TypeScript files")
    .action(compileCommand);

  program
    .command("debug <accountLabel> <accountValue>")
    .description("Debug with a selected account")
    .action(debugCommand);

  program
    .command("newcreds <name>")
    .description("Create new credentials for an account")
    .action(newCredsCommand);

  await program.parseAsync(process.argv);
}
