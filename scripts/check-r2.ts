import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getR2Client, getBucketName, getUsedStorageBytes } from "../lib/r2";
import { getFreeTierStorageBytes, getFreeTierStorageGb } from "../lib/env";
import { loadLocalEnv } from "./load-env";

loadLocalEnv();

async function main() {
  const listed = await getR2Client().send(
    new ListObjectsV2Command({
      Bucket: getBucketName(),
      MaxKeys: 20,
    }),
  );
  const used = await getUsedStorageBytes();
  const limit = getFreeTierStorageBytes();
  const keys = (listed.Contents ?? []).map((object) => object.Key ?? "");
  const metadata = keys.filter((key) => key.startsWith("metadata/"));
  console.log("bucket_ok", listed.$metadata.httpStatusCode === 200);
  console.log("object_count", keys.length);
  console.log("sample_share", metadata[0]?.replace("metadata/", "").replace(".json", "") ?? "");
  console.log("used_bytes", used);
  console.log("cap_gb", getFreeTierStorageGb());
  console.log("remaining_bytes", Math.max(0, limit - used));
}

main().catch((error) => {
  console.error("R2 check failed");
  console.error(error instanceof Error ? error.name : "Unknown");
  process.exit(1);
});
