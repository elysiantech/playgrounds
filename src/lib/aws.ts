import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
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

// Helper function to upload base64 image to S3 and get a URL
export async function uploadBase64ToS3(base64Image: string, filename: string) {
  try {
    const buffer = Buffer.from(base64Image, 'base64'); // Convert base64 to binary buffer
    const bucketName = process.env.AWS_BUCKET!; // Ensure the bucket name is set

    // S3 PutObject command
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filename,
      Body: buffer,
      ContentType: 'image/png', // Assuming PNG format; adjust if needed
      // ACL: 'public-read', // Optional: Makes the file publicly accessible
    });

    // Execute the upload
    await s3Client.send(command);

    // Construct the file's URL
    const fileUrl = await getUrlFromS3(filename);
    // const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
    return fileUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload image to S3');
  }
}
