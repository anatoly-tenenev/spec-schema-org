import { spawn } from "node:child_process";

const extraArgs = process.argv.slice(2);
const hasModeFlag = extraArgs.some((arg) =>
  ["--check", "--write", "--list-different"].includes(arg),
);

const prettierArgs = [".", "--ignore-unknown", ...extraArgs];
if (!hasModeFlag) {
  prettierArgs.push("--write");
}

const child = spawn("npx", ["prettier", ...prettierArgs], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
