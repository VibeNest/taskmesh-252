import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createChildLogger } from './logger';
import crypto from 'crypto';

const log = createChildLogger('storage');

interface StorageConfig {
  region: string;
  endpoint?: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl?: string;
  forcePathStyle: boolean;
}

interface UploadResult {
  key: string;
  url: string;
  presignedUrl: string;
}

const config: StorageConfig = {
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  bucket: process.env.S3_BUCKET || 'taskmesh-uploads',
  accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
  publicUrl: process.env.S3_PUBLIC_URL,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
};

let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;
  client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: config.forcePathStyle,
  });
  return client;
}

export class StorageService {
  private bucket: string;

  constructor() {
    this.bucket = config.bucket;
  }

  async ensureBucket(): Promise<void> {
    try {
      const { HeadBucketCommand } = await import('@aws-sdk/client-s3');
      await getClient().send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        const { CreateBucketCommand } = await import('@aws-sdk/client-s3');
        const createParams: Record<string, unknown> = { Bucket: this.bucket };
        if (config.region !== 'us-east-1') {
          createParams.CreateBucketConfiguration = { LocationConstraint: config.region };
        }
        await getClient().send(new CreateBucketCommand(createParams as any));
        log.info({ bucket: this.bucket }, 'Bucket created');
      } catch (err) {
        log.error({ err, bucket: this.bucket }, 'Failed to create bucket');
      }
    }
  }

  getKey(workspaceId: string, entityType: string, fileName: string): string {
    const id = crypto.randomUUID();
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${workspaceId}/${entityType}/${id}/${sanitized}`;
  }

  async generatePresignedUploadUrl(
    workspaceId: string,
    entityType: string,
    fileName: string,
    contentType: string,
    expiresIn = 3600
  ): Promise<UploadResult> {
    const key = this.getKey(workspaceId, entityType, fileName);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(getClient(), command, { expiresIn });

    const url = config.publicUrl
      ? `${config.publicUrl}/${this.bucket}/${key}`
      : `${config.endpoint || ''}/${this.bucket}/${key}`;

    return { key, url, presignedUrl };
  }

  async generatePresignedDownloadUrl(
    key: string,
    expiresIn = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(getClient(), command, { expiresIn });
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await getClient().send(command);
      log.info({ key }, 'File deleted');
    } catch (err) {
      log.error({ err, key }, 'Failed to delete file');
      throw err;
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    workspaceId: string,
    entityType: string,
    fileName: string,
    contentType: string
  ): Promise<UploadResult> {
    const key = this.getKey(workspaceId, entityType, fileName);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await getClient().send(command);

    const url = config.publicUrl
      ? `${config.publicUrl}/${this.bucket}/${key}`
      : `${config.endpoint || ''}/${this.bucket}/${key}`;

    const presignedUrl = await getSignedUrl(getClient(), new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }), { expiresIn: 3600 });

    return { key, url, presignedUrl };
  }
}

export const storage = new StorageService();
