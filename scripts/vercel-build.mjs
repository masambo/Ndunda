import { spawnSync } from "node:child_process";

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const npxCommand = isWindows ? "npx.cmd" : "npx";

function run(command, args) {
  const result = isWindows
    ? spawnSync(
        [command, ...args.map((arg) => `"${arg.replace(/"/g, '\\"')}"`)].join(" "),
        { stdio: "inherit", shell: true },
      )
    : spawnSync(command, args, { stdio: "inherit" });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  process.exitCode = result.status ?? 1;
  if (process.exitCode !== 0) {
    process.exit(process.exitCode);
  }
}

if (process.env.CONVEX_DEPLOY_KEY) {
  run(npxCommand, [
    "convex",
    "deploy",
    "--cmd-url-env-var-name",
    "VITE_CONVEX_URL",
    "--cmd",
    "npm run build",
  ]);
} else if (process.env.VITE_CONVEX_URL) {
  console.warn(
    "CONVEX_DEPLOY_KEY is not set. Skipping Convex deploy and building with the provided VITE_CONVEX_URL.",
  );
  run(npmCommand, ["run", "build"]);
} else {
  console.error(
    [
      "Missing Vercel Convex configuration.",
      "",
      "Set one of these in Vercel Project Settings > Environment Variables:",
      "- CONVEX_DEPLOY_KEY to deploy Convex during the Vercel build, or",
      "- VITE_CONVEX_URL to build against an already-deployed Convex backend.",
      "",
      "Recommended production setup: add CONVEX_DEPLOY_KEY from the Convex dashboard.",
    ].join("\n"),
  );
  process.exit(1);
}
