import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.UPLOAD_BUCKET || 'transconnect-agents';

export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  agentId: string
): Promise<{ uploadUrl: string; fileKey: string }> {
  const fileKey = `kyc/${agentId}/${crypto.randomUUID()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
    ContentType: contentType,
    Metadata: {
      agentId,
      uploadedAt: new Date().toISOString(),
    },
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  
  return { uploadUrl, fileKey };
}

export async function generatePresignedDownloadUrl(fileKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export async function uploadBuffer(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  agentId: string
): Promise<string> {
  const fileKey = `kyc/${agentId}/${crypto.randomUUID()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
    Body: buffer,
    ContentType: contentType,
    Metadata: {
      agentId,
      uploadedAt: new Date().toISOString(),
    },
  });

  await s3Client.send(command);
  return fileKey;
}

export function getPublicUrl(fileKey: string): string {
  return `https://${BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileKey}`;
}