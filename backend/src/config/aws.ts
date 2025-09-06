import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Generate a presigned URL for uploading to S3
 */
export const generatePresignedUrl = async (
  key: string,
  contentType: string,
  expiresIn: number = 300 // in seconds
) => {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    ContentType: contentType,
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    console.log(url);
    return {
      url,
      key,
      expires: new Date(Date.now() + expiresIn * 1000),
    };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to generate presigned URL");
  }
};

/**
 * Get the public URL for a stored S3 object
 */
export const getFileUrl = (key: string): string => {
  return `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};
