import { APIGatewayProxyEvent } from "aws-lambda";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, ReturnValue } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";
import dotenv from "dotenv";
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

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    const { id } = event.pathParameters || {};
    
    if (!id || !event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Item ID and body are required" }),
      };
    }

    const updates = JSON.parse(event.body);

    // Get existing item
    const existingItemData = await dynamoDb.send(
      new GetCommand({
        TableName: Resource.Item.name,
        Key: { itemId: id },
      })
    );

    const existingItem = existingItemData.Item;
    if (!existingItem) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Item not found" }),
      };
    }

    let finalImages = existingItem.images || [];

    // Handle image uploads
    if (updates.files && updates.files.length > 0) {
      // Delete old images from S3
      for (const imageUrl of finalImages) {
        try {
          const key = imageUrl.split("/").pop()!;
          await s3.send(
            new DeleteObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME!,
              Key: key,
            })
          );
        } catch {}
      }

      // Upload new images
      finalImages = [];
      for (const file of updates.files) {
        const fileName = randomFileName();
        const buffer = Buffer.from(file.data, "base64");

        await s3.send(
          new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: fileName,
            Body: buffer,
            ContentType: file.type,
          })
        );

        finalImages.push(
          `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`
        );
      }

      updates.images = finalImages;
      delete updates.files; // Remove files from updates object
    } else if (updates.images && Array.isArray(updates.images)) {
      updates.images = updates.images;
    }

    // Normalize availableBranches to array
    if (updates.availableBranches && !Array.isArray(updates.availableBranches)) {
      updates.availableBranches = [updates.availableBranches];
    }

    // Always update timestamp
    updates.updatedAt = Date.now();

    // Remove any undefined or null values
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined || updates[key] === null) {
        delete updates[key];
      }
    });

    // Prevent empty updates
    if (Object.keys(updates).length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No fields provided for update" }),
      };
    }

    // Build dynamic update expressions
    const updateExpression = Object.keys(updates)
      .map((key) => `#${key} = :${key}`)
      .join(", ");

    const expressionAttributeValues = Object.fromEntries(
      Object.entries(updates).map(([k, v]) => [`:${k}`, v])
    );

    const expressionAttributeNames = Object.fromEntries(
      Object.keys(updates).map((k) => [`#${k}`, k])
    );

    const params = {
      TableName: Resource.Item.name,
      Key: { itemId: id },
      UpdateExpression: "SET " + updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ReturnValues: "ALL_NEW" as ReturnValue,
    };

    const result = await dynamoDb.send(new UpdateCommand(params));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Item updated successfully",
        data: result.Attributes,
      }),
    };
  } catch (error) {
    console.error("Item update error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};