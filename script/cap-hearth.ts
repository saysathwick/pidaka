import { execSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";

const PIDAKA_CONFIG = "capacitor.config.ts";
const HEARTH_CONFIG = "capacitor.hearth.config.ts";
const BACKUP_CONFIG = "capacitor.config.pidaka.bak";

function withHearthConfig(command: string) {
  if (!existsSync(HEARTH_CONFIG)) {
    throw new Error(`Missing ${HEARTH_CONFIG}`);
  }
  copyFileSync(PIDAKA_CONFIG, BACKUP_CONFIG);
  copyFileSync(HEARTH_CONFIG, PIDAKA_CONFIG);
  try {
    execSync(command, { stdio: "inherit", env: process.env });
  } finally {
    copyFileSync(BACKUP_CONFIG, PIDAKA_CONFIG);
  }
}

const action = process.argv[2];
if (!action) {
  console.error("Usage: tsx script/cap-hearth.ts <sync|open|add-android>");
  process.exit(1);
}

switch (action) {
  case "sync":
    withHearthConfig("npx cap sync android");
    break;
  case "open":
    withHearthConfig("npx cap open android");
    break;
  case "add-android":
    withHearthConfig("npx cap add android");
    break;
  default:
    console.error(`Unknown action: ${action}`);
    process.exit(1);
}
