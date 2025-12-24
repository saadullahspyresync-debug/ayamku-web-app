import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = Resource.User.name;

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, data }),
});

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    const { id } = event.pathParameters || {};
    if (!id) return sendResponse(400, "User id required");

    const result = await dynamoDb.send(new GetCommand({ TableName: TABLE, Key: { userId: id } }));

    if (!result.Item) return sendResponse(404, "User not found");

    const { password, ...user } = result.Item;
    return sendResponse(200, "User fetched successfully", user);
  } catch (error) {
    return sendResponse(500, "Error fetching user", { error: String(error) });
  }
};
