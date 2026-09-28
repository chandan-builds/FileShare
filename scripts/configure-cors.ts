import { configureBucketCors } from "../lib/r2";
import { loadLocalEnv } from "./load-env";

loadLocalEnv();

async function main() {
  const origins = await configureBucketCors();
  console.log("R2 CORS updated for origins:");
  for (const origin of origins) {
    console.log(`- ${origin}`);
  }
}

main().catch((error) => {
  console.error("Failed to configure R2 CORS.");
  console.error(error instanceof Error ? error.message : "Unknown error");
  process.exit(1);
});
