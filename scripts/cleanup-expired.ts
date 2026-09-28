import { deleteObject, getJsonObject, listMetadataKeys } from "../lib/r2";
import { metadataKey } from "../lib/file-utils";
import { isExpired } from "../lib/validation";
import type { ShareMetadata } from "../types/file";
import { loadLocalEnv } from "./load-env";

loadLocalEnv();

async function main() {
  let continuationToken: string | undefined;
  let scanned = 0;
  let deleted = 0;

  do {
    const page = await listMetadataKeys(continuationToken);
    for (const object of page.Contents ?? []) {
      if (!object.Key?.endsWith(".json")) continue;
      scanned += 1;
      try {
        const metadata = await getJsonObject<ShareMetadata>(object.Key);
        if (!isExpired(metadata.expiresAt)) continue;
        await deleteObject(metadata.objectKey);
        await deleteObject(metadataKey(metadata.shareId));
        deleted += 1;
        console.log(`Deleted expired share ${metadata.shareId}`);
      } catch (error) {
        console.error(
          `Skipped ${object.Key}:`,
          error instanceof Error ? error.message : "unknown error",
        );
      }
    }
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);

  console.log(`Cleanup complete. Scanned ${scanned} metadata objects, deleted ${deleted}.`);
}

main().catch((error) => {
  console.error("Expired-file cleanup failed.");
  console.error(error instanceof Error ? error.message : "Unknown error");
  process.exit(1);
});
