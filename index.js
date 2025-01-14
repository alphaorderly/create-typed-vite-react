#!/usr/bin/env node

import fs from "fs/promises";
import fse from "fs-extra";
import inquirer from "inquirer";
import chalk from "chalk";
import boxen from "boxen";
import { execSync } from "child_process";
import path from "path";

const TEMPLATE_REPO =
  "https://github.com/alphaorderly/typed-vite-react-template";

async function cloneTemplate(projectPath) {
  try {
    // Check if current directory
    const isCurrentDir = projectPath === process.cwd();

    // Only check directory existence if not current directory
    if (!isCurrentDir) {
      const exists = await fse.pathExists(projectPath);
      if (exists) {
        throw new Error(
          `Directory ${projectPath} already exists. Please choose a different name or remove the existing directory.`
        );
      }
    } else {
      // Check if current directory is empty
      const files = await fs.readdir(projectPath);
      // Check for files/folders except .git and node_modules
      const hasFiles = files.some(
        (file) => file !== ".git" && file !== "node_modules"
      );
      if (hasFiles) {
        throw new Error(
          "Current directory is not empty. Please use an empty directory."
        );
      }
    }

    console.log(chalk.blue("📦 Cloning template repository..."));
    try {
      if (isCurrentDir) {
        // For current directory, clone to temp dir first then move files
        const tempDir = path.join(process.cwd(), ".temp-clone");
        execSync(`git clone ${TEMPLATE_REPO} ${tempDir}`);
        // Copy all files except node_modules
        await fse.copy(tempDir, projectPath, {
          filter: (src) => !src.includes("node_modules"),
        });
        // Remove temp directory
        await fse.remove(tempDir);
      } else {
        execSync(`git clone ${TEMPLATE_REPO} ${projectPath}`);
      }
    } catch (error) {
      if (error.message.includes("git")) {
        throw new Error(
          "Git is not installed. Please install Git and try again."
        );
      }
      throw error;
    }
    // Remove git history
    await fse.remove(path.join(projectPath, ".git"));
    // Remove README.md file
    await fse.remove(path.join(projectPath, "README.md"));
    console.log(chalk.green("✓ Template cloned successfully"));
  } catch (error) {
    console.error(chalk.red("Error cloning template:", error.message));
    throw error;
  }
}

async function updatePackageJson(projectPath, name, description, license) {
  const packageJsonPath = path.join(projectPath, "package.json");
  try {
    const data = await fs.readFile(packageJsonPath, "utf8");
    const packageData = JSON.parse(data);

    packageData.name = name;
    packageData.description = description;
    packageData.license = license;

    await fs.writeFile(packageJsonPath, JSON.stringify(packageData, null, 2));
    console.log(chalk.green("✓ package.json updated successfully"));
  } catch (error) {
    console.error(chalk.red("Error updating package.json:", error.message));
    throw error;
  }
}

async function initializeGit(projectPath) {
  try {
    execSync("git init", { cwd: projectPath });
    console.log(chalk.green("✓ Git repository initialized"));
  } catch (error) {
    console.error(chalk.red("Error initializing git:", error.message));
    throw error;
  }
}

async function installDependencies(projectPath) {
  try {
    console.log(chalk.blue("📦 Installing dependencies..."));
    execSync("yarn install", { cwd: projectPath, stdio: "inherit" });
    console.log(chalk.green("✓ Dependencies installed successfully"));
  } catch (error) {
    console.error(chalk.red("Error installing dependencies:", error.message));
    throw error;
  }
}

async function createReadme(projectPath, name, description, license) {
  try {
    const readmeContent = `# ${name}

${description}

## Getting Started

This project was bootstrapped with [Typed Vite React Template](https://github.com/alphaorderly/typed-vite-react-template).

### Prerequisites

- Node.js (20.x or higher)
- Yarn package manager
  - Or anything else that supports pnpm, npm, or bun

### Installation

1. Install dependencies:
\`\`\`bash
yarn install
\`\`\`

2. Start the development server:
\`\`\`bash
yarn dev
\`\`\`

3. Build for production:
\`\`\`bash
yarn build
\`\`\`

## License

This project is licensed under the ${license} License.
`;

    await fs.writeFile(path.join(projectPath, "README.md"), readmeContent);
    console.log(chalk.green("✓ README.md created successfully"));
  } catch (error) {
    console.error(chalk.red("Error creating README.md:", error.message));
    throw error;
  }
}

