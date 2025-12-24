import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { Resource } from "sst";
import { logger } from "../utils/logger";

const TABLE = Resource.Category.name;
const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, ...data }),
});

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    logger.info("Received request to create a new category");
    if (!event.body) return sendResponse(400, "Request body missing");
    const { name, description, image } = JSON.parse(event.body); // ✅ read image here
    logger.info("Name:", name);
    if (!name) return sendResponse(400, "Category name required");

    // ✅ Check for existing category (case-insensitive)
    const existing = await dynamoDb.send(
      new ScanCommand({
        TableName: TABLE,
        FilterExpression: "contains(#name_lower, :name_lower)",
        ExpressionAttributeNames: { "#name_lower": "nameLower" },
        ExpressionAttributeValues: { ":name_lower": name.toLowerCase() },
      })
    );
    logger.info("Existing categories:", existing.Items);
    if (existing.Count && existing.Count > 0)
      return sendResponse(400, "Category already exists");

    // ✅ Create category record
    const categoryId = uuidv4();
    const category = {
      categoryId,
      name,
      nameLower: name.toLowerCase(),
      description,
      image: image || null, // ✅ store image URL directly
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    logger.info("Category to be created:", category);
    await dynamoDb.send(new PutCommand({ TableName: TABLE, Item: category }));

    return sendResponse(201, "Category created successfully", { category });
  } catch (err) {
    console.error("❌ Error creating category:", err);
    return sendResponse(500, "Error creating category", { error: String(err) });
  }
};
