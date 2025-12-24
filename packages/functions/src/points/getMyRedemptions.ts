// packages/functions/src/points/getMyRedemptions.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));


export const main = async (event: any) => {
  try {
    const userId = event.requestContext?.authorizer?.lambda?.userId;

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          message: "Unauthorized",
        }),
      };
    }

    // Get user's redemptions
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: Resource.RedemptionHistory.name,
        IndexName: "userIndex",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
        ScanIndexForward: false, // Sort by redeemedAt descending
      })
    );

    const redemptions = result.Items || [];

    // Filter for pending redemptions only (for checkout use)
    const pendingRedemptions = redemptions.filter(
      (r) => r.status === "pending"
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: pendingRedemptions,
      }),
    };
  } catch (error) {
    console.error("Get my redemptions error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to fetch redemptions",
      }),
    };
  }
};