import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent } from "aws-lambda";
import { Resource } from "sst";

const ORDERS_TABLE = Resource.Order.name;
const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, ...data }),
});

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    const userId = event?.requestContext?.authorizer?.lambda?.userId || "test-user";
    if (!userId) return sendResponse(401, "Unauthorized");

    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: ORDERS_TABLE,
        IndexName: "userIndex", // make sure a GSI exists on userId
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": userId },
        ScanIndexForward: false, // newest first
      })
    );

    const orders = result.Items || [];

    return sendResponse(200, "Orders fetched successfully", { orders });
  } catch (err) {
    return sendResponse(500, "Error fetching orders", { error: String(err) });
  }
};
