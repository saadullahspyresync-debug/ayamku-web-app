import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";

const TABLE = "Users";
const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, ...data }),
});

export const main = async (event: APIGatewayProxyEvent, user?: any) => {
  try {
    if (!user) return sendResponse(401, "Not authenticated");
    if (!event.body) return sendResponse(400, "Request body missing");

    const updates = JSON.parse(event.body);
    const userId = user.userId;

    const existing = await dynamoDb.send(new GetCommand({ TableName: TABLE, Key: { userId } }));
    if (!existing.Item) return sendResponse(404, "User not found");

    if (updates.password) updates.password = await bcrypt.hash(updates.password, 10);

    const updatedUser = { ...existing.Item, ...updates, updatedAt: Date.now() };

    await dynamoDb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { userId },
      UpdateExpression: "SET #data = :data",
      ExpressionAttributeNames: { "#data": "data" },
      ExpressionAttributeValues: { ":data": updatedUser },
    }));

    const { password, ...safeUser } = updatedUser;
    return sendResponse(200, "Profile updated", safeUser);
  } catch (err) {
    return sendResponse(500, "Error updating profile", { error: String(err) });
  }
};
