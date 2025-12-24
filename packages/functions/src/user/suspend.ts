import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = Resource.User.name;

interface User {
  userId: string;
  email?: string;
  password?: string;
  isActive: boolean;
  [key: string]: any; // for any other fields
}

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, data }),
});

export const main = async (event: APIGatewayProxyEvent, user?: any) => {
  try {
    const { id } = event.pathParameters || {};
    if (!id) return sendResponse(400, "User id required");

    const result = await dynamoDb.send(new GetCommand({ TableName: TABLE, Key: { userId: id } }));
    const existingUser = result.Item as User;

    if (!existingUser) return sendResponse(404, "User not found");

    const updatedUser: User = { ...existingUser, isActive: false };

    await dynamoDb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { userId: id },
      UpdateExpression: "SET #data = :data",
      ExpressionAttributeNames: { "#data": "data" },
      ExpressionAttributeValues: { ":data": updatedUser },
    }));

    // Now TypeScript knows updatedUser has a password field
    const { password, ...safeUser } = updatedUser;
    return sendResponse(200, "User suspended", safeUser);

  } catch (error) {
    return sendResponse(500, "Error suspending user", { error: String(error) });
  }
};
