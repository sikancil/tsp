#!/usr/bin/env node

import path from "node:path";
import fs from "node:fs";
import inquirer from "inquirer";
import { execSync, spawn, spawnSync } from "node:child_process";
import axios from "axios";
import semver from "semver";
import chalk from "chalk";
import ora from "ora";

type Installation = "globally" | "locally" | "manually" | "skip";

interface InstallCommands {
  globally: string | undefined;
  locally: string | undefined;
  manually?: string | undefined;
}

interface Framework {
  name: string;
  npmjs: string;
  repository: string;
  prequisiteScript: string | undefined;
  installCommand: (options?: {
    [key: string]: any;
  }) => Promise<InstallCommands>;
  configSetup: (
    projectPath: string,
    installationType: Installation | undefined
  ) => Promise<void>;
}

interface Version {
  version: string;
  date: string;
}

// Framework configurations
export const frameworks: Record<string, Framework> = {
  nestjs: {
    name: "NestJS",
    npmjs: "@nestjs/cli",
    repository: "nestjs/nest",
    prequisiteScript: undefined,
    installCommand: async (options?: { [key: string]: any }) => {
      const projectDirPath = path.isAbsolute(options?.projectPath)
        ? options?.projectPath
        : path.join(process.cwd(), options?.projectPath);
      return {
        globally: `
npm install -g @nestjs/cli
nest new ${options?.projectName} --directory=${projectDirPath}
echo "🚀 A NestJS project has been setup successfully (CLI installed globally)."`,
        locally: `
mkdir -p "${options?.projectPath}"
cd "${options?.projectPath}"
npm install @nestjs/cli --save-dev
npx nest new ${options?.projectName}
echo "🚀 A NestJS project has been setup successfully (CLI installed locally)."`,
        manually: `
git clone https://github.com/nestjs/typescript-starter.git ${options?.projectName}
cd "${options?.projectName}"
npm install
echo "🚀 A NestJS project has been setup manually (CLI installed locally)."`,
      };
    },
    configSetup: async (
      projectPath: string,
      installationType: Installation | undefined
    ) => {
      if (!installationType) {
        console.error("❗️ Installation type not provided!");
        process.exit(1);
      }

      // NestJS specific setup if needed
    },
  },
  nextjs: {
    name: "Next.js",
    npmjs: "next",
    repository: "vercel/next.js",
    prequisiteScript: undefined,
    installCommand: async (options?: { [key: string]: any }) => {
      const projectDirPath = path.isAbsolute(options?.projectPath)
        ? options?.projectPath
        : path.join(process.cwd(), options?.projectPath);
      return {
        globally: undefined,
        locally: `
npx create-next-app@latest ${options?.projectName} --use-npm --ts --eslint --tailwind --src-dir --app --turbopack --import-alias "@/*"
echo "🚀 A Next.js project has been setup successfully (CLI installed locally)."`,
        manually: `
cd ${projectDirPath}
npm install next@latest react@latest react-dom@latest
npm install
echo "🚀 A Next.js project has been setup manually (CLI installed locally)."`,
      };
    },
    configSetup: async (
      projectPath: string,
      installationType: Installation | undefined
    ) => {
      if (!installationType) {
        console.error("❗️ Installation type not provided!");
        process.exit(1);
      }

      // Next.js specific setup if needed
      if (installationType === "manually") {
        console.info(`Updating package.json scripts...`);
        const packageJsonPath = path.join(projectPath, "package.json");
        if (!fs.existsSync(packageJsonPath)) {
          fs.writeFileSync(
            packageJsonPath,
            JSON.stringify(
              {
                name: "example-tsp-project",
                version: "0.1.0",
                scripts: {
                  dev: "next dev",
                  build: "next build",
                  start: "next start",
                  lint: "next lint",
                },
                dependencies: {
                  next: "latest",
                  react: "latest",
                  "react-dom": "latest",
                },
                devDependencies: {
                  "@types/node": "latest",
                  "@types/react": "latest",
                  "@types/react-dom": "latest",
                  autoprefixer: "^10.4.14",
                  postcss: "^8.4.21",
                  tailwindcss: "^3.2.7",
                  typescript: "latest",
                  eslint: "latest",
                  "eslint-config-next": "latest",
                },
              },
              null,
              2
            )
          );
        }
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf-8")
        );
        packageJson.scripts.dev = packageJson.scripts.dev
          ? packageJson.scripts.dev
          : "next dev";
        packageJson.scripts.build = packageJson.scripts.build
          ? packageJson.scripts.build
          : "next build";
        packageJson.scripts.start = packageJson.scripts.start
          ? packageJson.scripts.start
          : "next start";
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      }
    },
  },
  astrojs: {
    name: "Astro",
    npmjs: "astro",
    repository: "withastro/astro",
    prequisiteScript: undefined,
    installCommand: async (options?: { [key: string]: any }) => {
      const projectDirPath = path.isAbsolute(options?.projectPath)
        ? options?.projectPath
        : path.join(process.cwd(), options?.projectPath);
      return {
        globally: undefined,
        locally: `
mkdir -p "${options?.projectPath}"
npx create-astro@latest ${options?.projectPath} -- --fancy --typescript=strict --skip-houston --no-git --install --yes
echo "🚀 An Astro JS project has been setup successfully (CLI installed locally)."`,
        manually: `
cd ${projectDirPath}
npm install astro
cd ${options?.projectName}
npm install
echo "🚀 An Astro JS project has been setup manually (CLI installed locally)."`,
      };
    },
    configSetup: async (
      projectPath: string,
      installationType: Installation | undefined
    ) => {
      if (!installationType) {
        console.error("❗️ Installation type not provided!");
        process.exit(1);
      }

      // Astro specific setup if needed
      if (installationType === "manually") {
        console.info(`Updating package.json scripts...`);
        const packageJsonPath = path.join(
          process.cwd(),
          projectPath,
          "package.json"
        );
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf-8")
        );
        packageJson.scripts.dev = packageJson.scripts.dev
          ? packageJson.scripts.dev
          : "astro dev";
        packageJson.scripts.build = packageJson.scripts.build
          ? packageJson.scripts.build
          : "astro build";
        packageJson.scripts.start = packageJson.scripts.start
          ? packageJson.scripts.start
          : "astro dev";
        packageJson.scripts.preview = packageJson.scripts.start
          ? packageJson.scripts.start
          : "astro preview";
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

        console.info(`Updating tsconfig.json...`);
        const tsConfigPath = path.join(
          process.cwd(),
          projectPath,
          "tsconfig.json"
        );
        if (!fs.existsSync(tsConfigPath)) {
          fs.writeFileSync(
            tsConfigPath,
            JSON.stringify(
              {
                compilerOptions: {
                  target: "es2020",
                  module: "esnext",
                  outDir: "./dist",
                  rootDir: "./src",
                  strict: true,
                  esModuleInterop: true,
                  skipLibCheck: true,
                  forceConsistentCasingInFileNames: true,
                  declaration: true,
                },
                include: ["src/**/*"],
                exclude: ["node_modules", "dist"],
              },
              null,
              2
            )
          );
        }
        const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, "utf-8"));
        tsConfig.extends = "astro/tsconfigs/base";
        fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));

        console.info(`Updating astro.config.mjs...`);
        const astroConfigPath = path.join(
          process.cwd(),
          projectPath,
          "astro.config.mjs"
        );
        if (!fs.existsSync(astroConfigPath)) {
          fs.writeFileSync(
            astroConfigPath,
            `
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({});
`,
            "utf-8"
          );
        } else {
          console.warn(
            `❗️ Abort modification of "astro.config.mjs", already exists!`
          );
        }

        console.info(`Updating src/pages/index.astro`);
        const indexAstroPath = path.join(
          process.cwd(),
          projectPath,
          "src",
          "pages",
          "index.astro"
        );
        if (!fs.existsSync(indexAstroPath)) {
          if (!fs.existsSync(path.dirname(indexAstroPath))) {
            fs.mkdirSync(path.join(projectPath, "src", "pages"), {
              recursive: true,
            });
          }
          fs.writeFileSync(
            indexAstroPath,
            `
---
// Welcome to Astro! Everything between these triple-dash code fences
// is your "component frontmatter". It never runs in the browser.
console.log('This runs in your terminal, not the browser!');
---
<!-- Below is your "component template." It's just HTML, but with
    some magic sprinkled in to help you build great templates. -->
<html>
  <body>
    <h1>Hello, World!</h1>
  </body>
</html>
<style>
  h1 {
    color: orange;
  }
</style>
`,
            "utf-8"
          );
        }

        console.info(`Updating public/robots.txt`);
        const robotsTxtPath = path.join(
          process.cwd(),
          projectPath,
          "public",
          "robots.txt"
        );
        if (!fs.existsSync(robotsTxtPath)) {
          if (!fs.existsSync(path.dirname(robotsTxtPath))) {
            fs.mkdirSync(path.dirname(robotsTxtPath), { recursive: true });
          }
          fs.writeFileSync(
            robotsTxtPath,
            `
# Example: Allow all bots to scan and index your site.
# Full syntax: https://developers.google.com/search/docs/advanced/robots/create-robots-txt
User-agent: *
Allow: /
`,
            "utf-8"
          );
        }
      }
    },
  },
  nuxtjs: {
    name: "Nuxt.js",
    npmjs: "nuxt",
    repository: "nuxt/framework",
    prequisiteScript: undefined,
    installCommand: async (options?: { [key: string]: any }) => {
      // const projectDirPath = path.isAbsolute(options?.projectPath) ? options?.projectPath : path.join(process.cwd(), options?.projectPath)
      return {
        globally: undefined,
        locally: `
npx nuxi@latest init ${options?.projectName}
echo "🚀 A NuxtJS project has been setup successfully (CLI installed locally)."`,
        manually: undefined,
      };
    },
    configSetup: async (
      projectPath: string,
      installationType: Installation | undefined
    ) => {
      if (!installationType) {
        console.error("❗️ Installation type not provided!");
        process.exit(1);
      }

      // Nuxt.js specific setup if needed
    },
  },
  quasar: {
    name: "Quasar",
    npmjs: "@quasar/cli",
    repository: "quasarframework/quasar",
    prequisiteScript: undefined,
    installCommand: async (options?: { [key: string]: any }) => {
      const projectDirPath = path.isAbsolute(options?.projectPath)
        ? options?.projectPath
        : path.join(process.cwd(), options?.projectPath);
      return {
        globally: `
npm install -g @quasar/cli
npm init quasar ${options?.projectName}
echo "🚀 A Quasar project has been setup successfully (CLI installed globally)."`,
        locally: `
npm init quasar ${options?.projectPath}
echo "🚀 A Quasar project has been setup successfully (CLI installed locally)."`,
        manually: `
mkdir -p ${projectDirPath}
cd ${projectDirPath}
git clone https://github.com/quasarframework/quasar-starter.git ${options?.projectName}
cd ${options?.projectName}
npm install
echo "🚀 A Quasar project has been setup manually (CLI installed locally)."`,
      };
    },
    configSetup: async (
      projectPath: string,
      installationType: Installation | undefined
    ) => {
      if (!installationType) {
        console.error("❗️ Installation type not provided!");
        process.exit(1);
      }

      // Quasar specific setup if needed
    },
  },
};

