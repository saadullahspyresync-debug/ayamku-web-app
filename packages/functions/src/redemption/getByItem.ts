// packages/functions/src/admin/redemption/getByItem.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));


export const main = async (event: any) => {
  try {
    const redeemableId = event.pathParameters?.redeemableId;

    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: Resource.RedemptionHistory.name,
        IndexName: "redeemableIndex",
        KeyConditionExpression: "redeemableId = :redeemableId",
        ExpressionAttributeValues: {
          ":redeemableId": redeemableId,
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result.Items || [],
      }),
    };
  } catch (error) {
    console.error("Get redemptions by item error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to fetch redemptions for item",
      }),
    };
  }
};