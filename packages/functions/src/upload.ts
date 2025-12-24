import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Resource } from "sst";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { randomBytes } from "crypto";

// Initialize clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

const sendResponse = (status: number, message: string, data?: any): APIGatewayProxyResult => ({
  statusCode: status,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify({ message, ...data }),
});

// Generate unique filename
const randomFileName = (originalName: string, bytes = 16): string => {
  const randomName = randomBytes(bytes).toString("hex");
  const extension = originalName.split(".").pop();
  return `${randomName}.${extension}`;
};

// Parse multipart form data
const parseMultipartFormData = (event: APIGatewayProxyEvent) => {
  const contentType = event.headers["content-type"] || event.headers["Content-Type"];
  if (!contentType || !contentType.includes("multipart/form-data")) {
    throw new Error("Content-Type must be multipart/form-data");
  }

  const boundary = contentType.split("boundary=")[1];
  if (!boundary) {
    throw new Error("Boundary not found in Content-Type");
  }

  const body = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64")
    : Buffer.from(event.body || "", "utf-8");

  const parts: Array<{
    name: string;
    filename?: string;
    contentType?: string;
    data: Buffer;
  }> = [];

  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const sections = [];
  let start = 0;

  while (start < body.length) {
    const boundaryIndex = body.indexOf(boundaryBuffer, start);
    if (boundaryIndex === -1) break;

    const nextBoundaryIndex = body.indexOf(boundaryBuffer, boundaryIndex + boundaryBuffer.length);
    if (nextBoundaryIndex === -1) break;

    sections.push(body.slice(boundaryIndex + boundaryBuffer.length, nextBoundaryIndex));
    start = nextBoundaryIndex;
  }

  for (const section of sections) {
    const headerEndIndex = section.indexOf("\r\n\r\n");
    if (headerEndIndex === -1) continue;

    const headers = section.slice(0, headerEndIndex).toString();
    const data = section.slice(headerEndIndex + 4, section.length - 2);

    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);
    const contentTypeMatch = headers.match(/Content-Type: (.+)/i);

    if (nameMatch) {
      parts.push({
        name: nameMatch[1],
        filename: filenameMatch?.[1],
        contentType: contentTypeMatch?.[1]?.trim(),
        data,
      });
    }
  }

  return parts;
};

export const main = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    
  try {
    // Parse multipart form data
    const parts = parseMultipartFormData(event);
    
    // Filter for image files
    const imageFiles = parts.filter(
      (part) => part.filename && part.contentType?.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      return sendResponse(400, "No image files found in request");
    }

    const uploadedFiles: Array<{
      url: string;
      key: string;
      size: number;
      contentType: string;
    }> = [];

    // Upload each file to S3
    for (const file of imageFiles) {
      if (!file.filename || !file.contentType) continue;

      const fileName = randomFileName(file.filename);
      const uploadParams = {
        Bucket: Resource.AyamkuWeb.name,
        Key: fileName,
        Body: file.data,
        ContentType: file.contentType,
      };

      await s3Client.send(new PutObjectCommand(uploadParams));

      const fileUrl = `https://${Resource.AyamkuWeb.name}.s3.amazonaws.com/${fileName}`;

      uploadedFiles.push({
        url: fileUrl,
        key: fileName,
        size: file.data.length,
        contentType: file.contentType,
      });

      // Optional: Save metadata to DynamoDB
      // await docClient.send(
      //   new PutCommand({
      //     TableName: Resource.MyTable.name,
      //     Item: {
      //       id: fileName,
      //       url: fileUrl,
      //       size: file.data.length,
      //       contentType: file.contentType,
      //       uploadedAt: new Date().toISOString(),
      //       userId: event.requestContext.authorizer?.claims?.sub, // From Cognito
      //     },
      //   })
      // );
    }

    return sendResponse(200, "Files uploaded successfully", {
      files: uploadedFiles,
      count: uploadedFiles.length,
    });
  } catch (err) {
    console.error("Upload Error:", err);
    return sendResponse(500, "Upload failed", {
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};