export async function getVersions(packageName: string): Promise<Version[]> {
  try {
    const response = await axios.get(
      `https://registry.npmjs.org/${packageName}`
    );
    const versions = Object.keys(response.data.versions)
      .map((v) => ({
        version: v,
        date: response.data.time[v],
      }))
      .filter((v) => !v.version.includes("rc") && !v.version.includes("canary"))
      .sort((a, b) => semver.rcompare(a.version, b.version));

    return versions;
  } catch (error) {
    console.error("Error fetching versions:", error);
    return [];
  }
}

export function filterVersions(versions: Version[]): string[] {
  const majorVersions = new Map<string, Version[]>();

  versions.forEach((v) => {
    const major = semver.major(v.version);
    if (!majorVersions.has(major.toString())) {
      majorVersions.set(major.toString(), []);
    }
    majorVersions.get(major.toString())?.push(v);
  });

  const result: string[] = [];
  const latestMajors = Array.from(majorVersions.keys())
    .sort((a, b) => Number(b) - Number(a))
    .slice(0, 2);

  latestMajors.forEach((major) => {
    const versionsForMajor = majorVersions.get(major) || [];
    result.push(...versionsForMajor.slice(0, 3).map((v) => v.version));
  });

  return result;
}

export async function setupLinting(projectPath: string): Promise<void> {
  const spinner = ora("Setting up ESLint and Prettier...").start();

  try {
    if (
      fs.existsSync(path.join(process.cwd(), projectPath, ".eslintrc.json")) ||
      fs.existsSync(path.join(process.cwd(), projectPath, ".eslintrc.js"))
    ) {
      console.warn(`❗️ ESLint config already exists!`);
    } else {
      spawnSync(
        "npm",
        [
          "install",
          "--save-dev",
          "--legacy-peer-deps",
          "eslint",
          "@typescript-eslint/parser",
          "@typescript-eslint/eslint-plugin",
          "prettier",
          "eslint-config-prettier",
          "eslint-plugin-prettier",
        ],
        { cwd: projectPath, shell: "/bin/bash", stdio: "inherit" }
      );

      // Create ESLint config
      const eslintConfig = {
        parser: "@typescript-eslint/parser",
        plugins: ["@typescript-eslint", "prettier"],
        extends: [
          "eslint:recommended",
          "plugin:@typescript-eslint/recommended",
          "prettier",
        ],
        rules: {
          "prettier/prettier": "error",
        },
      };

      fs.writeFileSync(
        path.join(process.cwd(), projectPath, ".eslintrc.json"),
        JSON.stringify(eslintConfig, null, 2)
      );
    }

    if (
      fs.existsSync(path.join(process.cwd(), projectPath, ".prettierrc")) ||
      fs.existsSync(path.join(process.cwd(), projectPath, ".prettierrc.json"))
    ) {
      console.warn(`❗️ Prettier config already exists!`);
    } else {
      // Create Prettier config
      const prettierConfig = {
        semi: true,
        trailingComma: "es5",
        singleQuote: true,
        printWidth: 80,
        tabWidth: 2,
      };

      fs.writeFileSync(
        path.join(process.cwd(), projectPath, ".prettierrc.json"),
        JSON.stringify(prettierConfig, null, 2)
      );
    }

    console.info(`Updating package.json scripts...`);
    const packageJsonPath = path.join(
      process.cwd(),
      projectPath,
      "package.json"
    );
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    packageJson.scripts.lint = packageJson.scripts.lint
      ? packageJson.scripts.lint
      : `eslint "src/**/*.ts"`;
    packageJson.scripts.format = packageJson.scripts.format
      ? packageJson.scripts.format
      : `prettier --write "src/**/*.ts"`;
    packageJson.scripts.precommit = packageJson.scripts.precommit
      ? packageJson.scripts.precommit
      : `npm run lint && npm run format`;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    spinner.succeed("Linting and Code Formatting setup completed");
  } catch (error) {
    spinner.fail("Error setting up linting");
    console.error(error);
  }
}

