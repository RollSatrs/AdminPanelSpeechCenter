import "server-only";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import path from "node:path";

const execFileAsync = promisify(execFile);

const BOT_PROCESS_NAME = "speechcenter-bot";

type Pm2JListItem = {
  name?: string;
  pm2_env?: {
    status?: string;
  };
};

export type BotProcessStatus = {
  manager: "pm2";
  available: boolean;
  state: "online" | "stopped" | "missing" | "unknown";
  message?: string;
};

function getWorkspaceRoot() {
  return path.resolve(process.cwd(), "..");
}

function getEcosystemPath() {
  return path.join(getWorkspaceRoot(), "ecosystem.config.cjs");
}

async function runPm2(args: string[]) {
  return execFileAsync("pm2", args, {
    cwd: getWorkspaceRoot(),
    env: process.env,
  });
}

export async function getBotProcessStatus(): Promise<BotProcessStatus> {
  try {
    const { stdout } = await runPm2(["jlist"]);
    const list = JSON.parse(stdout || "[]") as Pm2JListItem[];
    const item = list.find((entry) => entry.name === BOT_PROCESS_NAME);
    if (!item) {
      return { manager: "pm2", available: true, state: "missing" };
    }

    const status = item.pm2_env?.status ?? "unknown";
    if (status === "online") {
      return { manager: "pm2", available: true, state: "online" };
    }
    if (status === "stopped" || status === "stopping" || status === "errored") {
      return { manager: "pm2", available: true, state: "stopped" };
    }

    return { manager: "pm2", available: true, state: "unknown", message: `pm2 status: ${status}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : "pm2 unavailable";
    return { manager: "pm2", available: false, state: "unknown", message };
  }
}

export async function ensureBotProcessOnline() {
  const status = await getBotProcessStatus();
  if (!status.available) {
    throw new Error("pm2 не установлен или недоступен в PATH");
  }

  if (status.state === "online") return;

  if (status.state === "missing") {
    await runPm2(["start", getEcosystemPath(), "--only", BOT_PROCESS_NAME, "--update-env"]);
    return;
  }

  await runPm2(["restart", BOT_PROCESS_NAME, "--update-env"]);
}

export async function restartBotProcess() {
  const status = await getBotProcessStatus();
  if (!status.available) {
    throw new Error("pm2 не установлен или недоступен в PATH");
  }

  if (status.state === "missing") {
    await runPm2(["start", getEcosystemPath(), "--only", BOT_PROCESS_NAME, "--update-env"]);
    return;
  }

  await runPm2(["restart", BOT_PROCESS_NAME, "--update-env"]);
}

export async function stopBotProcess() {
  const status = await getBotProcessStatus();
  if (!status.available) {
    throw new Error("pm2 не установлен или недоступен в PATH");
  }

  if (status.state === "missing" || status.state === "stopped") {
    return;
  }

  await runPm2(["stop", BOT_PROCESS_NAME]);
}
