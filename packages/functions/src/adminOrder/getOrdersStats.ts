import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { Resource } from "sst";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = Resource.Order.name;

export const main: APIGatewayProxyHandler = async () => {
  try {
    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: TABLE,
      })
    );
    const orders = result.Items || [];

    let totalOrders = 0;
    let totalRevenue = 0;
    let pendingOrders = 0;
    let completedOrders = 0;
    let cancelledOrders = 0;

    orders.forEach((order: any) => {
      totalOrders += 1;

      // Safely unwrap DynamoDB attribute types
      const totalPrice =
        Number(order.totalPrice?.N) || Number(order.totalPrice) || 0;
      const status = order.status?.S || order.status || "unknown";

      totalRevenue += totalPrice;

      switch (status.toLowerCase()) {
        case "pending":
          pendingOrders += 1;
          break;
        case "completed":
          completedOrders += 1;
          break;
        case "cancelled":
          cancelledOrders += 1;
          break;
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
      }),
    };
  } catch (err) {
    console.error("Error fetching order stats:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to fetch order stats",
        error: err instanceof Error ? err.message : err,
      }),
    };
  }
};