export async function setupTesting(
  projectPath: string,
  framework: string
): Promise<void> {
  const { testingFramework } = await inquirer.prompt([
    {
      type: "list",
      name: "testingFramework",
      message: "Select a testing framework:",
      choices: ["Jest", "Mocha", "Skip"],
    },
  ]);

  if (testingFramework === "Skip") {
    console.warn(`❗️ Testing framework setup skipped!`);
    return;
  }

  const spinner = ora(`Setting up ${testingFramework}...`).start();

  try {
    if (testingFramework === "Jest") {
      spawnSync(
        "npm",
        ["install", "--save-dev", "jest", "@types/jest", "ts-jest"],
        { cwd: projectPath, shell: "/bin/bash", stdio: "inherit" }
      );

      const jestConfig = {
        preset: "ts-jest",
        testEnvironment: "node",
        moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
      };

      fs.writeFileSync(
        path.join(projectPath, "jest.config.json"),
        JSON.stringify(jestConfig, null, 2)
      );

      console.info(`Updating package.json scripts...`);
      const packageJsonPath = path.join(
        process.cwd(),
        projectPath,
        "package.json"
      );
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      packageJson.scripts.test = packageJson.scripts.test
        ? packageJson.scripts.test
        : `jest --runInBand --detectOpenHandles --forceExit`;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    } else {
      execSync(
        `"npm install --save-dev mocha @types/mocha chai @types/chai ts-node"`,
        {
          cwd: projectPath,
          shell: "/bin/bash",
          stdio: "inherit",
        }
      );

      console.info(`Updating package.json scripts...`);
      const packageJsonPath = path.join(
        process.cwd(),
        projectPath,
        "package.json"
      );
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      packageJson.scripts.test = packageJson.scripts.test
        ? packageJson.scripts.test
        : `mocha --require ts-node/register "test/**/*.spec.ts"`;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    spinner.succeed(`${testingFramework} setup complete`);
  } catch (error) {
    spinner.fail(`Error setting up ${testingFramework}`);
    console.error(error);
  }
}

export async function setupPlainTypeScript(options: any): Promise<void> {
  const { projectPath } = await inquirer.prompt([
    {
      type: "input",
      name: "projectPath",
      message: "Enter project path:",
      default: "./typescript-project",
    },
  ]);

  const spinner = ora("Setting up Plain TypeScript project...").start();

  try {
    // Create project directory
    fs.mkdirSync(projectPath, { recursive: true });

    // Initialize package.json
    // execSync(`"npm init -y"`, { cwd: projectPath, shell: "/bin/bash", stdio: "inherit", });
    spawnSync("npm", ["init", "-y"], {
      cwd: projectPath,
      shell: "/bin/bash",
      stdio: "inherit",
    });

    // Install TypeScript
    // execSync(`"npm install --save-dev typescript @types/node"`, {
    //   cwd: projectPath,
    //   shell: "/bin/bash",
    //   stdio: "inherit",
    // });
    spawnSync("npm", ["install", "--save-dev", "typescript", "@types/node"], {
      cwd: projectPath,
      shell: "/bin/bash",
      stdio: "inherit",
    });

    // Create tsconfig.json
    const tsConfig = {
      compilerOptions: {
        target: "es2020",
        module: "commonjs",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        outDir: "./dist",
        rootDir: "./src",
      },
      include: ["src/**/*"],
      exclude: ["node_modules"],
    };

    fs.writeFileSync(
      path.join(projectPath, "tsconfig.json"),
      JSON.stringify(tsConfig, null, 2)
    );

    // Create src directory and sample file
    fs.mkdirSync(path.join(projectPath, "src"), { recursive: true });
    fs.writeFileSync(
      path.join(projectPath, "src", "index.ts"),
      'console.log("Hello TypeScript!");'
    );

    spinner.succeed("Plain TypeScript project setup complete");

    // Setup linting and testing
    await setupLinting(projectPath);
    await setupTesting(projectPath, "plain");
  } catch (error) {
    spinner.fail("Error setting up Plain TypeScript project");
    console.error(error);
  }
}

export async function setupFramework(framework: string): Promise<void> {
  const { projectName, projectPath } = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "Enter project name:",
      default: `${framework}-project`,
    },
    {
      type: "input",
      name: "projectPath",
      message: "Enter project path:",
      default: (answers: any) => `./${answers.projectName}`,
    },
  ]);

  // Fetch and filter versions
  const spinner = ora("Fetching available versions...").start();
  const versions = await getVersions(frameworks[framework].npmjs).catch(
    (error) => {
      spinner.fail("Error fetching versions");
      console.error(error);
      process.exit(1);
    }
  );
  const filteredVersions = filterVersions(versions);
  spinner.succeed("Versions fetched");

  const { version } = await inquirer.prompt([
    {
      type: "list",
      name: "version",
      message: "Select version:",
      choices: filteredVersions,
    },
  ]);

  console.log();
  console.info(`👉 Installing ${framework}...`);

  try {
    // Prequiste installation
    if (frameworks[framework].prequisiteScript) {
      execSync(frameworks[framework].prequisiteScript, { stdio: "inherit" });
    }

    let preferredInstallation: Installation | undefined = undefined;

    const installationCommand = await frameworks?.[framework]?.installCommand({
      projectPath,
      projectName,
      version,
    });

    if (fs.existsSync(projectPath)) {
      if (!installationCommand?.manually) {
        console.warn(`❗️ Setup manually has not been implemented!`);
        process.exit(1);
      }

      // check if directory path empty (does not contain any files)
      if (fs.readdirSync(projectPath)?.length > 0) {
        console.warn(`❗️ Project path ${projectPath} is not empty!`);

        const confirmRewrite = await inquirer.prompt({
          type: "confirm",
          name: "overwrite",
          message: `Directory ${projectPath} not empty! Perform manual installation and overwrite?`,
          default: false,
        });

        if (!confirmRewrite) {
          console.warn(`❗️ Setup aborted!`);
          process.exit(1);
        }
      }

      // spinner.start("Installing framework...");

      execSync(installationCommand?.manually, {
        stdio: "inherit",
      });

      preferredInstallation = "manually";

      // spinner.succeed("Framework installation completed");
    } else {
      // check if framework have both globally and locally installation, then show prompt to select, otherwise just install which is available
      const hasBothInstallations =
        installationCommand?.globally && installationCommand?.locally;

      if (hasBothInstallations) {
        const promptInstallation = await inquirer.prompt([
          {
            type: "list",
            name: "installType",
            message: "Select installation method:",
            choices: [
              { name: "Globally", value: "globally", short: "global" },
              { name: "Locally", value: "locally", short: "local" },
              { name: "Skip", value: "skip", short: "skip" },
            ],
          },
        ]);

        preferredInstallation = promptInstallation.installType;
      } else {
        preferredInstallation = installationCommand?.globally
          ? "globally"
          : installationCommand?.locally
            ? "locally"
            : installationCommand?.manually
              ? "manually"
              : undefined;
      }

      if (
        preferredInstallation === "skip" ||
        preferredInstallation === undefined
      ) {
        spinner.warn("Framework setup skipped");
        return;
      }

      const projectDirPath = path.isAbsolute(projectPath)
        ? projectPath
        : path.join(process.cwd(), projectPath);
      console.info(`Project path: ${projectDirPath}\n`);

      // spinner.start(`Installing framework...`);

      const command = installationCommand?.[preferredInstallation] as string;
      const commandParts = command.includes("&&")
        ? command.split("&&").map((part) => part.trim())
        : command.includes(";")
          ? command.split(";").map((part) => part.trim())
          : command.includes("\n")
            ? command.split("\n").map((part) => part.trim())
            : [command];

      for (const part of commandParts) {
        try {
          if (!part || part?.trim?.()?.length === 0) continue;
          execSync(part, { stdio: "inherit", shell: "/bin/bash" });
        } catch (error) {
          console.error(`Error executing command: ${part}`);
          console.error(error);
          spinner.fail("Error setting up framework");
          process.exit(1);
        }
      }

      // spinner.succeed("Framework installation completed");
    }

    spinner.start("Setting up framework...");

    // Run framework-specific configuration
    await frameworks[framework].configSetup(projectPath, preferredInstallation);

    spinner.succeed("Framework setup complete");

    // Setup linting and testing
    await setupLinting(projectPath);
    await setupTesting(projectPath, framework);

    spinner.succeed("Framework setup complete");

    console.log();
    console.info(
      chalk.green(
        `🎉 ${framework} project codename ${chalk.bold(projectName)} has been setup successfully (CLI installed ${
          preferredInstallation === "manually" ? "manually" : "locally"
        }).`
      )
    );
    process.exit(0);
  } catch (error) {
    spinner.fail("Error setting up framework");
    console.error(error);
  }
}

