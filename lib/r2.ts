import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAllowedCorsOrigins, getR2Config } from "@/lib/env";
import { AppError, isR2AuthError, isR2TimeoutError } from "@/lib/errors";
import type { ShareMetadata } from "@/types/file";
import { metadataKey } from "@/lib/file-utils";

let cachedClient: S3Client | null = null;

export function getR2Client(): S3Client {
  if (cachedClient) return cachedClient;

  const config = getR2Config();
  cachedClient = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  return cachedClient;
}

export function getBucketName(): string {
  return getR2Config().bucketName;
}

function wrapR2Error(error: unknown, fallback: string): never {
  if (error instanceof AppError) throw error;
  if (isR2AuthError(error)) {
    throw new AppError(
      "Storage is temporarily unavailable. Please try again later.",
      503,
      "STORAGE_AUTH",
    );
  }
  if (isR2TimeoutError(error)) {
    throw new AppError(
      "The storage request timed out. Please try again.",
      504,
      "STORAGE_TIMEOUT",
    );
  }
  console.error(fallback, error);
  throw new AppError(fallback, 502, "STORAGE_ERROR");
}

export async function createPresignedPutUrl(input: {
  objectKey: string;
  contentType: string;
  expiresIn?: number;
}): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: getBucketName(),
      Key: input.objectKey,
      ContentType: input.contentType,
    });
    return await getSignedUrl(getR2Client(), command, {
      expiresIn: input.expiresIn ?? 60 * 60,
    });
  } catch (error) {
    wrapR2Error(error, "Could not prepare the upload.");
  }
}

export async function createPresignedGetUrl(input: {
  objectKey: string;
  fileName: string;
  contentType: string;
  expiresIn?: number;
}): Promise<string> {
  try {
    const safeName = input.fileName.replace(/"/g, "");
    const command = new GetObjectCommand({
      Bucket: getBucketName(),
      Key: input.objectKey,
      ResponseContentDisposition: `attachment; filename="${safeName}"`,
      ResponseContentType: input.contentType,
    });
    return await getSignedUrl(getR2Client(), command, {
      expiresIn: input.expiresIn ?? 10 * 60,
    });
  } catch (error) {
    wrapR2Error(error, "Could not prepare the download.");
  }
}

export async function headObject(objectKey: string) {
  try {
    return await getR2Client().send(
      new HeadObjectCommand({
        Bucket: getBucketName(),
        Key: objectKey,
      }),
    );
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } })
      .$metadata?.httpStatusCode;
    if (status === 404 || (error as { name?: string }).name === "NotFound") {
      throw new AppError("The file could not be found.", 404, "FILE_NOT_FOUND");
    }
    wrapR2Error(error, "Could not verify the uploaded file.");
  }
}

export async function putJsonObject(objectKey: string, value: unknown) {
  try {
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: getBucketName(),
        Key: objectKey,
        Body: JSON.stringify(value),
        ContentType: "application/json",
      }),
    );
  } catch (error) {
    wrapR2Error(error, "Could not save share information.");
  }
}

export async function getJsonObject<T>(objectKey: string): Promise<T> {
  try {
    const response = await getR2Client().send(
      new GetObjectCommand({
        Bucket: getBucketName(),
        Key: objectKey,
      }),
    );
    const text = await response.Body?.transformToString();
    if (!text) {
      throw new AppError("Share information is missing.", 404, "METADATA_MISSING");
    }
    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof AppError) throw error;
    const status = (error as { $metadata?: { httpStatusCode?: number } })
      .$metadata?.httpStatusCode;
    if (status === 404 || (error as { name?: string }).name === "NoSuchKey") {
      throw new AppError("This share link is invalid or the file was removed.", 404, "METADATA_MISSING");
    }
    wrapR2Error(error, "Could not load share information.");
  }
}

export async function getShareMetadata(shareId: string): Promise<ShareMetadata> {
  return getJsonObject<ShareMetadata>(metadataKey(shareId));
}

export async function saveShareMetadata(metadata: ShareMetadata) {
  await putJsonObject(metadataKey(metadata.shareId), metadata);
}

export async function deleteObject(objectKey: string) {
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: objectKey,
    }),
  );
}

export async function listMetadataKeys(continuationToken?: string) {
  return getR2Client().send(
    new ListObjectsV2Command({
      Bucket: getBucketName(),
      Prefix: "metadata/",
      ContinuationToken: continuationToken,
    }),
  );
}

export async function getUsedStorageBytes(): Promise<number> {
  try {
    let continuationToken: string | undefined;
    let total = 0;
    do {
      const page = await getR2Client().send(
        new ListObjectsV2Command({
          Bucket: getBucketName(),
          ContinuationToken: continuationToken,
        }),
      );
      for (const object of page.Contents ?? []) {
        total += object.Size ?? 0;
      }
      continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (continuationToken);
    return total;
  } catch (error) {
    wrapR2Error(error, "Could not check remaining storage.");
  }
}

export async function configureBucketCors() {
  const origins = getAllowedCorsOrigins();
  await getR2Client().send(
    new PutBucketCorsCommand({
      Bucket: getBucketName(),
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: origins,
            AllowedMethods: ["GET", "PUT", "HEAD"],
            AllowedHeaders: ["Content-Type", "Content-Length"],
            ExposeHeaders: ["ETag", "Content-Length", "Content-Type"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );
  return origins;
}
