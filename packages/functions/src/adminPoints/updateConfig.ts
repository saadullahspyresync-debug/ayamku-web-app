// packages/functions/src/admin/points/updateConfig.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));


export const main = async (event: any) => {
  try {
    const body = JSON.parse(event.body);
    const userId = event.requestContext?.authorizer?.lambda?.userId;

    const config = {
      configId: "default",
      type: "conversion_rate",
      conversionRate: body.conversionRate || 10,
      minRedemptionPoints: body.minRedemptionPoints || 100,
      pointsExpiryDays: body.pointsExpiryDays || 365,
      enabled: body.enabled !== false,
      updatedAt: Date.now(),
      updatedBy: userId,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: Resource.PointsConfig.name,
        Item: config,
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: config,
        message: "Points configuration updated successfully",
      }),
    };
  } catch (error) {
    console.error("Update config error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to update points configuration",
      }),
    };
  }
};