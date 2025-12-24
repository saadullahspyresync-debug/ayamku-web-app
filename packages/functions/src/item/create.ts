import { APIGatewayProxyEvent } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";
import * as dotenv from "dotenv";
import { Resource } from "sst";

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const randomFileName = (bytes = 16) => crypto.randomBytes(bytes).toString("hex");

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, data }),
});

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    
    if (!event.body) return sendResponse(400, "No body provided");
    const body = JSON.parse(event.body);

    const uploadedFiles: string[] = [];

    // Upload images if any (event.files structure depends on your Lambda setup, e.g., API Gateway multipart)
    // Here, assume base64 encoded files: body.files = [{ name, type, data }]
    if (body.files && body.files.length > 0) {
      for (const file of body.files) {
        const fileName = randomFileName();
        const buffer = Buffer.from(file.data, "base64");

        await s3.send(new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: fileName,
          Body: buffer,
          ContentType: file.type,
        }));

        uploadedFiles.push(`https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`);
      }
    }

    if (uploadedFiles.length > 0) body.images = uploadedFiles;

    if (body.availableBranches && !Array.isArray(body.availableBranches)) {
      body.availableBranches = [body.availableBranches];
    }

    const item = {
      ...body,
      itemId: crypto.randomUUID(),
      isCombo: false,
      comboItems: [],
      createdAt: Date.now(),
    };

    await dynamoDb.send(new PutCommand({
      TableName: Resource.Item.name,
      Item: item,
    }));

    return sendResponse(201, "Item created successfully", item);
  } catch (error) {
    return sendResponse(500, "Error creating item", { error: String(error) });
  }
};
