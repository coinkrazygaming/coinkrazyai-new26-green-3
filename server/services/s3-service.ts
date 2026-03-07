import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return s3Client;
}

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'coinkrazy-files';

export class S3Service {
  static async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folder: string = 'general',
    isPrivate: boolean = false
  ) {
    try {
      const key = `${folder}/${Date.now()}-${fileName}`;
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        ACL: isPrivate ? 'private' : 'public-read',
      });

      const client = getS3Client();
      await client.send(command);
      const fileUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
      return { success: true, url: fileUrl, key };
    } catch (error) {
      console.error('S3 upload error:', error);
      return { success: false, error: String(error) };
    }
  }

  static async uploadKYCDocument(
    fileBuffer: Buffer,
    fileName: string,
    playerId: number,
    documentType: string
  ) {
    return this.uploadFile(fileBuffer, fileName, 'application/pdf', `kyc/${playerId}/${documentType}`, true);
  }

  static async uploadGameAsset(
    fileBuffer: Buffer,
    fileName: string,
    gameId: number,
    assetType: string
  ) {
    return this.uploadFile(fileBuffer, fileName, 'image/png', `games/${gameId}/${assetType}`);
  }

  static async uploadUserAvatar(fileBuffer: Buffer, fileName: string, playerId: number) {
    const mimeType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return this.uploadFile(fileBuffer, fileName, mimeType, `avatars/${playerId}`);
  }

  static async uploadPromoAsset(fileBuffer: Buffer, fileName: string, promoId: number) {
    const mimeType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return this.uploadFile(fileBuffer, fileName, mimeType, `promotions/${promoId}`);
  }

  static async deleteFile(key: string) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });
      const client = getS3Client();
      await client.send(command);
      return { success: true };
    } catch (error) {
      console.error('S3 delete error:', error);
      return { success: false, error: String(error) };
    }
  }

  static async getSignedDownloadUrl(key: string, expiresIn: number = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });
      const client = getS3Client();
      const url = await getSignedUrl(client, command, { expiresIn });
      return { success: true, url };
    } catch (error) {
      console.error('S3 signed URL error:', error);
      return { success: false, error: String(error) };
    }
  }

  static async listFiles(folder: string, maxKeys: number = 1000) {
    try {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: folder,
        MaxKeys: maxKeys,
      });
      const client = getS3Client();
      const response = await client.send(command);
      return {
        success: true,
        files: response.Contents || [],
        continuationToken: response.NextContinuationToken,
      };
    } catch (error) {
      console.error('S3 list files error:', error);
      return { success: false, error: String(error) };
    }
  }

  static async generatePresignedUploadUrl(
    fileName: string,
    mimeType: string,
    folder: string = 'general',
    expiresIn: number = 3600
  ) {
    try {
      const key = `${folder}/${Date.now()}-${fileName}`;
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: mimeType,
      });
      const client = getS3Client();
      const url = await getSignedUrl(client, command, { expiresIn });
      return { success: true, uploadUrl: url, key };
    } catch (error) {
      console.error('S3 presigned URL error:', error);
      return { success: false, error: String(error) };
    }
  }

  static async createSecureFileKey(fileType: string, associatedId: string): Promise<string> {
    const randomString = crypto.randomBytes(8).toString('hex');
    return `${fileType}/${associatedId}/${randomString}`;
  }
}
