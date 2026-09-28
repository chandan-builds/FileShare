import { readFileSync } from "node:fs";

async function main() {
  const file = readFileSync("tmp-test-upload.txt");
  const start = await fetch("http://localhost:3000/api/upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      fileName: "tmp-test-upload.txt",
      contentType: "text/plain",
      size: file.length,
      expiresIn: "1h",
    }),
  });
  const startJson = (await start.json()) as {
    shareId?: string;
    objectKey?: string;
    uploadUrl?: string;
    code?: string;
  };
  if (!start.ok || !startJson.uploadUrl || !startJson.shareId || !startJson.objectKey) {
    console.log("upload_url_failed", start.status, startJson.code);
    process.exit(1);
  }

  const put = await fetch(startJson.uploadUrl, {
    method: "PUT",
    headers: { "content-type": "text/plain" },
    body: file,
  });
  if (!put.ok) {
    console.log("put_failed", put.status);
    process.exit(1);
  }

  const complete = await fetch("http://localhost:3000/api/complete-upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      shareId: startJson.shareId,
      objectKey: startJson.objectKey,
      fileName: "tmp-test-upload.txt",
      contentType: "text/plain",
      size: file.length,
      expiresIn: "1h",
    }),
  });
  const completeJson = (await complete.json()) as { code?: string; originalFileName?: string };
  if (!complete.ok) {
    console.log("complete_failed", complete.status, completeJson.code);
    process.exit(1);
  }

  const share = await fetch(`http://localhost:3000/api/share/${startJson.shareId}`);
  const shareJson = (await share.json()) as { originalFileName?: string };
  const download = await fetch(`http://localhost:3000/api/download/${startJson.shareId}`);
  const downloadJson = (await download.json()) as { downloadUrl?: string };
  if (!downloadJson.downloadUrl) {
    console.log("download_url_missing");
    process.exit(1);
  }
  const fileGet = await fetch(downloadJson.downloadUrl);
  const text = await fileGet.text();

  const tooLarge = await fetch("http://localhost:3000/api/upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      fileName: "big.txt",
      contentType: "text/plain",
      size: 3 * 1024 * 1024 * 1024,
      expiresIn: "1h",
    }),
  });
  const tooLargeJson = (await tooLarge.json()) as { code?: string };

  console.log(
    JSON.stringify({
      uploadUrlStatus: start.status,
      putStatus: put.status,
      completeStatus: complete.status,
      shareStatus: share.status,
      shareName: shareJson.originalFileName,
      downloadStatus: download.status,
      downloaded: text.trim(),
      fileTooLargeCode: tooLargeJson.code,
      fileTooLargeStatus: tooLarge.status,
      shareIdOk: /^[0-9a-f-]{36}$/i.test(startJson.shareId),
    }),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "smoke failed");
  process.exit(1);
});
