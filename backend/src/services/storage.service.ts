import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { lookup as mimeLookup } from 'mime-types';

let _s3: S3Client | null = null;
function getS3(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _s3;
}

const bucket = () => process.env.R2_BUCKET_NAME!;
const publicUrl = () => process.env.R2_PUBLIC_URL!;

export async function uploadBuffer(
  buffer: Buffer,
  key: string,
  contentType: string,
  options: { disposition?: 'attachment' | 'inline' } = {}
): Promise<string> {
  await getS3().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ...(options.disposition ? { ContentDisposition: options.disposition } : {}),
    })
  );
  return `${publicUrl()}/${key}`;
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getS3(), command, { expiresIn: 300 });
}

export async function downloadAndUpload(
  sourceUrl: string,
  key: string,
  options: { disposition?: 'attachment' | 'inline' } = {}
): Promise<string> {
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`Failed to fetch ${sourceUrl}: ${response.statusText}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType =
    response.headers.get('content-type') ??
    (mimeLookup(key) || 'application/octet-stream');

  return uploadBuffer(buffer, key, contentType, options);
}

export function generateKey(prefix: string, id: string, ext: string): string {
  return `${prefix}/${id}.${ext}`;
}
