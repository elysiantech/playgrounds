import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  })
  
export async function getUrlFromS3(key: string) {
    const getCommand = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET as string,
        Key: key,
      })
    const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 24*3600 })
    return signedUrl;
}
