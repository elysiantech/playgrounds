import { S3Client, GetObjectCommand, GetObjectCommandOutput, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { Readable } from "stream";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'


const MIME_TYPE: { [key: string]: string } = {
  '.gif': 'image/gif',
  '.htm': 'text/html',
  '.html': 'text/html',
  '.php': 'text/plain',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.zip': 'application/zip'
};

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
export async function uploadToS3(buffer: Buffer, filename: string) {
  try {
    const bucketName = process.env.AWS_BUCKET!; // Ensure the bucket name is set
    const fileExtension = filename.substring(filename.lastIndexOf("."));
    const mimeType = MIME_TYPE[fileExtension] || "application/octet-stream"; // Fallback to octet-stream

    // S3 PutObject command
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filename,
      Body: buffer,
      ContentType: `${mimeType}; charset=utf-8`,
    });

    // Execute the upload
    await s3Client.send(command);

    // Construct the file's URL
    const fileUrl = await getUrlFromS3(filename);
    return fileUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload image to S3');
  }
}

export async function readFromS3(key: string): Promise<{ stream: Readable; contentType: string }> {
  try {
    const bucketName = process.env.AWS_BUCKET!;
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response: GetObjectCommandOutput = await s3Client.send(command);

    if (!response.Body) {
      throw new Error("File content is empty or missing");
    }

    const contentType = response.ContentType || "application/octet-stream";
    const stream = response.Body as Readable;

    return { stream, contentType };
  } catch (error) {
    console.error("Error downloading file from S3:", error);
    throw new Error("Failed to download file from S3");
  }
}

export async function deleteFromS3(key:string){
  try {
    const bucketName = process.env.AWS_BUCKET!; // Ensure the bucket name is set

    // S3 DeleteObject command
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key, // The key of the object to delete
    });

    // Execute the deletion
    await s3Client.send(command);

    console.log(`Successfully deleted ${key} from bucket ${bucketName}`);
    return { success: true, message: `Deleted ${key}` };
  } catch (error) {
    console.error("Error deleting from S3:", error);
    throw new Error("Failed to delete object from S3");
  }
}


