import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));


export const main = async (event: any) => {
  try {
    const userId = event.requestContext?.authorizer?.lambda?.userId;
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "User ID missing from authorization context",
        }),
      };
    }

    // ✅ 1. Get user record
    const userResult = await dynamoDb.send(
      new GetCommand({
        TableName: Resource.User.name,
        Key: { userId },
      })
    );

    const user = userResult.Item;
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          message: "User not found",
        }),
      };
    }

    const totalPoints = user.points || 0;

    // ✅ 2. Fetch latest points transactions
    const transactionsResult = await dynamoDb.send(
      new QueryCommand({
        TableName: Resource.PointsTransaction.name,
        IndexName: "userIndex", // Make sure GSI exists
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
        ScanIndexForward: false, // latest first
        Limit: 20,
      })
    );

    const transactions = transactionsResult.Items || [];

    // ✅ 3. Fetch latest redemptions
    const redemptionsResult = await dynamoDb.send(
      new QueryCommand({
        TableName: Resource.RedemptionHistory.name,
        IndexName: "userIndex", // Make sure this GSI also exists
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
        ScanIndexForward: false,
        Limit: 20,
      })
    );

    const redemptions = redemptionsResult.Items || [];

    // ✅ 4. Compute basic stats (optional)
    const earnedPoints = transactions
      .filter((t) => t.type === "earn")
      .reduce((sum, t) => sum + (t.points || 0), 0);

    const redeemedPoints = transactions
      .filter((t) => t.type === "redeem")
      .reduce((sum, t) => sum + (t.points || 0), 0);

    // ✅ 5. Return clean response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          userId,
          totalPoints,
          earnedPoints,
          redeemedPoints,
          transactions,
          redemptions,
        },
      }),
    };
  } catch (error) {
    console.error("❌ Error fetching points balance:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to fetch points balance",
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};
