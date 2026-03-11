import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent } from "aws-lambda";
import { Resource } from "sst";

const ORDERS_TABLE = Resource.Order.name;
const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ message, ...data }),
});

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    // 1. Get orderId from path parameters (e.g., /orders/{id})
    const orderId = event.pathParameters?.id;

    if (!orderId) {
      return sendResponse(400, "Order ID is required");
    }

    // 2. Fetch the specific order using GetCommand (Primary Key lookup)
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: ORDERS_TABLE,
        Key: { orderId: orderId }, // Matches the hashKey in your storage.ts
      })
    );

    if (!result.Item) {
      return sendResponse(404, "Order not found");
    }

    // 3. Security Check: Ensure the order belongs to the requesting user
    const userId = event?.requestContext?.authorizer?.lambda?.userId;
    if (userId && result.Item.userId !== userId) {
        return sendResponse(403, "You do not have permission to view this order");
    }

    return sendResponse(200, "Order fetched successfully", { order: result.Item });
  } catch (err) {
    console.error("Fetch order error:", err);
    return sendResponse(500, "Error fetching order", { error: String(err) });
  }
};