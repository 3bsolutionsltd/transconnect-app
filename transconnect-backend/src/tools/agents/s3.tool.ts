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
  // Use demo mode if explicitly enabled OR if AWS credentials are not configured
  const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
  const isDemoMode = process.env.DEMO_MODE === 'true' || !hasAwsCredentials;
  const fileKey = `kyc/${agentId}/${crypto.randomUUID()}-${fileName}`;
  
  console.log(`🔍 [S3 TOOL] Upload mode detection:`);
  console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`- DEMO_MODE: ${process.env.DEMO_MODE}`);
  console.log(`- Has AWS credentials: ${hasAwsCredentials}`);
  console.log(`- Using demo mode: ${isDemoMode}`);
  
  if (isDemoMode) {
    console.log(`📄 [DEMO MODE] KYC file upload simulation:`);
    console.log(`- File: ${fileName}`);
    console.log(`- Type: ${contentType}`);
    console.log(`- Agent: ${agentId}`);
    console.log(`- File Key: ${fileKey}`);
    console.log(`(In production, this would generate AWS S3 presigned URL)`);
    
    // Return a special demo mode indicator instead of fake URL
    return { 
      uploadUrl: `DEMO_MODE:${fileKey}`,
      fileKey 
    };
  }
  
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