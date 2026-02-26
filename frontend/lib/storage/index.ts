import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// -----------------------------------------------------------------------------
// S3 Client (works with AWS S3, Cloudflare R2, MinIO)
// -----------------------------------------------------------------------------

const s3Config: ConstructorParameters<typeof S3Client>[0] = {
  region: process.env.S3_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
};

if (process.env.S3_ENDPOINT) {
  s3Config.endpoint = process.env.S3_ENDPOINT;
  s3Config.forcePathStyle = true;
}

const s3 = new S3Client(s3Config);
const BUCKET = process.env.S3_BUCKET || 'cinepilot-assets';

// -----------------------------------------------------------------------------
// Storage Path Conventions
// -----------------------------------------------------------------------------

export const STORAGE_PATHS = {
  scripts:     (projectId: string, filename: string) => `projects/${projectId}/scripts/${filename}`,
  storyboard:  (projectId: string, frameId: string)  => `projects/${projectId}/storyboard/${frameId}`,
  invoices:    (projectId: string, filename: string) => `projects/${projectId}/invoices/${filename}`,
  locations:   (projectId: string, filename: string) => `projects/${projectId}/locations/${filename}`,
  exports:     (projectId: string, filename: string) => `projects/${projectId}/exports/${filename}`,
  avatars:     (userId: string, filename: string)    => `users/${userId}/avatars/${filename}`,
} as const;

// -----------------------------------------------------------------------------
// Upload
// -----------------------------------------------------------------------------

export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | ReadableStream | Blob,
  contentType: string,
  metadata?: Record<string, string>
): Promise<{ key: string; url: string }> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body as Buffer,
      ContentType: contentType,
      Metadata: metadata,
    })
  );

  return {
    key,
    url: await getPublicUrl(key),
  };
}

export async function uploadScript(
  projectId: string,
  filename: string,
  body: Buffer,
  contentType: string
): Promise<{ key: string; url: string }> {
  const key = STORAGE_PATHS.scripts(projectId, filename);
  return uploadFile(key, body, contentType);
}

export async function uploadStoryboardFrame(
  projectId: string,
  frameId: string,
  body: Buffer
): Promise<{ key: string; url: string }> {
  const key = STORAGE_PATHS.storyboard(projectId, `${frameId}.png`);
  return uploadFile(key, body, 'image/png');
}

export async function uploadInvoice(
  projectId: string,
  filename: string,
  body: Buffer,
  contentType: string
): Promise<{ key: string; url: string }> {
  const key = STORAGE_PATHS.invoices(projectId, filename);
  return uploadFile(key, body, contentType);
}

// -----------------------------------------------------------------------------
// Download / Read
// -----------------------------------------------------------------------------

export async function downloadFile(key: string): Promise<Buffer> {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );

  const stream = response.Body;
  if (!stream) throw new Error(`File not found: ${key}`);

  const chunks: Uint8Array[] = [];
  const reader = (stream as ReadableStream).getReader();
  let done = false;
  while (!done) {
    const result = await reader.read();
    done = result.done;
    if (result.value) chunks.push(result.value);
  }

  return Buffer.concat(chunks);
}

// -----------------------------------------------------------------------------
// Signed URLs (for client-side access)
// -----------------------------------------------------------------------------

export async function getPublicUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn }
  );
}

export async function getUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 600
): Promise<string> {
  return getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn }
  );
}

// -----------------------------------------------------------------------------
// Delete
// -----------------------------------------------------------------------------

export async function deleteFile(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  );
}

// -----------------------------------------------------------------------------
// List
// -----------------------------------------------------------------------------

export async function listFiles(prefix: string): Promise<string[]> {
  const response = await s3.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
    })
  );

  return (response.Contents || [])
    .map((item) => item.Key!)
    .filter(Boolean);
}
