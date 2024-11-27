import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from "uuid";

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

export async function generateAndUploadSharePage({
  imageUrl,
  redirectUrl,
  description,
}: {
  imageUrl: string;
  redirectUrl: string;
  description: string;
}): Promise<string> {
  // Generate a unique identifier
  const id = uuidv4();

  // Generate the HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="og:title" content="Generated Image" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:url" content="${process.env.NEXTAUTH_URL}/share/${id}" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Generated Image" />
        <meta name="twitter:description" content="${description}" />
        <meta name="twitter:image" content="${imageUrl}" />
        <meta http-equiv="refresh" content="0;url=${redirectUrl}" />
        <title>Redirecting...</title>
      </head>
      <body>
        <p>If you are not redirected automatically, <a href="${redirectUrl}">click here</a>.</p>
      </body>
    </html>
  `;

  // Upload the HTML file to S3
  const bucketName = process.env.AWS_BUCKET;
  const key = `${id}.html`;
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: htmlContent,
    ContentType: "text/html",
  });

  await s3Client.send(command);
  return id;
}

export async function downloadFromS3(key: string): Promise<string> {
  try {
    const bucketName = process.env.AWS_BUCKET!;
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);
    const fileContent = await response.Body?.transformToString();

    if (!fileContent) {
      throw new Error("File content is empty or missing");
    }

    return fileContent;
  } catch (error) {
    console.error("Error downloading file from S3:", error);
    throw new Error("Failed to download file from S3");
  }
}
