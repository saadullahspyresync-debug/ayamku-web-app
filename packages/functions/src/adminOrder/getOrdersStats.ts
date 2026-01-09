import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent } from "aws-lambda";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ORDERS_TABLE = Resource.Order.name;

const response = (status: number, body: any) => ({
  statusCode: status,
  body: JSON.stringify(body),
});

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    const auth = event.requestContext.authorizer?.lambda;
    if (!auth) {
      return response(401, { message: "Unauthorized" });
    }

    const { userId, userRole } = auth;
    const branchId = event?.queryStringParameters?.branchId;

    let filterExpression: string | undefined;
    let expressionValues: Record<string, any> | undefined;

    /* ================= BRANCH RESTRICTION ================= */
    let enforcedBranchId: string | null = null;

    if (userRole === "Branch_Manager") {
      // 🔒 get assigned branchId
      const bm = await dynamoDb.send(
        new QueryCommand({
          TableName: Resource.BranchManager.name,
          IndexName: "userIndex", // 👈 GSI
          KeyConditionExpression: "userId = :uid",
          ExpressionAttributeValues: {
            ":uid": userId,
          },
          Limit: 1,
        })
      );

      const item = bm.Items?.[0];
      enforcedBranchId = item?.branchId;

      if (!enforcedBranchId) {
        return response(403, "Branch not assigned");
      }
    }

    // 🔒 Branch Manager → FORCE their branch
    if (userRole === "Branch_Manager") {
      filterExpression = "branchId = :branchId";
      expressionValues = { ":branchId": enforcedBranchId };
    }

    // 🧠 Admin → filter only when branch selected
    if (userRole === "Admin" && branchId && branchId !== "all") {
      filterExpression = "branchId = :branchId";
      expressionValues = { ":branchId": branchId };
    }
    

    const scanResult = await dynamoDb.send(
      new ScanCommand({
        TableName: ORDERS_TABLE,
        ...(filterExpression && {
          FilterExpression: filterExpression,
          ExpressionAttributeValues: expressionValues,
        }),
      })
    );

    const orders = scanResult.Items || [];

    // 📊 Compute stats safely
    let totalOrders = 0;
    let pendingOrders = 0;
    let completedOrders = 0;
    let cancelledOrders = 0;
    let totalRevenue = 0;

    for (const order of orders) {
      totalOrders++;

      const status = order.status?.toLowerCase?.() || "unknown";

      // ✅ SAFELY EXTRACT PRICE
      const price =
        Number(order.totalPrice) ||
        Number(order.totalAmount) ||
        Number(order.totalPrice?.N) ||
        0;

      if (status === "completed") {
        completedOrders++;
        totalRevenue += price;
      } else if (status === "pending") {
        pendingOrders++;
      } else if (status === "cancelled") {
        cancelledOrders++;
      }
    }

    const averageRevenue =
      completedOrders > 0 ? totalRevenue / completedOrders : 0;

    return response(200, {
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      averageRevenue,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return response(500, { message: "Failed to fetch stats" });
  }
};