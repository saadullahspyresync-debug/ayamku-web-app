import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent } from "aws-lambda";
import { Resource } from "sst";

const TABLE = Resource.Item.name;
const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const sendResponse = (status: number, message: string) => ({
  statusCode: status,
  body: JSON.stringify({ message }),
});

export const main = async (event: APIGatewayProxyEvent, user: any) => {
  try {
    const itemId = event.pathParameters?.id;
    if (!itemId) return sendResponse(400, "Deal ID required");

    const existing = await dynamoDb.send(new GetCommand({ TableName: TABLE, Key: { itemId } }));
    if (!existing.Item || !existing.Item.isCombo) return sendResponse(404, "Deal not found");

    await dynamoDb.send(new DeleteCommand({ TableName: TABLE, Key: { itemId } }));


    return sendResponse(200, "Deal deleted successfully");
  } catch (err) {
    return sendResponse(500, "Error deleting deal");
  }
};
