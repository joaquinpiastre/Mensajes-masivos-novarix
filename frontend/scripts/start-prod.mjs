import { spawn } from "node:child_process";

const port = process.env.PORT ?? "4173";
const child = spawn(
  "npx",
  ["serve", "dist", "-s", "-l", `tcp://0.0.0.0:${port}`],
  { stdio: "inherit", shell: true },
);

child.on("exit", (code) => process.exit(code ?? 0));
