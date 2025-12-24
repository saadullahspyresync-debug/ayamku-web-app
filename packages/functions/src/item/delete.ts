import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, data }),
});

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    const { id } = event.pathParameters || {};
    if (!id) return sendResponse(400, "Item id required");

    const existingItemData = await dynamoDb.send(new GetCommand({ TableName: Resource.Item.name, Key: { itemId: id } }));
    if (!existingItemData.Item) return sendResponse(404, "Item not found");

    await dynamoDb.send(new DeleteCommand({ TableName: Resource.Item.name, Key: { itemId: id } }));

    return sendResponse(200, "Item deleted successfully");
  } catch (error) {
    return sendResponse(500, "Error deleting item", { error: String(error) });
  }
};