async function main(dir) {
  console.log(
    boxen(
      chalk.blue.bold("Typed Vite React Template Setup") +
        "\nLet's configure your new project!",
      { padding: 1, margin: 1, borderStyle: "double" }
    )
  );

  try {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "What is your project name?",
        default: "my-vite-react-app",
        validate: (input) => {
          if (!input.trim()) return "Project name cannot be empty!";
          // Add validation for valid package name
          if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
            return "Project name can only contain letters, numbers, hyphens, and underscores!";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "description",
        message: "What is your project description?",
        default: "A TypeScript React project with Vite",
      },
      {
        type: "list",
        name: "license",
        message: "Choose a license for your project:",
        choices: [
          {
            name: "MIT",
            value: "MIT",
            description:
              "The MIT License is the most widely used open source license. It allows free use, modification, and distribution of software. Only requires preservation of copyright notice and license. Commercial use is permitted.",
          },
          {
            name: "Apache 2.0",
            value: "Apache-2.0",
            description:
              "The Apache 2.0 License includes patent protection clauses. No obligation to disclose source code, includes explicit permission for patent use. Requires stating changes and preserving notices.",
          },
          {
            name: "GPL 3.0",
            value: "GPL-3.0",
            description:
              "GPL 3.0 is a copyleft license requiring derivative works to use the same GPL license. Source code disclosure is mandatory, and includes provisions to protect user freedom.",
          },
          {
            name: "BSD 3 Clause",
            value: "BSD-3-Clause",
            description:
              "BSD 3-Clause is a permissive license. Allows free use with minimal restrictions - just maintain copyright notice, license text, and disclaimer. No source code disclosure required.",
          },
          {
            name: "None",
            value: "UNLICENSED",
            description:
              "Explicitly indicates no license is granted. All rights are reserved by default, meaning others cannot use, modify, or distribute the code without permission.",
          },
          {
            name: "Proprietary",
            value: "PROPRIETARY",
            description:
              "Indicates proprietary software. All rights are reserved by the copyright holder. No use, modification, or distribution is allowed without explicit permission.",
          },
        ],
        default: "MIT",
      },
    ]);

    const projectPath = path.join(process.cwd(), dir);

    await cloneTemplate(projectPath);
    await updatePackageJson(
      projectPath,
      answers.name,
      answers.description,
      answers.license
    );
    await createReadme(
      projectPath,
      answers.name,
      answers.description,
      answers.license
    );
    await initializeGit(projectPath);
    await installDependencies(projectPath);

    // Success message
    const cdCommand = dir === "." ? "" : `\n1. cd ${answers.name}`;
    console.log(
      boxen(
        chalk.green("🎉 Project successfully created!") +
          `\n📁 Location: ${chalk.blue(projectPath)}` +
          `\n📦 Name: ${chalk.blue(answers.name)}` +
          `\n📝 Description: ${chalk.blue(answers.description)}` +
          `\n📄 License: ${chalk.blue(answers.license)}` +
          "\n\nNext steps:" +
          cdCommand +
          "\n2. yarn dev",
        { padding: 2, margin: 1, borderStyle: "classic" }
      )
    );
  } catch (error) {
    console.error(chalk.red("An error occurred during setup:", error.message));
    process.exit(1);
  }
}

// get arg which is the project directory
// if it is ., use the current directory
// if it is not ., create the directory and use it

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error(chalk.red("Please provide a project directory"));
  // Example
  console.log(chalk.blue("Example: yarn create typed-vite-react my-project"));
  console.log(chalk.blue("Example: yarn create typed-vite-react ."));
  process.exit(1);
}

const dir = args[0];

main(dir).catch((error) => {
  console.error(chalk.red("Fatal error:", error));
  process.exit(1);
});
