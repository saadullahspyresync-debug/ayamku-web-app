// packages/functions/src/admin/points/getConfig.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const main = async (event: any) => {
  try {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: Resource.PointsConfig.name,
        Key: { configId: "default" },
      })
    );

    // If no config exists, return default values
    const config = result.Item || {
      configId: "default",
      conversionRate: 10,
      minRedemptionPoints: 100,
      pointsExpiryDays: 365,
      enabled: true,
      updatedAt: Date.now(),
    };

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: config,
      }),
    };
  } catch (error) {
    console.error("Get config error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to get points configuration",
      }),
    };
  }
};