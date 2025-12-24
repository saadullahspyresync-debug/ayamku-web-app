import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
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
    if (!event.body) return sendResponse(400, "No body provided");

    const body = JSON.parse(event.body);
    delete body.password; // don’t allow password updates here

    const existingUser = await dynamoDb.send(new GetCommand({ TableName: TABLE, Key: { userId: id } }));
    if (!existingUser.Item) return sendResponse(404, "User not found");

    const updatedUser = { ...existingUser.Item, ...body };

    await dynamoDb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { userId: id },
      UpdateExpression: "SET #data = :data",
      ExpressionAttributeNames: { "#data": "data" },
      ExpressionAttributeValues: { ":data": updatedUser },
    }));

    const { password, ...safeUser } = updatedUser;
    return sendResponse(200, "User updated successfully", safeUser);
  } catch (error) {
    return sendResponse(500, "Error updating user", { error: String(error) });
  }
};