export async function mainMenu(): Promise<void> {
  while (true) {
    const { choice } = await inquirer.prompt([
      {
        type: "list",
        name: "choice",
        message: "Select project type:",
        choices: ["Plain TypeScript", "Framework", "Exit"],
      },
    ]);

    if (choice === "Exit") {
      console.log(chalk.green("Goodbye!"));
      process.exit(0);
    }

    if (choice === "Plain TypeScript") {
      const { variant } = await inquirer.prompt([
        {
          type: "list",
          name: "variant",
          message: "Select TypeScript variant:",
          choices: [
            { name: "Node.js", value: "node", short: "node" },
            { name: "Bun/Deno", value: "bun-deno", short: "bun-deno" },
            { name: "Back", value: "back", short: "back" },
            { name: "Exit", value: "exit", short: "exit" },
          ],
        },
      ]);

      if (variant === "Exit") {
        console.log(chalk.green("Goodbye!"));
        process.exit(0);
      }

      if (variant === "Back") continue;

      await setupPlainTypeScript({ variant });
    }

    if (choice === "Framework") {
      const { framework } = await inquirer.prompt([
        {
          type: "list",
          name: "framework",
          message: "Select framework:",
          choices: [
            { name: "NestJS", value: "nestjs", short: "nest" },
            { name: "Next.js", value: "nextjs", short: "next" },
            { name: "Astro", value: "astrojs", short: "astro" },
            { name: "Nuxt.js", value: "nuxtjs", short: "nuxt" },
            { name: "Quasar", value: "quasar", short: "quasar" },
            {
              name: "Vite + React + Tailwind",
              value: "vite-react-tailwind",
              short: "vite-react-tailwind",
            },
            {
              name: "Vite + Vue + Tailwind",
              value: "vite-vue-tailwind",
              short: "vite-vue-tailwind",
            },
            { name: "Back", value: "back", short: "back" },
            { name: "Exit", value: "exit", short: "exit" },
          ],
        },
      ]);

      if (framework === "Exit") {
        console.log(chalk.green("Goodbye!"));
        process.exit(0);
      }

      if (framework === "Back") continue;

      await setupFramework(framework.toLowerCase().replace(/\s+/g, ""));
    }
  }
}

// Start the CLI
console.log(chalk.blue("TypeScript Project Initializer"));
mainMenu().catch(console.error);
