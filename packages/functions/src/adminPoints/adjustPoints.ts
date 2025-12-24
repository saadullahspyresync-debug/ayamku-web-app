// packages/functions/src/admin/points/adjustPoints.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { ulid } from "ulid";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const main = async (event: any) => {
  try {
    const body = JSON.parse(event.body);
    const adminId = event.requestContext?.authorizer?.lambda?.userId;

    const { userId, points, reason } = body;

    if (!userId || points === undefined || !reason) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Missing required fields: userId, points, reason",
        }),
      };
    }

    // Get user's current balance
    const userResult = await dynamoDb.send(
      new GetCommand({
        TableName: Resource.User.name,
        Key: { userId },
      })
    );

    if (!userResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          message: "User not found",
        }),
      };
    }

    const currentPoints = userResult.Item.points || 0;
    const newBalance = currentPoints + points;

    // Prevent negative balance
    if (newBalance < 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Cannot set negative points balance",
        }),
      };
    }

    // Update user's points
    await dynamoDb.send(
      new PutCommand({
        TableName: Resource.User.name,
        Item: {
          ...userResult.Item,
          points: newBalance,
          updatedAt: Date.now(),
        },
      })
    );

    // Create transaction record
    const transaction = {
      transactionId: ulid(),
      userId,
      userName: userResult.Item.name,
      userEmail: userResult.Item.email,
      type: "admin_adjust",
      points,
      balanceAfter: newBalance,
      description: `Admin adjustment: ${reason}`,
      metadata: {
        reason,
        adminId,
      },
      createdAt: Date.now(),
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: Resource.PointsTransaction.name,
        Item: transaction,
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          transaction,
          newBalance,
        },
        message: "Points adjusted successfully",
      }),
    };
  } catch (error) {
    console.error("Adjust points error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to adjust points",
      }),
    };
  }
};