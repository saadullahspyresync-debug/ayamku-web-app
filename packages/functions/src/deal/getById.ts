import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent } from "aws-lambda";
import { Resource } from "sst";

const TABLE = Resource.Item.name;
const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, ...data }),
});

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    const itemId = event.pathParameters?.id;
    if (!itemId) return sendResponse(400, "Deal ID required");

    const result = await dynamoDb.send(new GetCommand({ TableName: TABLE, Key: { itemId } }));
    if (!result.Item || !result.Item.isCombo) return sendResponse(404, "Deal not found");

    return sendResponse(200, "Deal fetched successfully", { deal: result.Item });
  } catch (err) {
    return sendResponse(500, "Error fetching deal", { error: String(err) });
  }
};
