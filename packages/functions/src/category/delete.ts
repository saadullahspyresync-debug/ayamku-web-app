import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent } from "aws-lambda";
import { Resource } from "sst";

const TABLE = Resource.Category.name;
const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const sendResponse = (status: number, message: string) => ({
  statusCode: status,
  body: JSON.stringify({ message }),
});

export const main = async (event:APIGatewayProxyEvent, user : any) => {
  try {
    const categoryId = event.pathParameters?.id;
    if (!categoryId) return sendResponse(400, "Category ID required");

    const existing = await dynamoDb.send(new GetCommand({ TableName: TABLE, Key: { categoryId } }));
    if (!existing.Item) return sendResponse(404, "Category not found");

    await dynamoDb.send(new DeleteCommand({ TableName: TABLE, Key: { categoryId } }));


    return sendResponse(200, "Category deleted successfully");
  } catch (err) {
    return sendResponse(500, "Error deleting category");
  }
};
