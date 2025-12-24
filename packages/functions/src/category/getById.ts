import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent } from "aws-lambda";
import { Resource } from "sst";

const TABLE = Resource.Category.name;
const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, ...data }),
});

export const main = async (event:APIGatewayProxyEvent) => {
  try {
    const categoryId = event.pathParameters?.id;
    if (!categoryId) return sendResponse(400, "Category ID required");

    const result = await dynamoDb.send(new GetCommand({ TableName: TABLE, Key: { categoryId } }));
    if (!result.Item) return sendResponse(404, "Category not found");

    return sendResponse(200, "Category fetched successfully", { category: result.Item });
  } catch (err) {
    return sendResponse(500, "Error fetching category", { error: String(err) });
  }
};
