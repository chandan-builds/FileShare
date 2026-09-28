import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadLocalEnv() {
  for (const fileName of [".env.local", ".env"]) {
    try {
      const text = readFileSync(resolve(process.cwd(), fileName), "utf8");
      for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const eq = line.indexOf("=");
        if (eq <= 0) continue;
        const key = line.slice(0, eq).trim();
        let value = line.slice(eq + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    } catch {
      // File is optional.
    }
  }
}
